import { useState, useEffect } from "react";
import "./AdminPanel.css";

interface ControlState {
	rentalActive: boolean;
	parkMode: boolean;
	gpsSend: boolean;
	statsSend: boolean;
}

interface DeviceData {
	deviceId: string;
	lat?: number;
	lon?: number;
	speed?: number;
	totalDistance?: number;
	avgSpeed?: number;
	tripDuration?: number;
	timestamp?: string;
	motion?: boolean;
	tripId?: string;
	rentalActive?: boolean | string;
	parkMode?: boolean | string;
	gpsSend?: boolean | string;
	statsSend?: boolean | string;
	[key: string]: any;
}

interface Trip {
	tripId: string;
	deviceId: string;
	lat?: number;
	lon?: number;
	speed?: number;
	totalDistance?: number;
	avgSpeed?: number;
	tripDuration?: number;
	timestamp?: string;
}

export default function AdminPanel() {
	const [state, setState] = useState<ControlState>({
		rentalActive: false,
		parkMode: false,
		gpsSend: false,
		statsSend: false,
	});

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);

	const [devices, setDevices] = useState<Array<{ deviceId: string; value: DeviceData }>>([]);
	const [devicesLoading, setDevicesLoading] = useState(false);
	
	const [trips, setTrips] = useState<Trip[]>([]);
	const [tripsLoading, setTripsLoading] = useState(false);
	const [sortBy, setSortBy] = useState<"timestamp" | "speed" | "distance" | "duration">("timestamp");
	const [groupedTrips, setGroupedTrips] = useState<{ [key: string]: Trip[] }>({});
	
	const [showRentalModal, setShowRentalModal] = useState(false);
	const [rentalDeviceId, setRentalDeviceId] = useState("");
	const [rentalLoading, setRentalLoading] = useState(false);

	// Selected device for per-device top controls
	const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
	
	// Track active GPS/Stats requests for auto-refresh (device-based)
	const [activeGpsDevices, setActiveGpsDevices] = useState<Set<string>>(new Set());
	const [activeStatsDevices, setActiveStatsDevices] = useState<Set<string>>(new Set());

	// Fetch initial state
	useEffect(() => {
		fetchState();
		fetchDevices();
		fetchTrips("timestamp");
	}, []);

	// Adaptive polling: faster when any device is actively requesting GPS/Stats, slower otherwise
	useEffect(() => {
		// Initial fetch
		fetchDevices();

		const isActive = activeGpsDevices.size > 0 || activeStatsDevices.size > 0;
		const intervalMs = isActive ? 500 : 3000; // 500ms when active, 3s otherwise

		const interval = setInterval(() => {
			fetchDevices();
		}, intervalMs);

		return () => clearInterval(interval);
	}, [activeGpsDevices, activeStatsDevices]);

	const fetchState = async () => {
		try {
			setLoading(true);
			setError(null);
			const res = await fetch("/admin/state");
			if (!res.ok) throw new Error("Failed to fetch state");
			const data = await res.json();
			setState(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setLoading(false);
		}
	};

	const updateState = async (key: keyof ControlState, value: boolean) => {
		try {
			setError(null);
			const newState = { ...state, [key]: value };

			const res = await fetch("/admin/state", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ [key]: value }),
			});

			if (!res.ok) throw new Error("Failed to update state");

			setState(newState);
			setMessage(`✓ ${key} updated to ${value}`);
			setTimeout(() => setMessage(null), 2000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		}
	};

	const fetchDevices = async () => {
		try {
			setDevicesLoading(true);
			const res = await fetch("/admin/devices");
			if (!res.ok) throw new Error("Failed to fetch devices");
			const data = await res.json();
			setDevices(data.devices || []);
		} catch (err) {
			console.error(err);
		} finally {
			setDevicesLoading(false);
		}
	};

	const initDemo = async () => {
		try {
			setMessage("Demo verileri yükleniyor...");
			const res = await fetch("/demo/init");
			if (!res.ok) throw new Error("Failed to init demo");
			await fetchDevices();
			setMessage("✅ Demo verileri yüklendi!");
			setTimeout(() => setMessage(null), 3000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		}
	};

	const deleteDevice = async (deviceId: string) => {
		if (!window.confirm(`${deviceId} silinsin mi?`)) return;
		
		try {
			setError(null);
			const res = await fetch(`/admin/devices/${deviceId}`, {
				method: "DELETE",
			});
			if (!res.ok) throw new Error("Failed to delete device");
			
			setMessage(`✅ ${deviceId} silindi`);
			await fetchDevices();
			await fetchTrips("timestamp"); // Trips'i de güncelle
			setTimeout(() => setMessage(null), 2000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		}
	};

	const deleteAllDevices = async () => {
		if (!window.confirm("TÜM CİHAZLAR SİLİNECEK! Emin misiniz?")) return;
		
		try {
			setError(null);
			const res = await fetch("/admin/devices", {
				method: "DELETE",
			});
			if (!res.ok) throw new Error("Failed to delete all devices");
			
			setMessage("✅ Tüm cihazlar silindi");
			await fetchDevices();
			setTrips([]); // Trips'i temizle
			setGroupedTrips({});
			setTimeout(() => setMessage(null), 2000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		}
	};

	const fetchTrips = async (sort: "timestamp" | "speed" | "distance" | "duration" = "timestamp") => {
		try {
			setTripsLoading(true);
			const res = await fetch(`/admin/trips?sortBy=${sort}`);
			if (!res.ok) throw new Error("Failed to fetch trips");
			const data = await res.json();
			setTrips(data.trips || []);
			setGroupedTrips(data.grouped || {});
			setSortBy(sort);
		} catch (err) {
			console.error(err);
			setError("Sürüş geçmişi yüklenemedi");
		} finally {
			setTripsLoading(false);
		}
	};

	const startRental = async () => {
		if (!rentalDeviceId.trim()) {
			setError("Device ID giriniz");
			return;
		}
		
		try {
			setRentalLoading(true);
			setError(null);
			const res = await fetch("/rental/start", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ deviceId: rentalDeviceId }),
			});
			
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || "Rental başlatılamadı");
			}
			
			const data = await res.json();
			setMessage(`✅ ${rentalDeviceId} kiralama başladı (Trip: ${data.tripId})`);
			setShowRentalModal(false);
			setRentalDeviceId("");
			await fetchDevices();
			await fetchTrips("timestamp");
			setTimeout(() => setMessage(null), 3000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setRentalLoading(false);
		}
	};

	const endRental = async (deviceId: string) => {
		if (!window.confirm(`${deviceId} kiralama sonlandırılsın mı?`)) return;
		
		try {
			setError(null);
			const res = await fetch("/rental/end", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ deviceId }),
			});
			
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || "Kiralama sonlandırılamadı");
			}
			
			await res.json();
			setMessage(`✅ ${deviceId} kiralama sonlandırıldı`);
			await fetchDevices();
			await fetchTrips("timestamp");
			setTimeout(() => setMessage(null), 3000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		}
	};

	const sendGpsForDevice = async (deviceId: string) => {
		try {
			setError(null);
			// Add to active GPS devices
			setActiveGpsDevices(prev => new Set([...prev, deviceId]));
			
			// Send GPS command
			await controlDevice(deviceId, undefined, true, undefined);
			
			// Auto-disable after 2 seconds
			setTimeout(() => {
				setActiveGpsDevices(prev => {
					const newSet = new Set(prev);
					newSet.delete(deviceId);
					return newSet;
				});
				controlDevice(deviceId, undefined, false, undefined);
			}, 2000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "GPS gönderilemedi");
			setActiveGpsDevices(prev => {
				const newSet = new Set(prev);
				newSet.delete(deviceId);
				return newSet;
			});
		}
	};

	const sendStatsForDevice = async (deviceId: string) => {
		try {
			setError(null);
			// Add to active Stats devices
			setActiveStatsDevices(prev => new Set([...prev, deviceId]));
			
			// Send Stats command
			await controlDevice(deviceId, undefined, undefined, true);
			
			// Auto-disable after 2 seconds
			setTimeout(() => {
				setActiveStatsDevices(prev => {
					const newSet = new Set(prev);
					newSet.delete(deviceId);
					return newSet;
				});
				controlDevice(deviceId, undefined, undefined, false);
			}, 2000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "İstatistik gönderilemedi");
			setActiveStatsDevices(prev => {
				const newSet = new Set(prev);
				newSet.delete(deviceId);
				return newSet;
			});
		}
	};

	// Send GPS once for all devices (calls per-device helper)
	const sendGpsForAll = async () => {
		try {
			setError(null);
			const ids = devices.map(d => d.deviceId);
			// Fire-and-forget per-device sends to preserve existing per-device timing/state
			ids.forEach(id => void sendGpsForDevice(id));
			setMessage(`✅ Tüm cihazlara GPS isteği gönderildi (${ids.length})`);
			setTimeout(() => setMessage(null), 2000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "GPS tüm cihazlara gönderilemedi");
		}
	};

	// Send Stats once for all devices
	const sendStatsForAll = async () => {
		try {
			setError(null);
			const ids = devices.map(d => d.deviceId);
			ids.forEach(id => void sendStatsForDevice(id));
			setMessage(`✅ Tüm cihazlara istatistik isteği gönderildi (${ids.length})`);
			setTimeout(() => setMessage(null), 2000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "İstatistik tüm cihazlara gönderilemedi");
		}
	};

	const controlDevice = async (deviceId: string, parkMode?: boolean, gpsSend?: boolean, statsSend?: boolean) => {
		try {
			setError(null);
			const payload: any = {};
			if (parkMode !== undefined) payload.parkMode = parkMode;
			if (gpsSend !== undefined) payload.gpsSend = gpsSend;
			if (statsSend !== undefined) payload.statsSend = statsSend;
			
			const res = await fetch(`/rental/control/${deviceId}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			
			if (!res.ok) throw new Error("Kontrol güncellenemedi");
			
			setMessage("✅ Cihaz kontrolü güncellendi");
			setTimeout(() => setMessage(null), 2000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		}
	};

	const togglePark = async () => {
		if (selectedDeviceId) {
			// find current device value
			const dev = devices.find(d => d.deviceId === selectedDeviceId);
			const cur = (dev?.value?.parkMode === true || dev?.value?.parkMode === "true");
			await controlDevice(selectedDeviceId, !cur, undefined, undefined);
			await fetchDevices();
		} else {
			await updateState("parkMode", !state.parkMode);
		}
	};

	const toggleGPS = async () => {
		if (selectedDeviceId) {
			const dev = devices.find(d => d.deviceId === selectedDeviceId);
			const cur = (dev?.value?.gpsSend === true || dev?.value?.gpsSend === "true");
			await controlDevice(selectedDeviceId, undefined, !cur, undefined);
			await fetchDevices();
		} else {
			await updateState("gpsSend", !state.gpsSend);
		}
	};

	const toggleStats = async () => {
		if (selectedDeviceId) {
			const dev = devices.find(d => d.deviceId === selectedDeviceId);
			const cur = (dev?.value?.statsSend === true || dev?.value?.statsSend === "true");
			await controlDevice(selectedDeviceId, undefined, undefined, !cur);
			await fetchDevices();
		} else {
			await updateState("statsSend", !state.statsSend);
		}
	};

	if (loading) return <div className="admin-panel"><p>Yükleniyor...</p></div>;

	return (
		<div className="admin-panel">
			<div className="admin-container">
				<h1>🔧 ESP32 Control Panel</h1>

				{/* Device selector for per-device top controls */}
				<div style={{ marginBottom: 12 }}>
					<label style={{ marginRight: 8 }}>Cihaz seç: </label>
					<select value={selectedDeviceId || ""} onChange={(e) => setSelectedDeviceId(e.target.value || null)}>
						<option value="">-- Tümünü kullan (global) --</option>
						{devices.map(d => (
							<option key={d.deviceId} value={d.deviceId}>{d.deviceId}</option>
						))}
					</select>
				</div>

				{/* Rental Modal */}
				{showRentalModal && (
					<div className="modal-overlay" onClick={() => setShowRentalModal(false)}>
						<div className="modal-content" onClick={(e) => e.stopPropagation()}>
							<h2>🚗 Cihaz Kirala</h2>
							<input
								type="text"
								placeholder="Device ID girin (ör: esp32_001)"
								value={rentalDeviceId}
								onChange={(e) => setRentalDeviceId(e.target.value.toUpperCase())}
								className="modal-input"
								disabled={rentalLoading}
								onKeyPress={(e) => e.key === "Enter" && startRental()}
							/>
							<div className="modal-buttons">
								<button
									onClick={startRental}
									className="modal-btn confirm"
									disabled={rentalLoading}
								>
									{rentalLoading ? "Başlatılıyor..." : "✅ Kiralama Başlat"}
								</button>
								<button
									onClick={() => setShowRentalModal(false)}
									className="modal-btn cancel"
									disabled={rentalLoading}
								>
									❌ İptal
								</button>
							</div>
						</div>
					</div>
				)}

				{error && <div className="error-message">❌ {error}</div>}
				{message && <div className="success-message">{message}</div>}

				<div className="control-grid">
					{/* Kiralama */}
					<div className="control-card">
						<h2>🚗 Kiralama</h2>
						<button
							onClick={() => setShowRentalModal(true)}
							className="toggle-btn active"
						>
							+ Cihaz Kirala
						</button>
					</div>

					{/* Park Modu */}
					<div className={`control-card ${state.parkMode ? "active" : ""}`}>
						<h2>Park Modu</h2>
						<p className="status">
							{state.parkMode ? "✅ AKTİF" : "❌ KAPAL"}
						</p>
						<button
							onClick={togglePark}
							className={`toggle-btn ${state.parkMode ? "active" : ""}`}
						>
							{state.parkMode ? "Kapat" : "Aç"}
						</button>
					</div>

					{/* GPS Gönderme */}
					<div className={`control-card ${state.gpsSend ? "active" : ""}`}>
						<h2>GPS Gönder</h2>
						<p className="status">
							{state.gpsSend ? "✅ AKTİF" : "❌ KAPAL"}
						</p>
						<button
							onClick={toggleGPS}
							className={`toggle-btn ${state.gpsSend ? "active" : ""}`}
						>
							{state.gpsSend ? "Kapat" : "Aç"}
						</button>
					</div>

					{/* İstatistik Gönderme */}
					<div className={`control-card ${state.statsSend ? "active" : ""}`}>
						<h2>İstatistik Gönder</h2>
						<p className="status">
							{state.statsSend ? "✅ AKTİF" : "❌ KAPAL"}
						</p>
						<button
							onClick={toggleStats}
							className={`toggle-btn ${state.statsSend ? "active" : ""}`}
						>
							{state.statsSend ? "Kapat" : "Aç"}
						</button>
					</div>
				</div>

				{/* Quick Links */}
				<div className="quick-links">
					<h3>Hızlı Komutlar</h3>
					<button
						onClick={async () => {
							await updateState("rentalActive", true);
							await updateState("parkMode", false);
						}}
						className="quick-btn"
					>
						Kirala (rental=1, park=0)
					</button>
					<button
						onClick={async () => {
							await updateState("rentalActive", false);
							await updateState("parkMode", true);
						}}
						className="quick-btn"
					>
						Park + Kiralama Kapat
					</button>
					<button
						onClick={() => sendGpsForAll()}
						className="quick-btn"
					>
						GPS Gönder (1x)
					</button>
					<button
						onClick={() => sendStatsForAll()}
						className="quick-btn"
					>
						İstatistik Gönder (1x)
					</button>
					<button
						onClick={initDemo}
						className="quick-btn"
						style={{ backgroundColor: "#4CAF50" }}
					>
						🔄 Demo Verilerini Yükle
					</button>
					<button
						onClick={deleteAllDevices}
						className="quick-btn"
						style={{ backgroundColor: "#f44336" }}
					>
						🗑️ Tüm Cihazları Sil
					</button>
				</div>

					{/* Info */}
					<div className="info-box">
						<h3>📡 Durum Bilgileri</h3>
						{/* If a device is selected, show its individual control flags; otherwise show global state */}
						{selectedDeviceId ? (
							(() => {
								const dev = devices.find(d => d.deviceId === selectedDeviceId);
								const v = (dev?.value as DeviceData) || ({} as DeviceData);
								return <pre>{JSON.stringify({
									deviceId: selectedDeviceId,
									rentalActive: v.rentalActive || false,
									parkMode: v.parkMode || false,
									gpsSend: v.gpsSend || false,
									statsSend: v.statsSend || false
								}, null, 2)}</pre>;
							})()
						) : (
							<pre>{JSON.stringify(state, null, 2)}</pre>
						)}
					</div>

					{/* Devices */}
					<div className="devices-section">
						<h3>📱 Cihazlar</h3>
						<button className="quick-btn" style={{ marginBottom: 12 }} onClick={fetchDevices}>
							Yenile
						</button>
						{devicesLoading ? (
							<p>Yükleniyor...</p>
						) : (
							<div className="control-grid">
								{devices.length === 0 && <p>Hiç cihaz yok.</p>}
								{devices.map((d) => {
									// Guard against KV returning null for deleted or empty entries
									const v = (d.value as DeviceData) || ({} as DeviceData);
									const lat = typeof v.lat === 'string' ? parseFloat(v.lat) : v.lat;
									const lon = typeof v.lon === 'string' ? parseFloat(v.lon) : v.lon;
									const speed = typeof v.speed === 'string' ? parseFloat(v.speed) : v.speed;
									const distance = typeof v.totalDistance === 'string' ? parseFloat(v.totalDistance) : v.totalDistance;
									const avgSpeed = typeof v.avgSpeed === 'string' ? parseFloat(v.avgSpeed) : v.avgSpeed;
									const tripDuration = typeof v.tripDuration === 'string' ? parseInt(v.tripDuration) : v.tripDuration;
									const timestamp = v.timestamp;

									// Format trip duration (seconds to HH:MM:SS)
									const formatDuration = (seconds: number) => {
										const h = Math.floor(seconds / 3600);
										const m = Math.floor((seconds % 3600) / 60);
										const s = seconds % 60;
										return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
									};

									return (
										<div key={d.deviceId} className="device-card">
											<h2>📱 {d.deviceId}</h2>
											
											{/* Kontrol Durumu */}
											<div className="device-status">
												<span className={state.gpsSend ? "status-badge active" : "status-badge"}>
													{state.gpsSend ? "✅ GPS AKTİF" : "❌ GPS KAPAL"}
												</span>
												<span className={state.statsSend ? "status-badge active" : "status-badge"}>
													{state.statsSend ? "✅ STATS AKTİF" : "❌ STATS KAPAL"}
												</span>
											</div>

											{/* ===== GPS VERİLERİ BÖLÜMÜ ===== */}
											<div className="data-section">
												<h3>🛰️ GPS VERİLERİ</h3>
												
												{/* GPS Konumu */}
												{lat !== undefined && lat !== null && lon !== undefined && lon !== null ? (
													<div className="device-info">
														<p className="info-text">📍 <strong>Konum:</strong> {Number(lat).toFixed(6)}, {Number(lon).toFixed(6)}</p>
														<div className="map-container">
															<iframe
																title={`Map for ${d.deviceId}`}
																src={`https://maps.google.com/maps?q=${lat},${lon}&z=15&output=embed`}
																style={{ width: "100%", height: 250, border: 0, borderRadius: 6 }}
																loading="lazy"
															></iframe>
														</div>
													</div>
												) : (
													<p className="info-text" style={{ color: "#999" }}>Konum verisi bekleniyor...</p>
												)}

												{/* Hız */}
												{speed !== undefined && speed !== null ? (
													<div className="device-info">
														<p className="info-text">🚗 <strong>Anlık Hız:</strong></p>
														<p className="speed-text">{Number(speed).toFixed(2)} km/h</p>
													</div>
												) : (
													<p className="info-text" style={{ color: "#999" }}>Hız verisi bekleniyor...</p>
												)}
											</div>

											{/* ===== İSTATİSTİK VERİLERİ BÖLÜMÜ ===== */}
											{(distance !== undefined || avgSpeed !== undefined || tripDuration !== undefined) && (
												<div className="data-section">
													<h3>📊 İSTATİSTİK VERİLERİ</h3>
													<div className="stats-highlight">
														{distance !== undefined && distance !== null && (
															<p className="info-text">📏 <strong>Sürüş Mesafesi:</strong> {Number(distance).toFixed(3)} km</p>
														)}
														{avgSpeed !== undefined && avgSpeed !== null && (
															<p className="info-text">⚡ <strong>Ortalama Hız:</strong> {Number(avgSpeed).toFixed(2)} km/h</p>
														)}
														{tripDuration !== undefined && tripDuration !== null && (
															<p className="info-text">⏱️ <strong>Toplam Sürüş Süresi:</strong> {formatDuration(Number(tripDuration))}</p>
														)}
													</div>
												</div>
											)}

											{/* Timestamp */}
											{timestamp && (
												<p className="timestamp">Güncelleme: {new Date(timestamp).toLocaleString('tr-TR')}</p>
											)}

											{/* Device Control Buttons */}
											{(v.rentalActive === true || v.rentalActive === "true") && (
												<div className="device-controls">
													<button
														onClick={() => sendGpsForDevice(d.deviceId)}
														className={`device-control-btn gps ${activeGpsDevices.has(d.deviceId) ? 'active' : ''}`}
														disabled={activeGpsDevices.has(d.deviceId)}
														title="GPS konumunu gönder"
													>
														📍 GPS Gönder {activeGpsDevices.has(d.deviceId) && '...'}
													</button>
													<button
														onClick={() => sendStatsForDevice(d.deviceId)}
														className={`device-control-btn stats ${activeStatsDevices.has(d.deviceId) ? 'active' : ''}`}
														disabled={activeStatsDevices.has(d.deviceId)}
														title="İstatistikleri gönder"
													>
														📊 İstatistik {activeStatsDevices.has(d.deviceId) && '...'}
													</button>
													<button
														onClick={() => endRental(d.deviceId)}
														className="device-control-btn end"
														title="Kiralama sonlandır"
													>
														🏁 Kiralama Bitir
													</button>
												</div>
											)}

											{/* Delete Button */}
											<button
												onClick={() => deleteDevice(d.deviceId)}
												className="delete-device-btn"
											>
												🗑️ Cihazı Sil
											</button>
										</div>
									);
								})}
							</div>
						)}
					</div>

					{/* Trips Section */}
					<div className="trips-section">
						<h3>📈 Sürüş Geçmişi (Trips)</h3>
						<div className="trips-controls">
							<button
								className="sort-btn"
								onClick={() => fetchTrips("timestamp")}
								style={{ backgroundColor: sortBy === "timestamp" ? "#667eea" : "#f0f0f0", color: sortBy === "timestamp" ? "white" : "#666" }}
							>
								🕐 En Yeni
							</button>
							<button
								className="sort-btn"
								onClick={() => fetchTrips("speed")}
								style={{ backgroundColor: sortBy === "speed" ? "#667eea" : "#f0f0f0", color: sortBy === "speed" ? "white" : "#666" }}
							>
								🚗 En Hızlı
							</button>
							<button
								className="sort-btn"
								onClick={() => fetchTrips("distance")}
								style={{ backgroundColor: sortBy === "distance" ? "#667eea" : "#f0f0f0", color: sortBy === "distance" ? "white" : "#666" }}
							>
								📏 En Uzun
							</button>
							<button
								className="sort-btn"
								onClick={() => fetchTrips("duration")}
								style={{ backgroundColor: sortBy === "duration" ? "#667eea" : "#f0f0f0", color: sortBy === "duration" ? "white" : "#666" }}
							>
								⏱️ En Uzun Süre
							</button>
						</div>

						{tripsLoading ? (
							<p>Sürüşler yükleniyor...</p>
						) : trips.length === 0 ? (
							<p>Sürüş geçmişi bulunamadı.</p>
						) : (
							<div className="trips-grouped">
								{Object.entries(groupedTrips).map(([deviceId, deviceTrips]) => (
									<div key={deviceId} className="device-trips-group">
										<h4>📱 {deviceId} ({deviceTrips.length} sürüş)</h4>
										<div className="trips-list">
											{deviceTrips.map((trip) => {
												const formatDuration = (seconds?: number) => {
													if (!seconds) return "—";
													const h = Math.floor(seconds / 3600);
													const m = Math.floor((seconds % 3600) / 60);
													const s = seconds % 60;
													return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
												};

												return (
													<div key={trip.tripId} className="trip-card">
														<p><strong>Trip ID:</strong> {trip.tripId}</p>
														{trip.totalDistance !== undefined && <p><strong>📏 Mesafe:</strong> {Number(trip.totalDistance).toFixed(3)} km</p>}
														{trip.avgSpeed !== undefined && <p><strong>⚡ Ort. Hız:</strong> {Number(trip.avgSpeed).toFixed(2)} km/h</p>}
														{trip.tripDuration !== undefined && <p><strong>⏱️ Sürüş Süresi:</strong> {formatDuration(trip.tripDuration)}</p>}
														{trip.speed !== undefined && <p><strong>🚗 Anlık Hız:</strong> {Number(trip.speed).toFixed(2)} km/h</p>}
														{trip.timestamp && <p className="trip-timestamp">{new Date(trip.timestamp).toLocaleString('tr-TR')}</p>}
														
													</div>
												);
											})}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
			</div>
		</div>
	);
}

