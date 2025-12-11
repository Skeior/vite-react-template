import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ClientMap from "./ClientMap";
import MapCanvas from "../AdminPage/MapCanvas";
import { PRICING_RATES, calculateLineItems, calculateTotal } from "../../utils/pricing";
import "./ClientPage.css";

interface DeviceValue {
  deviceId: string;
  lat?: number;
  lon?: number;
  speed?: number;
  totalDistance?: number;
  avgSpeed?: number;
  tripDuration?: number;
  parkDuration?: number;
  parkMode?: boolean | string;
  rentalActive?: boolean | string;
  gpsSend?: boolean | string;
  statsSend?: boolean | string;
  timestamp?: string;
  tripId?: string;
}

interface DeviceEntry {
  deviceId: string;
  value: DeviceValue;
}

interface TripEntry {
  tripId: string;
  deviceId: string;
  lat?: number;
  lon?: number;
  speed?: number;
  totalDistance?: number;
  avgSpeed?: number;
  tripDuration?: number;
  parkDuration?: number;
  totalCost?: number;
  timestamp?: string;
  rentalEndTime?: string;
}

function toNumber(v: any): number | undefined {
  if (v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function formatDuration(seconds?: number): string {
  if (seconds === undefined || seconds === null) return "-";
  if (seconds < 0) return "-";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}sa ${m}dk`;
  return `${m}dk`;
}

// Aktif kiralamalarda saniye dahil gösterim
function formatDurationWithSeconds(seconds?: number): string {
  if (seconds === undefined || seconds === null) return "-";
  if (seconds < 0) return "-";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}sa ${m}dk ${s}sn`;
  if (m > 0) return `${m}dk ${s}sn`;
  return `${s}sn`;
}

export default function ClientPage() {
  const [devices, setDevices] = useState<DeviceEntry[]>([]);
  const [trips, setTrips] = useState<TripEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [rentalModal, setRentalModal] = useState<{ deviceId: string; lat: number; lon: number } | null>(null);
  const [rentalLoading, setRentalLoading] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripEntry | null>(null);
  const [selectedTripRoute, setSelectedTripRoute] = useState<any[]>([]);
  const [activeRentalRoute, setActiveRentalRoute] = useState<any[]>([]);
  const [rentalStartTime, setRentalStartTime] = useState<number | null>(null);
  // Kiralama sayaçlarını tek bir obje içinde takip et
  const [rentalTimers, setRentalTimers] = useState<{ totalSeconds: number; driveSeconds: number; parkSeconds: number }>({ totalSeconds: 0, driveSeconds: 0, parkSeconds: 0 });
  const [parkStartTime, setParkStartTime] = useState<number | null>(null);
  // Motion alerts (park modunda hareket algılanırsa bildirim)
  const [motionAlerts, setMotionAlerts] = useState<Array<{ deviceId: string; timestamp: string }>>([]);
  const [lastMotionTimestamp, setLastMotionTimestamp] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [endRentalConfirmOpen, setEndRentalConfirmOpen] = useState<boolean>(false);

  const fetchTripRoute = useCallback(async (tripId: string) => {
    // fetchTripRoute
    try {
      const res = await fetch(`/admin/trips/${tripId}`);
      if (!res.ok) throw new Error("Trip rotası alınamadı");
      const data = await res.json();
      
      // Convert route data to RoutePoint format
      let routePoints = [];
      if (data.realtimeRoute && Array.isArray(data.realtimeRoute)) {
        routePoints = data.realtimeRoute.map((point: any) => ({
          lat: toNumber(point.lat) || point.lat,
          lon: toNumber(point.lon) || point.lon,
          timestamp: point.timestamp
        }));
      } else if (data.routePoints && Array.isArray(data.routePoints)) {
        routePoints = data.routePoints.map((point: any) => ({
          lat: toNumber(point.lat) || point.lat,
          lon: toNumber(point.lon) || point.lon,
          timestamp: point.timestamp
        }));
      }
      
      setSelectedTripRoute(routePoints);
    } catch (e) {
      // Trip route fetch error
      setSelectedTripRoute([]);
    }
  }, []);

  const selectedDeviceId = searchParams.get("deviceId");

  const activeDevice = useMemo(() => {
    if (!selectedDeviceId) return undefined;
    return devices.find((d) => d.deviceId === selectedDeviceId);
  }, [devices, selectedDeviceId]);

  const passiveDevices = useMemo(() => {
    return devices.filter((d) => {
      const active = d.value?.rentalActive === true || d.value?.rentalActive === "true";
      return !active && d.value?.lat !== undefined && d.value?.lon !== undefined;
    });
  }, [devices]);

  const isRentalActive = activeDevice?.value?.rentalActive === true || activeDevice?.value?.rentalActive === "true";

  const myTrips = useMemo(() => {
    if (!selectedDeviceId) return [] as TripEntry[];
    return trips.filter((t) => t.deviceId === selectedDeviceId);
  }, [trips, selectedDeviceId]);

  const pickInitialDevice = useCallback(
    (list: DeviceEntry[]): string | null => {
      if (!list.length) return null;
      const active = list.find((d) => d.value?.rentalActive === true || d.value?.rentalActive === "true");
      return active?.deviceId || list[0].deviceId;
    },
    []
  );

  const setDeviceId = useCallback(
    (deviceId: string) => {
      const next = new URLSearchParams(searchParams);
      next.set("deviceId", deviceId);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch("/admin/devices");
      if (!res.ok) throw new Error("Cihazlar alınamadı");
      const data = await res.json();
      setDevices(data.devices || []);

      // Aktif kiralamaları tespit et (sadece seçili cihaz için)
      const activeTripsToFetch: string[] = [];
      // anyActiveRental kaldırıldı (kullanılmıyor)
      data.devices?.forEach((d: any) => {
        if (!selectedDeviceId) return;
        if (d.deviceId !== selectedDeviceId) return;
        if (d.value && (d.value.rentalActive === true || d.value.rentalActive === "true") && d.value.tripId) {
          activeTripsToFetch.push(d.value.tripId);
        }
      });

      // Active rentals count

      // Aktif trip'lerin route'larını fetch et
      for (const tripId of activeTripsToFetch) {
        try {
          const tripRes = await fetch(`/admin/trips/${tripId}`);
          if (tripRes.ok) {
            const tripData = await tripRes.json();
            if (tripData.routePoints && tripData.routePoints.length > 0) {
              // Fetched route points
              setActiveRentalRoute(tripData.routePoints);
            }
          }
        } catch (err) {
          // Failed to fetch route for trip
        }
      }

      // Eğer aktif rental yoksa route'u temizle
      if (activeTripsToFetch.length === 0) {
        setActiveRentalRoute([]);
        setRentalStartTime(null);
        setRentalTimers({ totalSeconds: 0, driveSeconds: 0, parkSeconds: 0 });
        setParkStartTime(null);
      } else {
        // Sadece seçili cihaz için kiralama sayaçlarını yönet
        if (rentalStartTime === null) {
          setRentalStartTime(Date.now());
          setRentalTimers({ totalSeconds: 0, driveSeconds: 0, parkSeconds: 0 });
        }
      }

      // Motion alerts: parkMode + motionDetected
      const alerts: Array<{ deviceId: string; timestamp: string }> = [];
      data.devices?.forEach((d: any) => {
        if (d.value && (d.value.parkMode === true || d.value.parkMode === "true") && d.value.motionDetected && d.value.motionDetectedAt) {
          alerts.push({ deviceId: d.deviceId, timestamp: d.value.motionDetectedAt });
        }
      });
      if (alerts.length > 0) {
        const latestAlert = alerts[alerts.length - 1];
        if (latestAlert.timestamp !== lastMotionTimestamp) {
          setLastMotionTimestamp(latestAlert.timestamp);
          try {
            if (Notification && Notification.permission === 'granted') {
              new Notification('Hareket algılandı', { body: `${latestAlert.deviceId}: Park modunda hareket!` });
            } else if (Notification && Notification.permission !== 'denied') {
              Notification.requestPermission().then((perm) => {
                if (perm === 'granted') {
                  new Notification('Hareket algılandı', { body: `${latestAlert.deviceId}: Park modunda hareket!` });
                }
              });
            }
          } catch {}
          // Sesli uyarı ve toast (Admin’deki davranışla uyumlu)
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ0PVqzn77BdGAg+ltryxnMpBSl+zPLaizsIGGS56+ihUAwKTKXh8bllHAU2jtXvxXwsBS2Ay/HSjjwIGGK36+mjUg0LULF==');
            audio.play();
          } catch {}
          setToastMessage(`⚠️ ${latestAlert.deviceId}: Park modunda hareket algılandı!`);
          setTimeout(() => setToastMessage(null), 4000);
        }
      }
      setMotionAlerts(alerts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cihaz hatası");
    }
  }, [rentalStartTime]);

  const fetchTrips = useCallback(async () => {
    try {
      const res = await fetch("/admin/trips?sortBy=timestamp");
      if (!res.ok) throw new Error("Sürüş geçmişi alınamadı");
      const data = await res.json();
      setTrips(data.trips || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Geçmiş hatası");
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchDevices();
    fetchTrips();
    
    const tripInterval = window.setInterval(fetchTrips, 20000);
    return () => {
      window.clearInterval(tripInterval);
    };
  }, [fetchDevices, fetchTrips]);

  // Fast polling - her zaman aktif rental olduğunda, veya selected device olduğunda
  useEffect(() => {
    // Polling şartı: aktif rental VEYA bir device seçilmiş olması
    const shouldPoll = isRentalActive || selectedDeviceId;
    if (!shouldPoll) return;

    const interval = setInterval(() => {
      fetchDevices();
    }, 200); // 200ms - fast GPS updates
    return () => clearInterval(interval);
  }, [isRentalActive, selectedDeviceId, fetchDevices]);

  const handleDeviceSelect = useCallback(
    (deviceId: string) => {
      // Block device selection if rental is active
      if (isRentalActive) {
        setError("Aktif kiralama sırasında başka cihaza geçemezsiniz");
        return;
      }
      const device = devices.find((d) => d.deviceId === deviceId);
      if (!device) return;
      const lat = toNumber(device.value.lat);
      const lon = toNumber(device.value.lon);
      if (lat === undefined || lon === undefined) return;
      setRentalModal({ deviceId, lat, lon });
    },
    [devices, isRentalActive]
  );

  const handleStartRental = useCallback(async () => {
    if (!rentalModal) return;
    setRentalLoading(true);
    try {
      const res = await fetch("/rental/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: rentalModal.deviceId }),
      });
      if (!res.ok) throw new Error("Kiralama başlatılamadı");
      setDeviceId(rentalModal.deviceId);
      setRentalModal(null);
      setActiveRentalRoute([]);
      // Kiralama başlama zamanını kaydet
      setRentalStartTime(Date.now());
      setRentalTimers({ totalSeconds: 0, driveSeconds: 0, parkSeconds: 0 });
      setParkStartTime(null);
      // setRentalStartTime(Date.now());
      // setElapsedSeconds(0);
      // setParkStartTime(null);
      // Fetch devices immediately to get the new trip data
      await new Promise(resolve => setTimeout(resolve, 100));
      await fetchDevices();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kiralama hatası");
    } finally {
      setRentalLoading(false);
    }
  }, [rentalModal, setDeviceId, fetchDevices]);

  const handleEndRental = useCallback(async () => {
    if (!selectedDeviceId || !isRentalActive) return;
    setRentalLoading(true);
    try {
      const res = await fetch("/rental/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: selectedDeviceId }),
      });
      if (!res.ok) throw new Error("Kiralama sonlandırılamadı");
      // Client: Anında sonlandırma ve yerel state reset (admin ile aynı davranış)
      setActiveRentalRoute([]);
      setRentalStartTime(null);
      setRentalTimers({ totalSeconds: 0, driveSeconds: 0, parkSeconds: 0 });
      setParkStartTime(null);
      // Güvenlik: Cihaz state'ini kiralık değil olarak işaretle (stale state önleme)
      try {
        await fetch("/admin/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId: selectedDeviceId, rentalActive: false })
        });
      } catch {}
      // Fetch updated data from D1
      await new Promise(resolve => setTimeout(resolve, 100));
      await fetchDevices();
      await fetchTrips();
      // Opsiyonel: en son trip'i modalda göster
      try {
        const tripsRes = await fetch("/admin/trips?sortBy=timestamp");
        if (tripsRes.ok) {
          const tripsData = await tripsRes.json();
          const latestTrip = tripsData.trips?.find((t: any) => t.deviceId === selectedDeviceId);
          if (latestTrip) {
            setSelectedTrip(latestTrip);
            fetchTripRoute(latestTrip.tripId);
          }
        }
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sonlandırma hatası");
    } finally {
      setRentalLoading(false);
    }
  }, [selectedDeviceId, isRentalActive, fetchDevices, fetchTrips, fetchTripRoute]);
  const controlDevice = useCallback(async (deviceId: string, parkMode?: boolean) => {
    try {
      const payload: any = {};
      if (parkMode !== undefined) payload.parkMode = parkMode;
      
      const res = await fetch(`/rental/control/${deviceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) throw new Error("Kontrol gönderilemedi");
      await fetchDevices();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kontrol hatası");
    }
  }, [fetchDevices]);

  const togglePark = useCallback(async () => {
    if (!selectedDeviceId) return;
    const dev = devices.find(d => d.deviceId === selectedDeviceId);
    const currentParkMode = dev?.value?.parkMode === true || dev?.value?.parkMode === "true";
    const newParkMode = !currentParkMode;
    
    // Park modu açılırsa, park başlama zamanını kaydet
    if (newParkMode) {
      setParkStartTime(Date.now());
      setRentalTimers((prev) => ({ ...prev, parkSeconds: 0 }));
    } else {
      // Park modundan çıkılırsa, park süresi sayımını durdur
      setParkStartTime(null);
    }
    
    await controlDevice(selectedDeviceId, newParkMode);
  }, [selectedDeviceId, devices, controlDevice]);

  useEffect(() => {
    if (selectedDeviceId || !devices.length) return;
    const initial = pickInitialDevice(devices);
    if (initial) setDeviceId(initial);
  }, [devices, pickInitialDevice, selectedDeviceId, setDeviceId]);

  // Kiralama süresi sayıcısı - her saniye toplam kiralama süresi artmalı
  useEffect(() => {
    if (!rentalStartTime) return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - rentalStartTime) / 1000);
      setRentalTimers((prev) => ({ ...prev, totalSeconds: elapsed }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [rentalStartTime]);

  // Drive duration hesaplama - Kiralama - Park
  useEffect(() => {
    const driveSecs = rentalTimers.totalSeconds - rentalTimers.parkSeconds;
    setRentalTimers((prev) => ({ ...prev, driveSeconds: Math.max(0, driveSecs) }));
  }, [rentalTimers.totalSeconds, rentalTimers.parkSeconds]);

  // Park süresi sayıcısı - park modunda park süresi artmalı
  useEffect(() => {
    if (!parkStartTime) return;
    
    const interval = setInterval(() => {
      const parkSecs = Math.floor((Date.now() - parkStartTime) / 1000);
      setRentalTimers((prev) => ({ ...prev, parkSeconds: parkSecs }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [parkStartTime]);

  const liveSpeed = toNumber(activeDevice?.value?.speed);
  const liveLat = toNumber(activeDevice?.value?.lat);
  const liveLon = toNumber(activeDevice?.value?.lon);
  const totalDistance = toNumber(activeDevice?.value?.totalDistance);
  const avgSpeed = toNumber(activeDevice?.value?.avgSpeed);
  const tripDuration = toNumber(activeDevice?.value?.tripDuration);

  // Kiralama modu hesaplamaları
  // Ücret hesaplama: Sürüş 2 TL/dk, Park 0.5 TL/dk, Mesafe 1 TL/km
  // Eski client ücret kartı kaldırıldı; aşağıda map altındaki yeni ücret bloğu doğrudan hesap yapıyor
  // Client tarafında eski ücret kartını kaldırdığımız için bu değişken kullanılmıyor
  // const totalCost = driveCost + parkCost + distanceCost;

  return (
    <div className="client-page">
      <header className="client-hero">
        <div>
          <p className="eyebrow">Demo mode</p>
          <h1>Your Ride</h1>
          <p className="sub">Kiraladığın aracı canlı takip et, geçmiş sürüşlerini incele.</p>
        </div>
        <div className="hero-actions">
          <select
            className="device-select"
            value={selectedDeviceId || ""}
            onChange={(e) => setDeviceId(e.target.value)}
            disabled={isRentalActive}
            aria-label="Cihaz seç"
          >
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.deviceId}
              </option>
            ))}
          </select>
          <span className={`pill ${isRentalActive ? "pill-active" : "pill-passive"}`}>
            {isRentalActive ? "Aktif Kiralama" : "Pasif"}
          </span>
          {isRentalActive && (
            <button
              className="btn-end-rental"
              onClick={() => setEndRentalConfirmOpen(true)}
              disabled={rentalLoading}
            >
              {rentalLoading ? "Sonlandırılıyor..." : "Sürüşü Bitir"}
            </button>
          )}
        </div>
      </header>

      {error && <div className="client-error">{error}</div>}

      <section className="cards-grid">
        <div className="card highlight">
          <p className="card-label">Anlık hız</p>
          <p className="card-value">{liveSpeed !== undefined ? `${liveSpeed.toFixed(1)} km/h` : "-"}</p>
          <p className="card-meta">Konum: {liveLat !== undefined && liveLon !== undefined ? `${liveLat.toFixed(4)}, ${liveLon.toFixed(4)}` : "-"}</p>
        </div>

        <div className="card">
          <p className="card-label">Toplam mesafe</p>
          <p className="card-value">{totalDistance !== undefined ? `${totalDistance.toFixed(2)} km` : "-"}</p>
          <p className="card-meta">Ortalama hız: {avgSpeed !== undefined ? `${avgSpeed.toFixed(1)} km/h` : "-"}</p>
        </div>

        <div className="card">
          <p className="card-label">{isRentalActive ? "Kiralama süresi" : "Sürüş süresi"}</p>
          <p className="card-value">{isRentalActive ? formatDurationWithSeconds(rentalTimers.totalSeconds) : formatDuration(tripDuration)}</p>
          <p className="card-meta">{isRentalActive ? "Site tarafından sayılıyor" : "Cihazdan gelen veri"}</p>
        </div>

        {isRentalActive && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
            <p className="card-label">Park Modu</p>
            <span className={`pill ${activeDevice?.value?.parkMode === true || activeDevice?.value?.parkMode === "true" ? "pill-active" : "pill-passive"}`} style={{ fontSize: '14px' }}>
              {activeDevice?.value?.parkMode === true || activeDevice?.value?.parkMode === "true" ? "✅ AKTİF" : "⭕ KAPALI"}
            </span>
            <p className="card-meta" style={{ margin: '4px 0' }}>
              {activeDevice?.value?.parkMode === true || activeDevice?.value?.parkMode === "true" 
                ? `Park süresi: ${formatDurationWithSeconds(rentalTimers.parkSeconds)}` 
                : "Park kapalı"}
            </p>
            <button 
              onClick={togglePark}
              style={{
                backgroundColor: activeDevice?.value?.parkMode === true || activeDevice?.value?.parkMode === "true" ? '#f44336' : '#4CAF50',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                minWidth: '140px'
              }}
            >
              {activeDevice?.value?.parkMode === true || activeDevice?.value?.parkMode === "true" ? "🛑 Kapat" : "🅿️ Aç"}
            </button>
          </div>
        )}
      </section>

      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'rgba(20,25,36,0.95)',
          color: '#ffe08a',
          border: '1px solid rgba(255, 208, 122, 0.5)',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
          zIndex: 3000
        }}>
          {toastMessage}
        </div>
      )}
      {/* Ücret bilgisini admin tasarımından client'e taşıyacağız: map altına koyacağız */}

      <section className="map-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Harita</p>
            <h2>{isRentalActive ? "Aktif sürüş" : selectedTrip ? "Trip Detayları" : "Pasif motorlar"}</h2>
          </div>
          <p className="card-meta">{isRentalActive ? "Canlı takip" : selectedTrip ? "Geçmiş sürüş" : `${passiveDevices.length} araç`}</p>
        </div>
        <div className="map-card">
          {(isRentalActive || activeRentalRoute.length > 0) ? (
            (() => {
              const DEFAULT_LAT = 41.015137;
              const DEFAULT_LON = 28.979530;
              const centerLat = liveLat ?? DEFAULT_LAT;
              const centerLon = liveLon ?? DEFAULT_LON;
              const hasValidCenter = typeof centerLat === 'number' && typeof centerLon === 'number' && !Number.isNaN(centerLat) && !Number.isNaN(centerLon);
              const safeRoute = Array.isArray(activeRentalRoute)
                ? activeRentalRoute.filter((p: any) => p && typeof p.lat === 'number' && typeof p.lon === 'number' && !Number.isNaN(p.lat) && !Number.isNaN(p.lon))
                : [];
              if (!hasValidCenter) {
                // invalid center, skip map
                return null;
              }
              return (
                <MapCanvas
                  key="active-rental"
                  lat={centerLat}
                  lon={centerLon}
                  routeHistory={safeRoute}
                  isPassive={false}
                />
              );
            })()
          ) : selectedTrip ? (
            (() => {
              const DEFAULT_LAT = 41.015137;
              const DEFAULT_LON = 28.979530;
              const centerLat = selectedTrip.lat ?? DEFAULT_LAT;
              const centerLon = selectedTrip.lon ?? DEFAULT_LON;
              const hasValidCenter = typeof centerLat === 'number' && typeof centerLon === 'number' && !Number.isNaN(centerLat) && !Number.isNaN(centerLon);
              const safeRoute = Array.isArray(selectedTripRoute)
                ? selectedTripRoute.filter((p: any) => p && typeof p.lat === 'number' && typeof p.lon === 'number' && !Number.isNaN(p.lat) && !Number.isNaN(p.lon))
                : [];
              if (!hasValidCenter) {
                // invalid center, skip map
                return null;
              }
              return (
                <MapCanvas
                  key={`trip-${selectedTrip.tripId}`}
                  lat={centerLat}
                  lon={centerLon}
                  routeHistory={safeRoute}
                  isPassive={false}
                />
              );
            })()
          ) : (
            <ClientMap
              key="passive"
              devices={passiveDevices.map((d) => ({
                deviceId: d.deviceId,
                lat: toNumber(d.value.lat) ?? 0,
                lon: toNumber(d.value.lon) ?? 0,
                rentalActive: d.value.rentalActive,
              }))}
              selectedDeviceId={selectedDeviceId}
              onSelectDevice={handleDeviceSelect}
            />
          )}
        </div>
        {isRentalActive && (
          <div className="card" style={{ background: '#1f1f1f', borderLeft: '3px solid #ff0000', borderRadius: '12px', padding: '1.25rem', border: '1px solid #2a2a2a', marginTop: '1rem' }}>
            <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: 'clamp(0.95rem, 3vw, 1.1rem)' }}>💰 ÜCRET BİLGİSİ</h3>
            <div style={{ background: '#252525', borderRadius: '10px', padding: '1rem', border: '1px solid #333' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)' }}>
                <p style={{ margin: 0 }}>📏 Mesafe ({(totalDistance || 0).toFixed(2)} km × {PRICING_RATES.perKm}₺)</p>
                <p style={{ margin: 0, textAlign: 'right', fontWeight: 600, color: '#fff' }}>{(calculateLineItems(totalDistance || 0, rentalTimers.driveSeconds, rentalTimers.parkSeconds).kmCost).toFixed(2)} ₺</p>
                <p style={{ margin: 0 }}>🚗 Sürüş süresi ({(rentalTimers.driveSeconds / 60).toFixed(1)} dk × {PRICING_RATES.drivePerMinute}₺)</p>
                <p style={{ margin: 0, textAlign: 'right', fontWeight: 600, color: '#fff' }}>{(calculateLineItems(totalDistance || 0, rentalTimers.driveSeconds, rentalTimers.parkSeconds).driveCost).toFixed(2)} ₺</p>
                {rentalTimers.parkSeconds > 0 && (
                  <>
                    <p style={{ margin: 0 }}>🅿️ Park ({(rentalTimers.parkSeconds / 60).toFixed(1)} dk × {PRICING_RATES.parkPerMinute}₺)</p>
                    <p style={{ margin: 0, textAlign: 'right', fontWeight: 600, color: '#fff' }}>{(calculateLineItems(totalDistance || 0, rentalTimers.driveSeconds, rentalTimers.parkSeconds).parkCost).toFixed(2)} ₺</p>
                  </>
                )}
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #3a3a3a', margin: '1rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontSize: 'clamp(1rem, 3vw, 1.1rem)', fontWeight: 600 }}>TOPLAM:</span>
                <span style={{ color: '#ff0000', fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 700 }}>{calculateTotal((totalDistance || 0), rentalTimers.driveSeconds, rentalTimers.parkSeconds).toFixed(2)} ₺</span>
              </div>
            </div>
          </div>
        )}
        {motionAlerts.length > 0 && (
          <div className="card" style={{ background: '#1b2a2f', borderLeft: '3px solid #ffcc00', borderRadius: '12px', padding: '1rem', border: '1px solid #334a52', marginTop: '1rem' }}>
            <strong style={{ color: '#ffcc00' }}>⚠️ Park modunda hareket algılandı</strong>
            <p style={{ color: '#cfe7ef', margin: '6px 0 0' }}>{motionAlerts[motionAlerts.length - 1].deviceId} için en son: {new Date(motionAlerts[motionAlerts.length - 1].timestamp).toLocaleString('tr-TR')}</p>
          </div>
        )}
      </section>



      <section className="history-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Geçmiş sürüşler</p>
            <h2>Rides</h2>
          </div>
          <p className="card-meta">{myTrips.length} kayıt</p>
        </div>
        <div className="history-list">
          {myTrips.length === 0 && <div className="card">Kayıt bulunamadı.</div>}
          {myTrips.map((trip) => {
            const distance = trip.totalDistance || 0;
            const rentalDurationSeconds = (() => {
              if (trip.tripDuration && trip.tripDuration > 0) return trip.tripDuration;
              const startTs = trip.timestamp ? new Date(trip.timestamp).getTime() : 0;
              const endTs = trip.rentalEndTime ? new Date(trip.rentalEndTime).getTime() : 0;
              const diff = endTs && startTs ? Math.max(0, Math.floor((endTs - startTs) / 1000)) : 0;
              return diff;
            })();
            const driveSeconds = Math.max(0, rentalDurationSeconds - (trip.parkDuration || 0));
            const total = trip.totalCost ?? calculateTotal(distance, driveSeconds, trip.parkDuration || 0);
            return (
            <button
              type="button"
              className={`history-item ${selectedTrip?.tripId === trip.tripId ? "selected" : ""}`}
              key={trip.tripId}
              onClick={() => {
                // Trip clicked
                setSelectedTrip(trip);
                fetchTripRoute(trip.tripId);
              }}
            >
              <div>
                <p className="card-label">{trip.timestamp ? new Date(trip.timestamp).toLocaleString("tr-TR") : "-"}</p>
                <p className="card-value subtle">{trip.totalDistance !== undefined ? `${trip.totalDistance.toFixed(2)} km` : "-"}</p>
              </div>
              <div className="history-meta">
                <span>{trip.avgSpeed !== undefined ? `${trip.avgSpeed.toFixed(1)} km/h` : "-"}</span>
                <span>⏱️ {formatDuration(rentalDurationSeconds)}</span>
                <span>💰 {total.toFixed(2)} ₺</span>
              </div>
            </button>
          );})}
        </div>
      </section>

      {selectedTrip && (
        <div className="rental-modal-overlay" onClick={() => {
          // Closing trip modal
          setSelectedTrip(null);
          setSelectedTripRoute([]);
        }}>
          <div className="trip-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-trip">
              <h3>🗺️ Sürüş Detayları</h3>
              <button className="modal-close" onClick={() => {
                setSelectedTrip(null);
                setSelectedTripRoute([]);
              }}>×</button>
            </div>
            <div className="trip-info-grid">
              <div className="trip-info-item">
                <span className="trip-info-label">Trip ID:</span>
                <span className="trip-info-value">{selectedTrip.tripId}</span>
              </div>
              <div className="trip-info-item">
                <span className="trip-info-label">Cihaz:</span>
                <span className="trip-info-value">{selectedTrip.deviceId}</span>
              </div>
              <div className="trip-info-item">
                <span className="trip-info-label">📏 Mesafe:</span>
                <span className="trip-info-value">{selectedTrip.totalDistance?.toFixed(2) || "0.00"} km</span>
              </div>
              <div className="trip-info-item">
                <span className="trip-info-label">📍 Ort. Hız:</span>
                <span className="trip-info-value">{selectedTrip.avgSpeed?.toFixed(1) || "0.0"} km/h</span>
              </div>
              <div className="trip-info-item">
                <span className="trip-info-label">⏱️ Kiralama Süresi:</span>
                <span className="trip-info-value">{(() => {
                  const startTs = selectedTrip.timestamp ? new Date(selectedTrip.timestamp).getTime() : 0;
                  const endTs = selectedTrip.rentalEndTime ? new Date(selectedTrip.rentalEndTime).getTime() : 0;
                  const fallback = endTs && startTs ? Math.max(0, Math.floor((endTs - startTs) / 1000)) : 0;
                  const seconds = selectedTrip.tripDuration && selectedTrip.tripDuration > 0 ? selectedTrip.tripDuration : fallback;
                  return formatDuration(seconds);
                })()}</span>
              </div>
              <div className="trip-info-item">
                <span className="trip-info-label">💰 Ücret:</span>
                <span className="trip-info-value">{(() => {
                  const distance = selectedTrip.totalDistance || 0;
                  const startTs = selectedTrip.timestamp ? new Date(selectedTrip.timestamp).getTime() : 0;
                  const endTs = selectedTrip.rentalEndTime ? new Date(selectedTrip.rentalEndTime).getTime() : 0;
                  const fallback = endTs && startTs ? Math.max(0, Math.floor((endTs - startTs) / 1000)) : 0;
                  const rentalSeconds = selectedTrip.tripDuration && selectedTrip.tripDuration > 0 ? selectedTrip.tripDuration : fallback;
                  const driveSeconds = Math.max(0, rentalSeconds - (selectedTrip.parkDuration || 0));
                  const total = selectedTrip.totalCost ?? calculateTotal(distance, driveSeconds, selectedTrip.parkDuration || 0);
                  return `${total.toFixed(2)} ₺`;
                })()}</span>
              </div>
              <div className="trip-info-item">
                <span className="trip-info-label">📅 Tarih:</span>
                <span className="trip-info-value">{selectedTrip.timestamp ? new Date(selectedTrip.timestamp).toLocaleString("tr-TR") : "-"}</span>
              </div>
            </div>

            {(() => {
              const distance = selectedTrip.totalDistance || 0;
              const startTs = selectedTrip.timestamp ? new Date(selectedTrip.timestamp).getTime() : 0;
              const endTs = selectedTrip.rentalEndTime ? new Date(selectedTrip.rentalEndTime).getTime() : 0;
              const fallback = endTs && startTs ? Math.max(0, Math.floor((endTs - startTs) / 1000)) : 0;
              const rentalSeconds = selectedTrip.tripDuration && selectedTrip.tripDuration > 0 ? selectedTrip.tripDuration : fallback;
              const parkSeconds = selectedTrip.parkDuration || 0;
              const driveSeconds = Math.max(0, rentalSeconds - parkSeconds);
              const { kmCost, driveCost, parkCost } = calculateLineItems(distance, driveSeconds, parkSeconds);
              const totalCost = selectedTrip.totalCost ?? calculateTotal(distance, driveSeconds, parkSeconds);
              return (
                <div className="card" style={{ background: '#1f1f1f', borderLeft: '3px solid #ff0000', borderRadius: '12px', padding: '1.25rem', border: '1px solid #2a2a2a', marginTop: '1rem' }}>
                  <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: 'clamp(0.95rem, 3vw, 1.1rem)' }}>💰 ÜCRET BİLGİSİ</h3>
                  <div style={{ background: '#252525', borderRadius: '10px', padding: '1rem', border: '1px solid #333' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)' }}>
                      <p style={{ margin: 0 }}>📏 Mesafe ({distance.toFixed(2)} km × {PRICING_RATES.perKm}₺)</p>
                      <p style={{ margin: 0, textAlign: 'right', fontWeight: 600, color: '#fff' }}>{kmCost.toFixed(2)} ₺</p>
                      <p style={{ margin: 0 }}>🚗 Sürüş süresi ({(driveSeconds / 60).toFixed(1)} dk × {PRICING_RATES.drivePerMinute}₺)</p>
                      <p style={{ margin: 0, textAlign: 'right', fontWeight: 600, color: '#fff' }}>{driveCost.toFixed(2)} ₺</p>
                      {parkSeconds > 0 && (
                        <>
                          <p style={{ margin: 0 }}>🅿️ Park ({(parkSeconds / 60).toFixed(1)} dk × {PRICING_RATES.parkPerMinute}₺)</p>
                          <p style={{ margin: 0, textAlign: 'right', fontWeight: 600, color: '#fff' }}>{parkCost.toFixed(2)} ₺</p>
                        </>
                      )}
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid #3a3a3a', margin: '1rem 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#fff', fontSize: 'clamp(1rem, 3vw, 1.1rem)', fontWeight: 600 }}>TOPLAM:</span>
                      <span style={{ color: '#ff0000', fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 700 }}>{totalCost.toFixed(2)} ₺</span>
                    </div>
                  </div>
                </div>
              );
            })()}
            
            {(() => {
              const DEFAULT_LAT = 41.015137;
              const DEFAULT_LON = 28.979530;
              const centerLat = selectedTrip.lat ?? DEFAULT_LAT;
              const centerLon = selectedTrip.lon ?? DEFAULT_LON;
              const hasValidCenter = typeof centerLat === 'number' && typeof centerLon === 'number' && !Number.isNaN(centerLat) && !Number.isNaN(centerLon);
              const safeRoute = Array.isArray(selectedTripRoute)
                ? selectedTripRoute.filter((p: any) => p && typeof p.lat === 'number' && typeof p.lon === 'number' && !Number.isNaN(p.lat) && !Number.isNaN(p.lon))
                : [];
              if (!hasValidCenter) {
                // invalid modal map center, skip
                return null;
              }
              return (
                <div className="trip-map-container">
                  <h3 style={{ marginBottom: '12px', fontSize: '14px', color: '#a9b3c7', textTransform: 'uppercase', letterSpacing: '0.08em' }}>🗺️ Sürüş Rotası</h3>
                  <MapCanvas 
                    lat={centerLat} 
                    lon={centerLon}
                    routeHistory={safeRoute}
                    isPassive={true}
                  />
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {rentalModal && (
        <div className="rental-modal-overlay" onClick={() => !rentalLoading && setRentalModal(null)}>
          <div className="rental-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Kiralama Onayı</h3>
            <p className="modal-device-id">{rentalModal.deviceId}</p>
            <p className="modal-coords">Konum: {rentalModal.lat.toFixed(4)}, {rentalModal.lon.toFixed(4)}</p>
            <p className="modal-info">Bu aracı kiralamak istiyor musunuz?</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setRentalModal(null)} disabled={rentalLoading}>
                İptal
              </button>
              <button className="btn-primary" onClick={handleStartRental} disabled={rentalLoading}>
                {rentalLoading ? "Başlatılıyor..." : "Kirala"}
              </button>
            </div>
          </div>
        </div>
      )}

      {endRentalConfirmOpen && (
        <div className="rental-modal-overlay" onClick={() => !rentalLoading && setEndRentalConfirmOpen(false)}>
          <div className="rental-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Kiralama Sonlandırma</h3>
            <p className="modal-device-id">{selectedDeviceId}</p>
            <p className="modal-info">Sürüşü bitirmek istediğinizden emin misiniz?</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setEndRentalConfirmOpen(false)} disabled={rentalLoading}>
                İptal
              </button>
              <button
                className="btn-primary"
                onClick={async () => {
                  await handleEndRental();
                  setEndRentalConfirmOpen(false);
                }}
                disabled={rentalLoading}
              >
                {rentalLoading ? "Sonlandırılıyor..." : "Evet, Bitir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
