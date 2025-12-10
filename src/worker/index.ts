import { Hono } from "hono";
import type { Context } from "hono";

interface Env {
	espControl: KVNamespace;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c: Context<{ Bindings: Env }>) => c.json({ name: "Talha Karasu" }));

// --- SET (GET method) ---
app.get("/set", async (c: Context<{ Bindings: Env }>) => {
	const url = new URL(c.req.url);
	const key = url.searchParams.get("key");
	const value = url.searchParams.get("value");

	if (!key || !value) {
		return c.text("Missing key or value", 400);
	}

	await c.env.espControl.put(key, value);

	return c.text(`OK: ${key}=${value}`);
});

// --- GET ---
app.get("/get", async (c: Context<{ Bindings: Env }>) => {
	const url = new URL(c.req.url);
	const key = url.searchParams.get("key");
	if (!key) return c.text("Missing key", 400);

	const value = await c.env.espControl.get(key);
	return c.text(value ?? "null");
});

// --- POST data recording (ESP32 will POST JSON) ---
app.post("/data", async (c: Context<{ Bindings: Env }>) => {
	try {
		const body = await c.req.json();
		const key = body?.deviceId;
		if (!key) return c.text("Missing deviceId in body", 400);

		const value = JSON.stringify(body);
		await c.env.espControl.put(key, value);

		return c.text("OK");
	} catch (err) {
		return c.text("Invalid JSON body", 400);
	}
});

// --- ADMIN PANEL: Get all control states ---
app.get("/admin/state", async (c: Context<{ Bindings: Env }>) => {
	const rentalActive = await c.env.espControl.get("rentalActive");
	const parkMode = await c.env.espControl.get("parkMode");
	const gpsSend = await c.env.espControl.get("gpsSend");
	const statsSend = await c.env.espControl.get("statsSend");

	return c.json({
		rentalActive: rentalActive === "true",
		parkMode: parkMode === "true",
		gpsSend: gpsSend === "true",
		statsSend: statsSend === "true",
	});
});

// --- ADMIN PANEL: Set control states ---
app.post("/admin/state", async (c: Context<{ Bindings: Env }>) => {
	try {
		const body = await c.req.json();

		if (body.rentalActive !== undefined) {
			await c.env.espControl.put("rentalActive", String(body.rentalActive));
		}
		if (body.parkMode !== undefined) {
			await c.env.espControl.put("parkMode", String(body.parkMode));
		}
		if (body.gpsSend !== undefined) {
			await c.env.espControl.put("gpsSend", String(body.gpsSend));
		}
		if (body.statsSend !== undefined) {
			await c.env.espControl.put("statsSend", String(body.statsSend));
		}

		return c.json({ ok: true });
	} catch (err) {
		return c.text("Invalid request body", 400);
	}
});

// --- CONTROL → ESP32 (like /control endpoint above) ---
app.get("/control", async (c: Context<{ Bindings: Env }>) => {
	const rentalActive = (await c.env.espControl.get("rentalActive")) === "true";
	const parkMode = (await c.env.espControl.get("parkMode")) === "true";
	const gpsSend = (await c.env.espControl.get("gpsSend")) === "true";
	const statsSend = (await c.env.espControl.get("statsSend")) === "true";

	const resp =
		`rent=${rentalActive ? 1 : 0}` +
		`&park=${parkMode ? 1 : 0}` +
		`&gps=${gpsSend ? 1 : 0}` +
		`&stats=${statsSend ? 1 : 0}`;

	return c.text(resp);
});

export default app;
