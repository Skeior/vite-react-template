import { Hono } from "hono";
import type { Context } from "hono";

interface Env {
	espControl: KVNamespace;
	ADMIN_USER?: string;
	ADMIN_PASS?: string;
}

// Unique Trip ID generator
function generateTripId(): string {
	return `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

// --- POST data recording (ESP32 binary or JSON) ---
app.post("/data", async (c: Context<{ Bindings: Env }>) => {
	try {
		// Try JSON first
		let body: any = null;
		try {
			body = await c.req.json();
		} catch (e) {
			// If not JSON, try binary packet parsing
			const buffer = await c.req.arrayBuffer();
			const bytes = new Uint8Array(buffer);
			
			if (bytes[0] === 0x02 && bytes[bytes.length - 1] === 0x03) {
				// Valid binary packet: [START][DEV][MOD][PROP][LEN][...DATA...][CRC][STOP]
				const deviceId = `device_${bytes[1].toString(16).padStart(2, '0')}`;
				const mod = bytes[2];
				const prop = bytes[3];
				const len = bytes[4];
				const data = new TextDecoder().decode(bytes.slice(5, 5 + len));

				// Parse based on module/property
				const now = new Date().toISOString();

				if (mod === 0x01 && prop === 0x02) {
					// MOD_GPS: data = "lat,lon,speed"
					const parts = data.split(",");
					if (parts.length >= 3) {
						body = {
							deviceId,
							lat: parseFloat(parts[0]),
							lon: parseFloat(parts[1]),
							speed: parseFloat(parts[2]),
							timestamp: now,
						};
					}
				} else if (mod === 0x20 && prop === 0x01) {
					// MOD_STATS: data = "km=X.XXX,avg=X.XX,time=XXXXX"
					const obj: any = { deviceId, timestamp: now };
					data.split(",").forEach((pair) => {
						const [k, v] = pair.split("=");
						if (k === "km") obj.totalDistance = parseFloat(v);
						if (k === "avg") obj.avgSpeed = parseFloat(v);
						if (k === "time") obj.tripDuration = parseInt(v);
					});
					body = obj;
				} else if (mod === 0x10 && prop === 0x01) {
					// MOD_MPU: motion detection
					body = { deviceId, motion: true, timestamp: now };
				}
			}
		}

		if (!body || !body.deviceId) return c.text("Invalid request", 400);

		// Merge with existing device data
		const key = body.deviceId;
		const existing = await c.env.espControl.get(key);
		let merged = body;
		
		// Eğer yeni trip verisi ise (totalDistance, avgSpeed, tripDuration varsa), trip ID ata
		if (body.tripDuration !== undefined || body.totalDistance !== undefined) {
			if (body.tripId === undefined) {
				body.tripId = generateTripId();
			}
		}
		
		if (existing) {
			try {
				const prev = JSON.parse(existing);
				merged = { ...prev, ...body };
			} catch (e) {}
		}

		await c.env.espControl.put(key, JSON.stringify(merged));
		return c.text("OK");
	} catch (err) {
		console.error(err);
		return c.text("Invalid request body", 400);
	}
});

// --- DEMO: Initialize with test data ---
app.get("/demo/init", async (c: Context<{ Bindings: Env }>) => {
	const now = new Date().toISOString();
	
	// Demo GPS Data
	const gpsData = {
		deviceId: "device_ab",
		lat: 40.7128,
		lon: 29.9060,
		speed: 65.5,
		timestamp: now,
	};
	
	// Demo Stats Data
	const statsData = {
		deviceId: "device_ab",
		totalDistance: 12.345,
		avgSpeed: 45.67,
		tripDuration: 3661, // 1 saat 1 dakika 1 saniye
		timestamp: now,
	};
	
	// Merge both into one device record
	const merged = { ...gpsData, ...statsData };
	
	await c.env.espControl.put("device_ab", JSON.stringify(merged));
	
	return c.json({ 
		ok: true, 
		message: "Demo data initialized",
		device: merged 
	});
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

// --- ADMIN: list devices and last data ---
app.get("/admin/devices", async (c: Context<{ Bindings: Env }>) => {
	try {
		const url = new URL(c.req.url);
		const limitParam = url.searchParams.get("limit");
		const limit = limitParam ? Math.min(1000, Number(limitParam)) : 100;

		const list = await c.env.espControl.list({ limit });
		const keys = list.keys.map(k => k.name).filter(n => n && n !== "rentalActive" && n !== "parkMode" && n !== "gpsSend" && n !== "statsSend");

		const results = await Promise.all(keys.map(async (name) => {
			try {
				const v = await c.env.espControl.get(name);
				let parsed: any = null;
				try { parsed = v ? JSON.parse(v) : null; } catch (e) { parsed = v; }
				return { deviceId: name, value: parsed };
			} catch (e) {
				return { deviceId: name, value: null };
			}
		}));

		return c.json({ devices: results });
	} catch (err) {
		return c.text("Error listing devices", 500);
	}
});

// --- ADMIN: Delete device ---
app.delete("/admin/devices/:deviceId", async (c: Context<{ Bindings: Env }>) => {
	try {
		const deviceId = c.req.param("deviceId");
		if (!deviceId) return c.text("Missing deviceId", 400);
		
		await c.env.espControl.delete(deviceId);
		return c.json({ ok: true, message: `${deviceId} silindi` });
	} catch (err) {
		return c.text("Error deleting device", 500);
	}
});

// --- ADMIN: Delete all devices ---
app.delete("/admin/devices", async (c: Context<{ Bindings: Env }>) => {
	try {
		const list = await c.env.espControl.list({ limit: 1000 });
		const controlKeys = ["rentalActive", "parkMode", "gpsSend", "statsSend"];
		
		for (const key of list.keys) {
			if (key.name && !controlKeys.includes(key.name)) {
				await c.env.espControl.delete(key.name);
			}
		}
		
		return c.json({ ok: true, message: "Tüm cihazlar silindi" });
	} catch (err) {
		return c.text("Error deleting devices", 500);
	}
});

// --- ADMIN: Get trips with filtering and sorting ---
app.get("/admin/trips", async (c: Context<{ Bindings: Env }>) => {
	try {
		const url = new URL(c.req.url);
		const deviceId = url.searchParams.get("deviceId");
		const sortBy = url.searchParams.get("sortBy") || "timestamp"; // timestamp, speed, distance, duration
		const limit = Math.min(1000, Number(url.searchParams.get("limit")) || 100);

		const list = await c.env.espControl.list({ limit });
		const controlKeys = ["rentalActive", "parkMode", "gpsSend", "statsSend"];
		
		// Filter ve collect trips
		const trips: any[] = [];
		
		for (const key of list.keys) {
			if (key.name && !controlKeys.includes(key.name)) {
				const v = await c.env.espControl.get(key.name);
				if (v) {
					try {
						const data = JSON.parse(v);
						// Trip tanımı: tripId ve en az bir stats alanı olması
						if (data.tripId && (data.totalDistance !== undefined || data.avgSpeed !== undefined || data.tripDuration !== undefined)) {
							// Eğer deviceId filtresi varsa kontrol et
							if (deviceId && data.deviceId !== deviceId) continue;
							
							trips.push({
								tripId: data.tripId,
								deviceId: data.deviceId,
								lat: data.lat,
								lon: data.lon,
								speed: data.speed,
								totalDistance: data.totalDistance,
								avgSpeed: data.avgSpeed,
								tripDuration: data.tripDuration,
								timestamp: data.timestamp,
							});
						}
					} catch (e) {
						// Skip invalid JSON
					}
				}
			}
		}

		// Sort trips
		trips.sort((a, b) => {
			switch (sortBy) {
				case "speed":
					return (b.speed || 0) - (a.speed || 0);
				case "distance":
					return (b.totalDistance || 0) - (a.totalDistance || 0);
				case "duration":
					return (b.tripDuration || 0) - (a.tripDuration || 0);
				case "timestamp":
				default:
					return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime();
			}
		});

		// Group by deviceId
		const grouped: { [key: string]: any[] } = {};
		trips.forEach(trip => {
			if (!grouped[trip.deviceId]) {
				grouped[trip.deviceId] = [];
			}
			grouped[trip.deviceId].push(trip);
		});

		return c.json({ 
			ok: true,
			trips,
			grouped,
			sortedBy: sortBy,
			total: trips.length
		});
	} catch (err) {
		console.error(err);
		return c.text("Error fetching trips", 500);
	}
});

// --- RENTAL: Start rental for a device ---
app.post("/rental/start", async (c: Context<{ Bindings: Env }>) => {
	try {
		const body = await c.req.json();
		const { deviceId } = body;
		
		if (!deviceId) return c.text("Missing deviceId", 400);
		
		// Check if device is already rented
		const existing = await c.env.espControl.get(deviceId);
		if (existing) {
			try {
				const data = JSON.parse(existing);
				if (data.rentalActive === "true" || data.rentalActive === true) {
					return c.json({ ok: false, error: "Device already rented" }, { status: 409 });
				}
			} catch (e) {}
		}
		
		// Start rental
		const tripId = generateTripId();
		const now = new Date().toISOString();
		
		const rentalData = {
			deviceId,
			rentalActive: "true",
			parkMode: "false",
			gpsSend: "true",
			statsSend: "false",
			tripId,
			rentalStartTime: now,
		};
		
		await c.env.espControl.put(deviceId, JSON.stringify(rentalData));
		
		return c.json({ 
			ok: true, 
			message: `${deviceId} rented`, 
			tripId,
			rentalStartTime: now 
		});
	} catch (err) {
		console.error(err);
		return c.text("Error starting rental", 400);
	}
});

// --- RENTAL: End rental for a device ---
app.post("/rental/end", async (c: Context<{ Bindings: Env }>) => {
	try {
		const body = await c.req.json();
		const { deviceId } = body;
		
		if (!deviceId) return c.text("Missing deviceId", 400);
		
		const existing = await c.env.espControl.get(deviceId);
		if (!existing) {
			return c.json({ ok: false, error: "Device not found" }, { status: 404 });
		}
		
		const data = JSON.parse(existing);
		
		if (data.rentalActive !== "true" && data.rentalActive !== true) {
			return c.json({ ok: false, error: "Device is not rented" }, { status: 409 });
		}
		
		// End rental
		const rentalEndData = {
			...data,
			rentalActive: "false",
			parkMode: "true",
			gpsSend: "true",
			statsSend: "true",
			rentalEndTime: new Date().toISOString(),
		};
		
		await c.env.espControl.put(deviceId, JSON.stringify(rentalEndData));
		
		return c.json({ 
			ok: true, 
			message: `${deviceId} rental ended`,
			tripId: data.tripId 
		});
	} catch (err) {
		console.error(err);
		return c.text("Error ending rental", 400);
	}
});

// --- RENTAL: Get rental status for a device ---
app.get("/rental/status/:deviceId", async (c: Context<{ Bindings: Env }>) => {
	try {
		const deviceId = c.req.param("deviceId");
		const data = await c.env.espControl.get(deviceId);
		
		if (!data) {
			return c.json({ deviceId, rentalActive: false, tripId: null });
		}
		
		try {
			const parsed = JSON.parse(data);
			return c.json({
				deviceId,
				rentalActive: parsed.rentalActive === "true" || parsed.rentalActive === true,
				tripId: parsed.tripId || null,
				parkMode: parsed.parkMode,
				gpsSend: parsed.gpsSend,
				statsSend: parsed.statsSend,
				rentalStartTime: parsed.rentalStartTime,
			});
		} catch (e) {
			return c.json({ deviceId, rentalActive: false, tripId: null });
		}
	} catch (err) {
		return c.text("Error getting rental status", 500);
	}
});

// --- RENTAL: Control device during rental ---
app.post("/rental/control/:deviceId", async (c: Context<{ Bindings: Env }>) => {
	try {
		const deviceId = c.req.param("deviceId");
		const body = await c.req.json();
		const { parkMode, gpsSend, statsSend } = body;
		
		const existing = await c.env.espControl.get(deviceId);
		if (!existing) return c.text("Device not found", 404);
		
		const data = JSON.parse(existing);
		
		if (data.rentalActive !== "true" && data.rentalActive !== true) {
			return c.json({ ok: false, error: "Device is not rented" }, { status: 409 });
		}
		
		// Update control parameters
		const updated = { ...data };
		if (parkMode !== undefined) updated.parkMode = String(parkMode);
		if (gpsSend !== undefined) updated.gpsSend = String(gpsSend);
		if (statsSend !== undefined) updated.statsSend = String(statsSend);
		
		await c.env.espControl.put(deviceId, JSON.stringify(updated));
		
		return c.json({ ok: true, message: "Device control updated" });
	} catch (err) {
		return c.text("Error updating device control", 400);
	}
});

export default app;
