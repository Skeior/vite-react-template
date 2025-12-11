import { Hono } from "hono";
import type { Context } from "hono";

interface Env {
	DB: D1Database;
	ADMIN_USER?: string;
	ADMIN_PASS?: string;
}

// Unique Trip ID generator
function generateTripId(): string {
	return `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c: Context<{ Bindings: Env }>) => c.json({ name: "Talha Karasu" }));

// ===================== D1 HELPER FUNCTIONS =====================

// Device'ı D1'den al veya oluştur
async function getOrCreateDevice(db: D1Database, deviceId: string): Promise<any> {
	const result = await db.prepare("SELECT * FROM devices WHERE device_id = ?").bind(deviceId).first();
	if (result) {
		return {
			deviceId: result.device_id,
			lat: result.lat,
			lon: result.lon,
			speed: result.speed,
			totalDistance: result.total_distance,
			avgSpeed: result.avg_speed,
			tripDuration: result.trip_duration,
			rentalActive: result.rental_active === 1,
			parkMode: result.park_mode === 1,
			gpsSend: result.gps_send === 1,
			statsSend: result.stats_send === 1,
			tripId: result.trip_id,
			parkDuration: result.park_duration,
			parkStartTime: result.park_start_time,
			motionDetected: result.motion_detected === 1,
			motionDetectedAt: result.last_motion_time, // AdminPanel bekliyor
			lastMotionTime: result.last_motion_time,
			updatedAt: result.updated_at,
			createdAt: result.created_at,
		};
	}
	return null;
}

// Device güncelle veya oluştur
async function upsertDevice(db: D1Database, device: any): Promise<void> {
	const now = new Date().toISOString();
	await db.prepare(`
		INSERT INTO devices (device_id, lat, lon, speed, total_distance, avg_speed, trip_duration, 
			rental_active, park_mode, gps_send, stats_send, trip_id, park_duration, park_start_time,
			motion_detected, last_motion_time, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(device_id) DO UPDATE SET
			lat = COALESCE(excluded.lat, devices.lat),
			lon = COALESCE(excluded.lon, devices.lon),
			speed = COALESCE(excluded.speed, devices.speed),
			total_distance = COALESCE(excluded.total_distance, devices.total_distance),
			avg_speed = COALESCE(excluded.avg_speed, devices.avg_speed),
			trip_duration = COALESCE(excluded.trip_duration, devices.trip_duration),
			rental_active = COALESCE(excluded.rental_active, devices.rental_active),
			park_mode = COALESCE(excluded.park_mode, devices.park_mode),
			gps_send = COALESCE(excluded.gps_send, devices.gps_send),
			stats_send = COALESCE(excluded.stats_send, devices.stats_send),
			trip_id = COALESCE(excluded.trip_id, devices.trip_id),
			park_duration = COALESCE(excluded.park_duration, devices.park_duration),
			park_start_time = excluded.park_start_time,
			motion_detected = COALESCE(excluded.motion_detected, devices.motion_detected),
			last_motion_time = excluded.last_motion_time,
			updated_at = excluded.updated_at
	`).bind(
		device.deviceId,
		device.lat ?? null,
		device.lon ?? null,
		device.speed ?? null,
		device.totalDistance ?? null,
		device.avgSpeed ?? null,
		device.tripDuration ?? null,
		device.rentalActive ? 1 : 0,
		device.parkMode ? 1 : 0,
		device.gpsSend !== false ? 1 : 0,
		device.statsSend !== false ? 1 : 0,
		device.tripId ?? null,
		device.parkDuration ?? 0,
		device.parkStartTime ?? null,
		device.motionDetected ? 1 : 0,
		device.lastMotionTime ?? null,
		now
	).run();
}

// ===================== API ENDPOINTS =====================

// --- POST data recording (ESP32 binary or JSON) ---
app.post("/data", async (c: Context<{ Bindings: Env }>) => {
	try {
		let body: any = null;
		const contentType = c.req.header('Content-Type') || '';
		
		if (contentType.includes('application/json')) {
			try {
				body = await c.req.json();
			} catch (e) {
				return c.text("Invalid JSON", 400);
			}
		} else {
			// Binary packet parsing
			const buffer = await c.req.arrayBuffer();
			const bytes = new Uint8Array(buffer);
			
			if (bytes[0] === 0x02 && bytes[bytes.length - 1] === 0x03) {
				const mod = bytes[2];
				const prop = bytes[3];
				const len = bytes[4];
				const data = new TextDecoder().decode(bytes.slice(5, 5 + len));
				const now = new Date().toISOString();

				if (mod === 0x01 && prop === 0x02) {
					// MOD_GPS
					const pipeIdx = data.indexOf('|');
					const deviceId = pipeIdx > 0 ? data.substring(0, pipeIdx) : `device_${bytes[1].toString(16).padStart(2, '0')}`;
					const gpsData = pipeIdx > 0 ? data.substring(pipeIdx + 1) : data;
					const parts = gpsData.split(",");
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
					// MOD_STATS
					const pipeIdx = data.indexOf('|');
					const deviceId = pipeIdx > 0 ? data.substring(0, pipeIdx) : `device_${bytes[1].toString(16).padStart(2, '0')}`;
					const statsData = pipeIdx > 0 ? data.substring(pipeIdx + 1) : data;
					const obj: any = { deviceId, timestamp: now };
					statsData.split(",").forEach((pair) => {
						const [k, v] = pair.split("=");
						if (k === "km") obj.totalDistance = parseFloat(v);
						if (k === "avg") obj.avgSpeed = parseFloat(v);
						if (k === "time") obj.tripDuration = parseInt(v);
					});
					body = obj;
				} else if (mod === 0x10 && prop === 0x01) {
					// MOD_MPU: motion detection
					const pipeIdx = data.indexOf('|');
					const deviceId = pipeIdx > 0 ? data.substring(0, pipeIdx) : `device_${bytes[1].toString(16).padStart(2, '0')}`;
					body = { deviceId, motion: true, timestamp: now };
				}
			}
		}

		if (!body || !body.deviceId) return c.text("Invalid request", 400);

		// D1'den mevcut device'ı al
		const existing = await getOrCreateDevice(c.env.DB, body.deviceId);
		
		// Merge data - yeni cihaz için başlangıç değerleri pasif modda
		const merged = existing ? { ...existing, ...body } : { 
			...body, 
			rentalActive: false, 
			parkMode: false, 
			gpsSend: true, 
			statsSend: true 
		};
		
		// D1'e kaydet
		await upsertDevice(c.env.DB, merged);
		
		// Eğer rental aktifse ve GPS verisi varsa, route point'i trip'e ekle
		if (merged.rentalActive && merged.tripId && body.lat && body.lon) {
			try {
				// Mevcut trip'i al
				const trip = await c.env.DB.prepare("SELECT realtime_route FROM trips WHERE trip_id = ?")
					.bind(merged.tripId)
					.first();
				
				if (trip) {
					// Mevcut route'u parse et
					let routePoints: any[] = [];
					if (trip.realtime_route) {
						try {
							routePoints = JSON.parse(trip.realtime_route as string);
						} catch (e) {
							routePoints = [];
						}
					}
					
					// Yeni point ekle
					routePoints.push({
						lat: body.lat,
						lon: body.lon,
						timestamp: body.timestamp || new Date().toISOString()
					});
					
					// Trip'i güncelle
					await c.env.DB.prepare(
						"UPDATE trips SET realtime_route = ?, lat = ?, lon = ?, speed = ? WHERE trip_id = ?"
					).bind(
						JSON.stringify(routePoints),
						body.lat,
						body.lon,
						body.speed || 0,
						merged.tripId
					).run();
					
					console.log(`[DATA] Route point added to trip ${merged.tripId}, total points: ${routePoints.length}`);
				}
			} catch (e) {
				console.error(`[DATA] Error updating trip route:`, e);
			}
		}
		
		console.log(`[DATA] ${body.deviceId} updated`);
		return c.text("OK");
	} catch (err) {
		console.error(err);
		return c.text("Invalid request body", 400);
	}
});

// --- MOTION: Hareket algılama (Park Mode'da) ---
app.post("/motion", async (c: Context<{ Bindings: Env }>) => {
	try {
		const body = await c.req.json();
		const { deviceId } = body;

		if (!deviceId) return c.text("Missing deviceId", 400);

		const device = await getOrCreateDevice(c.env.DB, deviceId);
		if (!device) {
			return c.json({ ok: false, error: "Device not found" }, { status: 404 });
		}

		if (!device.parkMode) {
			return c.json({ ok: false, error: "Not in park mode" }, { status: 409 });
		}

		// Hareket algılandı
		const now = new Date().toISOString();
		await upsertDevice(c.env.DB, {
			...device,
			gpsSend: true,
			motionDetected: true,
			lastMotionTime: now,
		});

		return c.json({
			ok: true,
			message: `Motion detected for ${deviceId}`,
			deviceId,
			motionDetectedAt: now,
		});
	} catch (err) {
		console.error(err);
		return c.text("Error processing motion", 400);
	}
});

// --- ADMIN PANEL: Get control states ---
app.get("/admin/state", async (c: Context<{ Bindings: Env }>) => {
	const url = new URL(c.req.url);
	const deviceId = url.searchParams.get("deviceId");

	if (deviceId) {
		const device = await getOrCreateDevice(c.env.DB, deviceId);
		if (device) {
			return c.json({
				deviceId,
				rentalActive: device.rentalActive,
				parkMode: device.parkMode,
				gpsSend: device.gpsSend,
				statsSend: device.statsSend,
				tripId: device.tripId || null,
			});
		}
	}

	// Varsayılan değerler (device yok ise)
	return c.json({
		rentalActive: false,
		parkMode: false,
		gpsSend: true,
		statsSend: true,
	});
});

// --- ADMIN PANEL: Set control states ---
app.post("/admin/state", async (c: Context<{ Bindings: Env }>) => {
	try {
		const body = await c.req.json();
		const deviceId = body.deviceId;
		
		if (!deviceId) {
			return c.text("Missing deviceId", 400);
		}
		
		// Device'ı güncelle
		const device = await getOrCreateDevice(c.env.DB, deviceId);
		if (!device) {
			return c.json({ ok: false, error: "Device not found" }, { status: 404 });
		}
		
		const stateToUpdate: any = { ...device };
		if (body.rentalActive !== undefined) stateToUpdate.rentalActive = body.rentalActive;
		if (body.parkMode !== undefined) stateToUpdate.parkMode = body.parkMode;
		if (body.gpsSend !== undefined) stateToUpdate.gpsSend = body.gpsSend;
		if (body.statsSend !== undefined) stateToUpdate.statsSend = body.statsSend;
		
		await upsertDevice(c.env.DB, stateToUpdate);
		return c.json({ ok: true });
	} catch (err) {
		console.error(err);
		return c.text("Invalid request body", 400);
	}
});

// --- ADMIN: list devices ---
app.get("/admin/devices", async (c: Context<{ Bindings: Env }>) => {
	try {
		const results = await c.env.DB.prepare("SELECT * FROM devices ORDER BY updated_at DESC").all();
		
		const devices = (results.results || []).map((row: any) => ({
			deviceId: row.device_id,
			value: {
				deviceId: row.device_id,
				lat: row.lat,
				lon: row.lon,
				speed: row.speed,
				totalDistance: row.total_distance,
				avgSpeed: row.avg_speed,
				tripDuration: row.trip_duration,
				rentalActive: row.rental_active === 1 ? "true" : "false",
				parkMode: row.park_mode === 1 ? "true" : "false",
				gpsSend: row.gps_send === 1 ? "true" : "false",
				statsSend: row.stats_send === 1 ? "true" : "false",
				tripId: row.trip_id,
				parkDuration: row.park_duration,
				motionDetected: row.motion_detected === 1,
				motionDetectedAt: row.last_motion_time, // AdminPanel için
				lastMotionTime: row.last_motion_time,
				timestamp: row.updated_at,
			}
		}));

		return c.json({ devices });
	} catch (err) {
		console.error(err);
		return c.text("Error listing devices", 500);
	}
});

// --- ADMIN: Delete device ---
app.delete("/admin/devices/:deviceId", async (c: Context<{ Bindings: Env }>) => {
	try {
		const deviceId = c.req.param("deviceId");
		if (!deviceId) return c.text("Missing deviceId", 400);
		
		await c.env.DB.prepare("DELETE FROM devices WHERE device_id = ?").bind(deviceId).run();
		
		return c.json({ ok: true, message: `${deviceId} silindi` });
	} catch (err) {
		return c.text("Error deleting device", 500);
	}
});

// --- ADMIN: Get trips ---
app.get("/admin/trips", async (c: Context<{ Bindings: Env }>) => {
	try {
		const url = new URL(c.req.url);
		const deviceId = url.searchParams.get("deviceId");
		const sortBy = url.searchParams.get("sortBy") || "timestamp";
		const limit = Math.min(1000, Number(url.searchParams.get("limit")) || 100);

		let query = "SELECT * FROM trips";
		const params: any[] = [];
		
		if (deviceId) {
			query += " WHERE device_id = ?";
			params.push(deviceId);
		}
		
		// Sort
		switch (sortBy) {
			case "speed":
				query += " ORDER BY avg_speed DESC";
				break;
			case "distance":
				query += " ORDER BY total_distance DESC";
				break;
			case "duration":
				query += " ORDER BY trip_duration DESC";
				break;
			default:
				query += " ORDER BY timestamp DESC";
		}
		
		query += ` LIMIT ${limit}`;
		
		const stmt = params.length > 0 
			? c.env.DB.prepare(query).bind(...params)
			: c.env.DB.prepare(query);
			
		const results = await stmt.all();
		
		const trips = (results.results || []).map((row: any) => ({
			tripId: row.trip_id,
			deviceId: row.device_id,
			lat: row.lat,
			lon: row.lon,
			speed: row.speed,
			totalDistance: row.total_distance,
			avgSpeed: row.avg_speed,
			tripDuration: row.trip_duration,
			parkDuration: row.park_duration,
			totalCost: row.total_cost,
			timestamp: row.timestamp,
			rentalEndTime: row.end_time,
			realtimeRoute: row.realtime_route ? JSON.parse(row.realtime_route) : []
		}));

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

// --- ADMIN: Get single trip by ID ---
app.get("/admin/trips/:tripId", async (c: Context<{ Bindings: Env }>) => {
	try {
		const tripId = c.req.param("tripId");
		if (!tripId) return c.text("Missing tripId", 400);
		
		const trip = await c.env.DB.prepare("SELECT * FROM trips WHERE trip_id = ?")
			.bind(tripId)
			.first();
		
		if (!trip) {
			return c.json({ ok: false, error: "Trip not found" }, { status: 404 });
		}
		
		// Parse realtime_route
		let routePoints: any[] = [];
		if (trip.realtime_route) {
			try {
				routePoints = JSON.parse(trip.realtime_route as string);
			} catch (e) {
				console.error(`[/admin/trips/:tripId] Error parsing realtime_route:`, e);
				routePoints = [];
			}
		}
		
		return c.json({
			trip: {
				tripId: trip.trip_id,
				deviceId: trip.device_id,
				lat: trip.lat,
				lon: trip.lon,
				speed: trip.speed,
				totalDistance: trip.total_distance,
				avgSpeed: trip.avg_speed,
				tripDuration: trip.trip_duration,
				parkDuration: trip.park_duration,
				totalCost: trip.total_cost,
				timestamp: trip.timestamp,
				rentalEndTime: trip.end_time,
				realtimeRoute: routePoints
			},
			routePoints: routePoints // For backward compatibility with ClientPage
		});
	} catch (err) {
		console.error(err);
		return c.text("Error fetching trip", 500);
	}
});

// --- RENTAL: Start rental ---
app.post("/rental/start", async (c: Context<{ Bindings: Env }>) => {
	try {
		const body = await c.req.json();
		const { deviceId } = body;
		
		if (!deviceId) return c.text("Missing deviceId", 400);
		
		// Mevcut cihazı kontrol et; yoksa oluştur
		let existing = await getOrCreateDevice(c.env.DB, deviceId);
		if (!existing) {
			await upsertDevice(c.env.DB, {
					deviceId,
					lat: 39.9334,
					lon: 32.8597,
				speed: 0,
				totalDistance: 0,
				avgSpeed: 0,
				tripDuration: 0,
				rentalActive: false,
				parkMode: false,
				gpsSend: true,
				statsSend: true,
				tripId: null,
				parkDuration: 0,
				parkStartTime: null,
				motionDetected: false,
				lastMotionTime: null,
			});
			existing = await getOrCreateDevice(c.env.DB, deviceId);
		}
		if (existing && existing.rentalActive) {
			return c.json({ ok: false, error: "Device already rented" }, { status: 409 });
		}
		
		const tripId = generateTripId();
		const now = new Date().toISOString();
		
		// Trip'i hemen oluştur (realtime_route boş başlar)
		await c.env.DB.prepare(`
			INSERT INTO trips (trip_id, device_id, lat, lon, speed, total_distance, avg_speed, 
				trip_duration, park_duration, total_cost, timestamp, realtime_route)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`).bind(
			tripId,
			deviceId,
			existing?.lat ?? 39.9334,
			existing?.lon ?? 32.8597,
			existing?.speed || 0,
			0, // total_distance
			0, // avg_speed
			0, // trip_duration
			0, // park_duration
			0, // total_cost
			now,
			'[]' // realtime_route boş array
		).run();
		
		// Rental başlat
		await upsertDevice(c.env.DB, {
			deviceId,
			rentalActive: true,
			parkMode: false,
			gpsSend: true,
			statsSend: true,
			tripId,
			parkDuration: 0,
			parkStartTime: null,
			totalDistance: 0,
			avgSpeed: 0,
			tripDuration: 0,
		});
		
		return c.json({ 
			ok: true, 
			message: `${deviceId} rented`, 
			tripId,
			rentalActive: true,
			rentalStartTime: now 
		});
	} catch (err) {
		console.error(err);
		return c.json({ ok: false, error: "Error starting rental", details: String(err) }, { status: 400 });
	}
});

// --- RENTAL: End rental ---
app.post("/rental/end", async (c: Context<{ Bindings: Env }>) => {
	try {
		const body = await c.req.json();
		const { deviceId } = body;
		
		if (!deviceId) return c.text("Missing deviceId", 400);
		
		const device = await getOrCreateDevice(c.env.DB, deviceId);
		if (!device) {
			return c.json({ ok: false, error: "Device not found" }, { status: 404 });
		}
		
		if (!device.rentalActive) {
			return c.json({ ok: false, error: "Device is not rented" }, { status: 409 });
		}
		
		// Park süresini hesapla
		let finalParkDuration = device.parkDuration || 0;
		if (device.parkMode && device.parkStartTime) {
			const parkDurationMs = Date.now() - device.parkStartTime;
			const parkDurationSec = Math.floor(parkDurationMs / 1000);
			finalParkDuration += parkDurationSec;
		}
		
		// Ücret hesaplama
		const totalDistance = device.totalDistance || 0;
		const tripDuration = device.tripDuration || 0;
		const driveDuration = Math.max(0, tripDuration - finalParkDuration);
		
		const kmCost = totalDistance * 1; // 1 TL/km
		const driveCost = (driveDuration / 60) * 2; // 2 TL/dk sürüş
		const parkCost = (finalParkDuration / 60) * 1; // 1 TL/dk park
		const totalCost = kmCost + driveCost + parkCost;
		
		const now = new Date().toISOString();
		
		// Trip'ten realtime route'u al
		let savedRoute: any[] = [];
		if (device.tripId) {
			const trip = await c.env.DB.prepare("SELECT realtime_route FROM trips WHERE trip_id = ?")
				.bind(device.tripId)
				.first();
			
			if (trip && trip.realtime_route) {
				try {
					savedRoute = JSON.parse(trip.realtime_route as string);
				} catch (e) {
					console.error(`[RENTAL/END] Error parsing realtime_route:`, e);
					savedRoute = [];
				}
			}
		}
		
		// Trip'i güncelle (realtime route database'den gelir, frontend'ten gelen görmezden gelinir)
		if (device.tripId) {
			await c.env.DB.prepare(`
				UPDATE trips SET 
					lat = ?,
					lon = ?,
					speed = ?,
					total_distance = ?,
					avg_speed = ?,
					trip_duration = ?,
					park_duration = ?,
					total_cost = ?,
					end_time = ?
				WHERE trip_id = ?
			`).bind(
				device.lat,
				device.lon,
				device.speed,
				totalDistance,
				device.avgSpeed,
				tripDuration,
				finalParkDuration,
				totalCost,
				now,
				device.tripId
			).run();
		}
		
		// Device'ı güncelle - rental bitti
		await upsertDevice(c.env.DB, {
			...device,
			rentalActive: false,
			parkMode: true,
			gpsSend: true,
			statsSend: true,
			parkDuration: 0,
			parkStartTime: null,
			tripId: null,
			totalDistance: 0,
			avgSpeed: 0,
			tripDuration: 0,
		});
		
		return c.json({ 
			ok: true, 
			message: `${deviceId} rental ended`,
			tripId: device.tripId,
			trip: {
				tripId: device.tripId,
				deviceId: device.deviceId,
				lat: device.lat,
				lon: device.lon,
				speed: device.speed,
				totalDistance: totalDistance,
				avgSpeed: device.avgSpeed,
				tripDuration: tripDuration,
				parkDuration: finalParkDuration,
				totalCost: totalCost,
				timestamp: device.updatedAt,
				rentalEndTime: now,
				realtimeRoute: savedRoute
			}
		});
	} catch (err) {
		console.error("[/rental/end] Error:", err);
		return c.json({ ok: false, error: "Error ending rental", details: String(err) }, { status: 400 });
	}
});

// --- RENTAL: Get rental status ---
app.get("/rental/status/:deviceId", async (c: Context<{ Bindings: Env }>) => {
	try {
		const deviceId = c.req.param("deviceId");
		const device = await getOrCreateDevice(c.env.DB, deviceId);
		
		if (!device) {
			return c.json({ deviceId, rentalActive: false, tripId: null });
		}
		
		return c.json({
			deviceId,
			rentalActive: device.rentalActive,
			tripId: device.tripId || null,
			parkMode: device.parkMode,
			gpsSend: device.gpsSend,
			statsSend: device.statsSend,
		});
	} catch (err) {
		return c.json({ ok: false, error: "Error getting rental status", details: String(err) }, { status: 500 });
	}
});

// --- RENTAL: Control device ---
app.post("/rental/control/:deviceId", async (c: Context<{ Bindings: Env }>) => {
	try {
		const deviceId = c.req.param("deviceId");
		const body = await c.req.json();
		const { parkMode, gpsSend, statsSend } = body;
		
		let device = await getOrCreateDevice(c.env.DB, deviceId);
		if (!device) {
			device = { deviceId, gpsSend: true, statsSend: true };
		}
		
		const updated = { ...device };
		
		if (parkMode !== undefined) {
			const wasParked = device.parkMode;
			const willPark = parkMode === true || parkMode === "true";
			
			// Park moduna geçiş
			if (!wasParked && willPark) {
				updated.parkStartTime = Date.now();
			}
			
			// Park modundan çıkış
			if (wasParked && !willPark && device.parkStartTime) {
				const parkDurationMs = Date.now() - device.parkStartTime;
				const parkDurationSec = Math.floor(parkDurationMs / 1000);
				updated.parkDuration = (updated.parkDuration || 0) + parkDurationSec;
				updated.parkStartTime = null;
			}
			
			updated.parkMode = willPark;
			
			if (!willPark) {
				updated.motionDetected = false;
				updated.lastMotionTime = null;
			}
		}
		
		if (gpsSend !== undefined) updated.gpsSend = gpsSend === true || gpsSend === "true";
		if (statsSend !== undefined) updated.statsSend = statsSend === true || statsSend === "true";
		
		await upsertDevice(c.env.DB, updated);
		
		return c.json({ ok: true, message: "Device control updated" });
	} catch (err) {
		return c.json({ ok: false, error: "Error updating device control", details: String(err) }, { status: 400 });
	}
});

// --- TRIP: Reset trip data ---
app.post("/trip/reset/:deviceId", async (c: Context<{ Bindings: Env }>) => {
	try {
		const deviceId = c.req.param("deviceId");
		
		// Device trip verilerini sıfırla
		const device = await getOrCreateDevice(c.env.DB, deviceId);
		if (device) {
			await upsertDevice(c.env.DB, {
				...device,
				tripId: null,
				totalDistance: 0,
				avgSpeed: 0,
				tripDuration: 0,
			});
		}
		
		// O cihaza ait tüm trip kayıtlarını sil
		const result = await c.env.DB.prepare("DELETE FROM trips WHERE device_id = ?").bind(deviceId).run();
		
		return c.json({ 
			ok: true, 
			message: `Trip data reset, ${result.meta?.changes || 0} trips deleted` 
		});
	} catch (err) {
		console.error("[trip/reset] Error:", err);
		return c.json({ ok: false, error: "Error resetting trip", details: String(err) }, { status: 400 });
	}
});

// --- ADMIN: Clear all data ---
app.post("/admin/clear-all", async (c: Context<{ Bindings: Env }>) => {
	try {
		// Tüm tabloları temizle
		await c.env.DB.prepare("DELETE FROM trips").run();
		await c.env.DB.prepare("DELETE FROM devices").run();
		await c.env.DB.prepare("DELETE FROM device_state").run();
		
		return c.json({ 
			ok: true, 
			message: "All data cleared successfully"
		});
	} catch (err) {
		console.error("Clear all error:", err);
		return c.json({ ok: false, error: "Error clearing data", details: String(err) }, { status: 500 });
	}
});

// --- Eski endpoint'ler (geriye uyumluluk - kaldırıldı, global state yok) ---
app.get("/set", async (c: Context<{ Bindings: Env }>) => {
	return c.text("Deprecated: Use POST /admin/state with deviceId", 410);
});

app.get("/get", async (c: Context<{ Bindings: Env }>) => {
	return c.text("Deprecated: Use GET /admin/state?deviceId=...", 410);
});

app.get("/control", async (c: Context<{ Bindings: Env }>) => {
	// Varsayılan değerler döndür
	return c.text("rent=0&park=0&gps=1&stats=1");
});

// --- ADMIN: Add device ---
app.post("/admin/device", async (c: Context<{ Bindings: Env }>) => {
	try {
		const body = await c.req.json();
		const { deviceId } = body;
		if (!deviceId) return c.json({ ok: false, error: "Missing deviceId" }, { status: 400 });

		const existing = await getOrCreateDevice(c.env.DB, deviceId);
		if (existing) {
			return c.json({ ok: true, message: "Device already exists" });
		}

		await upsertDevice(c.env.DB, {
			deviceId,
			lat: null,
			lon: null,
			speed: 0,
			totalDistance: 0,
			avgSpeed: 0,
			tripDuration: 0,
			rentalActive: false,
			parkMode: false,
			gpsSend: true,
			statsSend: true,
			tripId: null,
			parkDuration: 0,
			parkStartTime: null,
			motionDetected: false,
			lastMotionTime: null,
		});

		return c.json({ ok: true, message: `Device ${deviceId} created` });
	} catch (err) {
		return c.json({ ok: false, error: "Error creating device", details: String(err) }, { status: 400 });
	}
});

// --- ADMIN: Delete device ---
app.delete("/admin/device/:deviceId", async (c: Context<{ Bindings: Env }>) => {
	try {
		const deviceId = c.req.param("deviceId");
		if (!deviceId) return c.json({ ok: false, error: "Missing deviceId" }, { status: 400 });

		// Delete trips referencing the device due to foreign key constraints
		await c.env.DB.prepare("DELETE FROM trips WHERE device_id = ?").bind(deviceId).run();
		const result = await c.env.DB.prepare("DELETE FROM devices WHERE device_id = ?").bind(deviceId).run();

		return c.json({ ok: true, message: `Device ${deviceId} deleted`, changes: result.meta?.changes || 0 });
	} catch (err) {
		return c.json({ ok: false, error: "Error deleting device", details: String(err) }, { status: 400 });
	}
});

export default app;
