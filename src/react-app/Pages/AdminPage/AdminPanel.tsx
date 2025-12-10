import { useState, useEffect, useCallback, useRef } from "react";
import "./AdminPanel.css";
import DeviceCard from "./DeviceCard";
import MapCanvas from "./MapCanvas";

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
	parkDuration?: number; // Park modunda geçen süre (saniye)
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
	parkDuration?: number; // Park modunda geçen süre (saniye)
	totalCost?: number; // Toplam ücret (TL)
	timestamp?: string;
	rentalEndTime?: string;
	realtimeRoute?: Array<{ lat: number; lon: number; timestamp?: string }>;
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

	// Realtime route points (harita üzerinde çizilen kırmızı çizgi)
	const [realtimePoints, setRealtimePoints] = useState<{ [deviceId: string]: Array<{ lat: number; lon: number; timestamp?: string }> }>({});

	// MapCanvas refs - her deviceId için ayrı MapCanvas (her device'ın kendi haritası)
	const mapCanvasRefsRef = useRef<Map<string, any>>(new Map());
	
	// Aktif kiralama cihazlarını track et - bu cihazlar DOM'da kalmalı ve haritaları korunmalı
	// STATE olarak tutulmalı ki değişince re-render tetiklensin
	const [activeRentals, setActiveRentals] = useState<Set<string>>(new Set());
	
	// Aktif rental'ın tripId'sini track et (endRental'da kullanmak için)
	const activeTripIdRef = useRef<string | null>(null);
	const activeDeviceIdRef = useRef<string | null>(null);

	// Trip detail modal
	const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

	// Selected device for per-device top controls
	const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
	
	// Track if devices have been loaded at least once
	const hasInitializedDevices = useRef(false);

	// Fetch initial state
	// Motion alerts
	const [motionAlerts, setMotionAlerts] = useState<Array<{ deviceId: string; timestamp: string }>>([]);
	const [lastMotionTimestamp, setLastMotionTimestamp] = useState<string | null>(null);		// Fetch initial state
	useEffect(() => {
		fetchState();
		fetchDevices();
		fetchTrips("timestamp");
		
		// Request notification permission
		if ('Notification' in window && Notification.permission === 'default') {
			Notification.requestPermission();
		}
	}, []);

	// Auto-refresh for motion alerts - only fetch when there are active selections
	useEffect(() => {
		// Only poll if we have a device selected
		if (!selectedDeviceId) return;

		const interval = setInterval(() => {
			fetchDevices();
		}, 200); // 200ms - hızlı GPS güncellemesi için
		return () => clearInterval(interval);
	}, [selectedDeviceId]);

	// Seçili device değiştiğinde map'i invalidate et (Leaflet display:none sorunu için)
	useEffect(() => {
		if (selectedDeviceId) {
			// Kısa bir delay ile invalidateSize çağır (DOM güncellemesi için bekle)
			const timer = setTimeout(() => {
				if (mapCanvasRefsRef.current.has(selectedDeviceId)) {
					const mapCanvas = mapCanvasRefsRef.current.get(selectedDeviceId);
					if (mapCanvas && mapCanvas.invalidateSize) {
						mapCanvas.invalidateSize();
						console.log(`[AdminPanel] Map invalidateSize called for deviceId: ${selectedDeviceId}`);
					}
				}
			}, 150);
			return () => clearTimeout(timer);
		}
	}, [selectedDeviceId, activeRentals]); // activeRentals değişince de çağır (kiralama bittiğinde)



	const fetchState = async () => {
		try {
			setLoading(true);
			setError(null);
			const res = await fetch("/admin/state");
			if (!res.ok) throw new Error("Failed to fetch state");
			const data = await res.json();
			// Convert string booleans to actual booleans
			const normalizedData = {
				rentalActive: data.rentalActive === true || data.rentalActive === "true",
				parkMode: data.parkMode === true || data.parkMode === "true",
				gpsSend: data.gpsSend === true || data.gpsSend === "true",
				statsSend: data.statsSend === true || data.statsSend === "true",
			};
			setState(normalizedData);
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
			// Only show loading on initial fetch, not on polling updates
			if (!hasInitializedDevices.current) {
				setDevicesLoading(true);
			}
			const res = await fetch("/admin/devices");
			if (!res.ok) throw new Error("Failed to fetch devices");
			const data = await res.json();
			setDevices(data.devices || []);
			hasInitializedDevices.current = true;

			// Check for motion alerts (parkMode + motionDetected)
			const alerts: Array<{ deviceId: string; timestamp: string }> = [];
			data.devices.forEach((d: any) => {
				if (d.value && d.value.parkMode && d.value.motionDetected && d.value.motionDetectedAt) {
					alerts.push({
						deviceId: d.deviceId,
						timestamp: d.value.motionDetectedAt,
					});
				}
			});
			
			// Show notification for new alerts based on timestamp change
			if (alerts.length > 0) {
				const latestAlert = alerts[alerts.length - 1];
				if (latestAlert.timestamp !== lastMotionTimestamp) {
					setLastMotionTimestamp(latestAlert.timestamp);
					
					// Browser notification
					if (Notification.permission === 'granted') {
						new Notification('⚠️ HAREKET ALGILANDI!', {
							body: `${latestAlert.deviceId} - Park modunda hareket algılandı!`,
							icon: '/logo.png',
						});
					}
					
					// Audio alert
					try {
						const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ0PVqzn77BdGAg+ltryxnMpBSl+zPLaizsIGGS56+ihUAwKTKXh8bllHAU2jtXvxXwsBS2Ay/HSjjwIGGK36+mjUg0LULF==');
						audio.play();
					} catch (e) {
						console.log('Audio alert failed:', e);
					}
				}
			}
			setMotionAlerts(alerts);
		} catch (err) {
			console.error(err);
		} finally {
			setDevicesLoading(false);
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



	const fetchTrips = async (sort: "timestamp" | "speed" | "distance" | "duration" = "timestamp") => {
		try {
			setTripsLoading(true);
			const res = await fetch(`/admin/trips?sortBy=${sort}`);
			if (!res.ok) throw new Error("Failed to fetch trips");
			const data = await res.json();
			console.log("Trips data:", data.trips); // DEBUG
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
		const newDeviceId = rentalDeviceId;
		setRentalDeviceId("");
		// Yeni kiralama için realtime noktaları sıfırla
		setRealtimePoints(prev => ({ ...prev, [newDeviceId]: [] }));
		// Aktif tripId ve deviceId'yi kaydet
		activeTripIdRef.current = data.tripId;
		activeDeviceIdRef.current = newDeviceId;
		// Bu cihazı aktif kiralama seti'ne ekle
		setActiveRentals(prev => {
			const newSet = new Set(prev);
			newSet.add(newDeviceId);
			return newSet;
		});
		console.log(`[startRental] Active tripId set to: ${data.tripId}, deviceId: ${newDeviceId}`);
		await fetchDevices();
		await fetchTrips("timestamp");
		// Yeni kiralanan cihazı otomatik seç
		setSelectedDeviceId(newDeviceId);
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
			// Realtime noktalarını topla (multiple sources dan)
			let rtPoints: any[] = [];
			
			// 1. MapCanvas'tan al (en güncel) - deviceId'ye bağlı ref kullan
			if (mapCanvasRefsRef.current.has(deviceId)) {
				const mapCanvas = mapCanvasRefsRef.current.get(deviceId);
				if (mapCanvas && mapCanvas.getRealtimePoints) {
					rtPoints = mapCanvas.getRealtimePoints();
					console.log(`[endRental] Got ${rtPoints.length} points from MapCanvas (deviceId: ${deviceId})`);
				}
			}
			
			// 2. State'ten al (fallback)
			if (rtPoints.length === 0) {
				rtPoints = realtimePoints[deviceId] || [];
				console.log(`[endRental] Fallback to state: ${rtPoints.length} points`);
			}
			
			console.log(`[endRental] Final rtPoints: ${rtPoints.length}`, rtPoints);
			const res = await fetch("/rental/end", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ 
					deviceId,
					realtimeRoute: rtPoints  // Harita üzerinde çizilen gerçek rota
				}),
			});
			
			if (!res.ok) {
				let errorData: any = {};
				try {
					errorData = await res.json();
				} catch {
					errorData = { error: await res.text() };
				}
				console.error(`[endRental] Error response:`, errorData);
				throw new Error(errorData.error || errorData.details || "Kiralama sonlandırılamadı");
			}
			
			const responseData = await res.json();
			console.log(`[endRental] Response:`, responseData);
			console.log(`[endRental] Trip data:`, responseData.trip);
			setMessage(`✅ ${deviceId} kiralama sonlandırıldı (${rtPoints.length} konuma kayıt edildi)`);
			// Realtime noktaları temizle
			setRealtimePoints(prev => ({ ...prev, [deviceId]: [] }));
			
			// Trips'i güncelle ve varsa yeni trip'i otomatik seç
			await fetchDevices();
			await fetchTrips("timestamp");
			
			// Cihaz seçimini temizle (map gösterimini durdurmak için)
			setSelectedDeviceId(null);
			// MapCanvas'ı tamamen sıfırla - fullReset ile
			if (mapCanvasRefsRef.current.has(deviceId)) {
				const mapCanvas = mapCanvasRefsRef.current.get(deviceId);
				if (mapCanvas && mapCanvas.fullReset) {
					mapCanvas.fullReset();
					console.log(`[endRental] MapCanvas full reset for deviceId: ${deviceId}`);
				}
				// Ref'i map'ten kaldır ki yeni kiralama için temiz başlasın
				mapCanvasRefsRef.current.delete(deviceId);
			}
			// Aktif tripId ve deviceId'yi sıfırla
			activeTripIdRef.current = null;
			activeDeviceIdRef.current = null;
			// Bu cihazı aktif kiralama seti'nden çıkar
			setActiveRentals(prev => {
				const newSet = new Set(prev);
				newSet.delete(deviceId);
				return newSet;
			});
			console.log(`[endRental] Device ${deviceId} removed from activeRentals`);
			
			// Yeni oluşturulan trip'i seç ve modal'ı aç
			if (responseData.trip) {
				console.log(`[endRental] Trip found, opening modal:`, responseData.trip);
				setSelectedTrip(responseData.trip);
			}
			
			setTimeout(() => setMessage(null), 3000);
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : "Unknown error";
			console.error(`[endRental] Error:`, errorMsg);
			setError(errorMsg);
		}
	};

	const resetTrip = async (deviceId: string) => {
		if (!window.confirm(`${deviceId} cihazının trip verilerini sıfırla?`)) return;
		
		try {
			setError(null);
			const res = await fetch(`/trip/reset/${deviceId}`, {
				method: "POST",
			});
			
			if (!res.ok) throw new Error("Trip sıfırlanamadı");
			
			setMessage(`✅ ${deviceId} trip verileri sıfırlandı`);
			await fetchDevices();
			await fetchTrips("timestamp");
			setTimeout(() => setMessage(null), 3000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		}
	};

	const clearAllData = async () => {
		if (!window.confirm("⚠️ TÜM VERİLER SİLİNECEK! Devam etmek istediğinizden emin misiniz?")) return;
		if (!window.confirm("📊 Tüm cihaz ve sürüş geçmişi silinecek. ONAYLANIYOR?")) return;
		
		try {
			setError(null);
			const res = await fetch("/admin/clear-all", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});
			
			if (!res.ok) throw new Error("Veriler temizlenemedi");
			
			const data = await res.json();
			setMessage(`✅ Tüm veriler temizlendi (${data.deletedKeys} kayıt silindi)`);
			
			// State'i sıfırla
			setDevices([]);
			setTrips([]);
			setGroupedTrips({});
			setSelectedDeviceId(null);
			setSelectedTrip(null);
			setRealtimePoints({});
			
			await fetchDevices();
			await fetchTrips("timestamp");
			setTimeout(() => setMessage(null), 3000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		}
	};

	// sendGpsForDevice ve sendStatsForDevice kaldırıldı (artık kullanılmıyor)

	// sendGpsForAll ve sendStatsForAll kaldırıldı (artık kullanılmıyor)

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
			
			// Silently update without showing success message
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

	const requestNotificationPermission = async () => {
		if ('Notification' in window) {
			const permission = await Notification.requestPermission();
			if (permission === 'granted') {
				setMessage('✅ Bildirim izni verildi!');
				setTimeout(() => setMessage(null), 2000);
			} else {
				setError('❌ Bildirim izni reddedildi');
				setTimeout(() => setError(null), 3000);
			}
		} else {
			setError('Tarayıcınız bildirimleri desteklemiyor');
		}
	};

	// Memoized handlers for device card
	const handleEndRental = useCallback((deviceId: string) => {
		endRental(deviceId);
	}, []);

	const handleResetTrip = useCallback((deviceId: string) => {
		resetTrip(deviceId);
	}, []);

	const handleToggleGps = useCallback(async (deviceId: string) => {
		const device = devices.find(d => d.deviceId === deviceId);
		if (!device) return;
		const v = device.value as DeviceData;
		const newGps = !(v.gpsSend === true || v.gpsSend === "true");
		await controlDevice(deviceId, undefined, newGps, undefined);
		setDevices(prev => prev.map(d => 
			d.deviceId === deviceId 
				? { ...d, value: { ...d.value, gpsSend: newGps } }
				: d
		));
	}, [devices]);

	const handleToggleStats = useCallback(async (deviceId: string) => {
		const device = devices.find(d => d.deviceId === deviceId);
		if (!device) return;
		const v = device.value as DeviceData;
		const newStats = !(v.statsSend === true || v.statsSend === "true");
		await controlDevice(deviceId, undefined, undefined, newStats);
		setDevices(prev => prev.map(d => 
			d.deviceId === deviceId 
				? { ...d, value: { ...d.value, statsSend: newStats } }
				: d
		));
	}, [devices]);

	const formatDuration = (seconds: number) => {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = seconds % 60;
		return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
				{devices
					.filter(d => {
						const v = d.value as DeviceData;
						return v && (v.rentalActive === true || v.rentalActive === "true" || v.deviceId); // Tüm cihazları göster
					})
					.map(d => {
						const v = d.value as DeviceData;
						const isActive = v && (v.rentalActive === true || v.rentalActive === "true");
						const status = isActive ? "🟢 Kirada" : "⚫ Pasif";
						return (
							<option key={d.deviceId} value={d.deviceId}>
								{d.deviceId} ({status})
							</option>
						);
					})}
			</select>
		</div>
		
		{/* Notification Permission Button - Always visible with status */}
		<div style={{ marginBottom: 16, padding: '12px', backgroundColor: Notification.permission === 'granted' ? '#e8f5e9' : '#fff3e0', borderRadius: 8, border: '1px solid ' + (Notification.permission === 'granted' ? '#4caf50' : '#ff9800') }}>
			{Notification.permission === 'granted' ? (
				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<span style={{ fontSize: '1.2em' }}>✅</span>
					<span style={{ color: '#2e7d32', fontWeight: 'bold' }}>Bildirimler etkin</span>
					<span style={{ marginLeft: 'auto', fontSize: '0.9em', color: '#666' }}>Hareket uyarıları gelecek</span>
				</div>
			) : (
				<div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
					<button 
						onClick={requestNotificationPermission}
						className="toggle-btn"
						style={{ backgroundColor: '#ff9800', border: 'none', fontSize: '1em' }}
					>
						🔔 Bildirimleri Etkinleştir
					</button>
					<span style={{ fontSize: '0.9em', color: '#666' }}>
						(Hareket uyarıları için gerekli)
					</span>
				</div>
			)}
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
								onChange={(e) => setRentalDeviceId(e.target.value)}
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

				{/* Motion Alerts */}
				{motionAlerts.length > 0 && (
					<div className="motion-alerts-box">
						<h3>⚠️ HAREKET ALGILANDI!</h3>
						{motionAlerts.map((alert, idx) => (
							<div key={idx} className="motion-alert-item">
								<strong>🚗 {alert.deviceId}</strong>
								<span className="alert-time">{new Date(alert.timestamp).toLocaleTimeString('tr-TR')}</span>
								<p>Park modunda hareket algılandı! GPS otomatik etkinleştirildi.</p>
							</div>
						))}
					</div>
				)}

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

					{/* Tüm Verileri Temizle */}
					<div className="control-card" style={{ borderColor: '#ff4444', backgroundColor: '#fff0f0' }}>
						<h2>🗑️ Temizle</h2>
						<p style={{ fontSize: '0.9em', color: '#666', marginBottom: '12px' }}>
							Tüm cihaz ve sürüş verileri
						</p>
						<button
							onClick={clearAllData}
							className="toggle-btn"
							style={{
								backgroundColor: '#ff4444',
								border: 'none',
								color: 'white',
								fontWeight: 'bold',
								cursor: 'pointer'
							}}
						>
							⚠️ Tümünü Temizle
						</button>
					</div>

				{/* Park Modu */}
				{(() => {
					// If device is selected, show its parkMode; otherwise show global state
					const currentParkMode = selectedDeviceId 
						? (() => {
								const dev = devices.find(d => d.deviceId === selectedDeviceId);
								return dev?.value?.parkMode === true || dev?.value?.parkMode === "true";
						  })()
						: state.parkMode;
					
					return (
						<div className={`control-card ${currentParkMode ? "active" : ""}`}>
							<h2>🅿️ Park Modu</h2>
							<p className="status" style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
								{currentParkMode ? "✅ AKTİF" : "⭕ KAPALI"}
							</p>
							<button
								onClick={togglePark}
								className={`toggle-btn ${currentParkMode ? "active" : ""}`}
								style={{ 
									fontSize: '1.1em', 
									padding: '12px 24px',
									backgroundColor: currentParkMode ? '#f44336' : '#4CAF50',
									border: 'none',
									color: 'white',
									fontWeight: 'bold'
								}}
							>
								{currentParkMode ? "🛑 Kapat" : "🅿️ Aç"}
							</button>
						</div>
					);
				})()}
			</div>					{/* Info */}
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
					{devicesLoading && !hasInitializedDevices.current ? (
						<p>Yükleniyor...</p>
					) : (
						<>
							{/* Her aktif kiralık device için ayrı DeviceCard - sadece seçili olan görünür */}
							{devices
								.filter(d => activeRentals.has(d.deviceId))
								.map((device) => (
									<div 
										key={`device-${device.deviceId}`}
										style={{ display: device.deviceId === selectedDeviceId ? 'block' : 'none' }}
									>
										<DeviceCard
											deviceId={device.deviceId}
											data={device.value}
											onToggleGps={handleToggleGps}
											onToggleStats={handleToggleStats}
											onEndRental={handleEndRental}
											onResetTrip={handleResetTrip}
											onDeleteDevice={deleteDevice}
											formatDuration={formatDuration}
											routeHistory={[]} // Aktif kiralama için boş - sadece realtime çizim yapılacak
											onRealtimePointsUpdate={(deviceId, points) => {
												console.log(`[AdminPanel] onRealtimePointsUpdate: deviceId=${deviceId}, points=${points.length}`);
												setRealtimePoints(prev => ({ ...prev, [deviceId]: points }));
											}}
											onGetMapCanvas={(mapCanvas) => {
												if (mapCanvas) {
													mapCanvasRefsRef.current.set(device.deviceId, mapCanvas);
													console.log(`[AdminPanel] MapCanvas ref stored for deviceId: ${device.deviceId}`);
												}
											}}
										/>
									</div>
								))}
							
							{/* Pasif (kiralık olmayan) cihazlar - sadece anlık konum gösterilir */}
							{devices
								.filter(d => !activeRentals.has(d.deviceId))
								.map((device) => (
									<div 
										key={`device-passive-${device.deviceId}`}
										style={{ display: device.deviceId === selectedDeviceId ? 'block' : 'none' }}
									>
										<DeviceCard
											deviceId={device.deviceId}
											data={device.value}
											onToggleGps={handleToggleGps}
											onToggleStats={handleToggleStats}
											onEndRental={handleEndRental}
											onResetTrip={handleResetTrip}
											onDeleteDevice={deleteDevice}
											formatDuration={formatDuration}
											routeHistory={[]} // Pasif cihaz - yol çizilmez, sadece anlık konum
											isPassive={true} // Pasif cihaz flag'i
											onGetMapCanvas={(mapCanvas) => {
												if (mapCanvas) {
													mapCanvasRefsRef.current.set(device.deviceId, mapCanvas);
													console.log(`[AdminPanel] MapCanvas ref stored for passive deviceId: ${device.deviceId}`);
												}
											}}
										/>
									</div>
								))}
							
							{/* Hiçbir device seçili değilse mesaj göster */}
							{!selectedDeviceId && (
								<p>Bir cihaz seçin</p>
							)}
						</>
					)}
				</div>				{/* Trip Detail Modal */}
				{selectedTrip && (
					<div className="modal-overlay" onClick={() => setSelectedTrip(null)}>
						<div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
							<h2>🗺️ Sürüş Detayları</h2>
							<div style={{ marginBottom: '20px' }}>
								<p style={{ color: '#222', fontWeight: 600 }}><span style={{ color: '#764ba2', fontWeight: 700 }}>Trip ID:</span> <span style={{ color: '#333', fontWeight: 700 }}>{selectedTrip.tripId}</span></p>
								<p style={{ color: '#222', fontWeight: 600 }}><span style={{ color: '#764ba2', fontWeight: 700 }}>Cihaz:</span> <span style={{ color: '#333', fontWeight: 700 }}>{selectedTrip.deviceId}</span></p>
								<p style={{ color: '#222', fontWeight: 600 }}><span style={{ color: '#667eea', fontWeight: 700 }}>📏 Mesafe:</span> <span style={{ color: '#333', fontWeight: 700 }}>{selectedTrip.totalDistance ? Number(selectedTrip.totalDistance).toFixed(3) : '—'} km</span></p>
								<p style={{ color: '#222', fontWeight: 600 }}><span style={{ color: '#667eea', fontWeight: 700 }}>⚡ Ort. Hız:</span> <span style={{ color: '#333', fontWeight: 700 }}>{selectedTrip.avgSpeed ? Number(selectedTrip.avgSpeed).toFixed(2) : '—'} km/h</span></p>
								<p style={{ color: '#222', fontWeight: 600 }}><span style={{ color: '#667eea', fontWeight: 700 }}>⏱️ Toplam Süre:</span> <span style={{ color: '#333', fontWeight: 700 }}>{selectedTrip.tripDuration ? formatDuration(selectedTrip.tripDuration) : '—'}</span></p>
								{selectedTrip.parkDuration !== undefined && selectedTrip.parkDuration > 0 && (
									<p style={{ color: '#222', fontWeight: 600 }}><span style={{ color: '#667eea', fontWeight: 700 }}>🅿️ Park Süresi:</span> <span style={{ color: '#333', fontWeight: 700 }}>{formatDuration(selectedTrip.parkDuration)}</span></p>
								)}
								<p style={{ color: '#222', fontWeight: 600 }}><span style={{ color: '#667eea', fontWeight: 700 }}>🕐 Başlangıç:</span> <span style={{ color: '#333', fontWeight: 700 }}>{selectedTrip.timestamp ? new Date(selectedTrip.timestamp).toLocaleString('tr-TR') : '—'}</span></p>
								<p style={{ color: '#222', fontWeight: 600 }}><span style={{ color: '#764ba2', fontWeight: 700 }}>Rota Noktaları:</span> <span style={{ color: '#333', fontWeight: 700 }}>{selectedTrip.realtimeRoute?.length || 0}</span></p>
							</div>
							
							{/* Ücret Bilgisi - her zaman hesapla ve göster */}
							{(() => {
								const distance = selectedTrip.totalDistance || 0;
								const totalDuration = selectedTrip.tripDuration || 0;
								const parkDuration = selectedTrip.parkDuration || 0;
								const driveDuration = totalDuration - parkDuration;
								
								const distanceCost = distance * 1; // 1₺/km
								const driveCost = (driveDuration / 60) * 2; // 2₺/dk sürüş
								const parkCost = (parkDuration / 60) * 1; // 1₺/dk park
								const totalCost = selectedTrip.totalCost ?? (distanceCost + driveCost + parkCost);
								
								return (
									<div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
										<h3 style={{ color: '#fff', marginBottom: '12px', fontSize: '16px' }}>💰 ÜCRET BİLGİSİ</h3>
										<div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '12px' }}>
											<div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', color: '#fff', fontSize: '13px' }}>
												<p>📏 Mesafe ({distance.toFixed(2)} km × 1₺):</p>
												<p style={{ textAlign: 'right', fontWeight: 600 }}>{distanceCost.toFixed(2)} ₺</p>
												
												<p>🚗 Sürüş ({(driveDuration / 60).toFixed(1)} dk × 2₺):</p>
												<p style={{ textAlign: 'right', fontWeight: 600 }}>{driveCost.toFixed(2)} ₺</p>
												
												{parkDuration > 0 && (
													<>
														<p>🅿️ Park ({(parkDuration / 60).toFixed(1)} dk × 1₺):</p>
														<p style={{ textAlign: 'right', fontWeight: 600 }}>{parkCost.toFixed(2)} ₺</p>
													</>
												)}
											</div>
											<hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.3)', margin: '12px 0' }} />
											<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
												<span style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>TOPLAM:</span>
												<span style={{ color: '#fff', fontSize: '24px', fontWeight: 700 }}>{totalCost.toFixed(2)} ₺</span>
											</div>
										</div>
									</div>
								);
							})()}
							
							{/* Trip Haritası - geçilen yolları göster */}
							{selectedTrip.lat !== undefined && selectedTrip.lon !== undefined && (
								<div style={{ height: '350px', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
									<MapCanvas 
										lat={selectedTrip.lat} 
										lon={selectedTrip.lon}
										routeHistory={selectedTrip.realtimeRoute || []}
									/>
								</div>
							)}								<button
									onClick={() => setSelectedTrip(null)}
									className="modal-btn confirm"
									style={{ width: '100%' }}
								>
									✓ Kapat
								</button>
							</div>
						</div>
					)}

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
													<div 
														key={trip.tripId} 
														className="trip-card"
														onClick={() => setSelectedTrip(trip)}
														style={{ cursor: 'pointer' }}
													>
														<p><strong>Trip ID:</strong> {trip.tripId}</p>
														{trip.totalDistance !== undefined && <p><strong>📏 Mesafe:</strong> {Number(trip.totalDistance).toFixed(3)} km</p>}
														{trip.avgSpeed !== undefined && <p><strong>⚡ Ort. Hız:</strong> {Number(trip.avgSpeed).toFixed(2)} km/h</p>}
														{trip.tripDuration !== undefined && <p><strong>⏱️ Sürüş Süresi:</strong> {formatDuration(trip.tripDuration)}</p>}
														{trip.speed !== undefined && <p><strong>🚗 Anlık Hız:</strong> {Number(trip.speed).toFixed(2)} km/h</p>}
														{trip.totalCost !== undefined && <p><strong>💰 Ücret:</strong> {Number(trip.totalCost).toFixed(2)} ₺</p>}
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

