import { memo, useRef, useEffect } from 'react';
import MapCanvas, { MapCanvasHandle } from './MapCanvas';

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

interface DeviceCardProps {
  deviceId: string;
  data: DeviceData;
  onToggleGps: (deviceId: string) => void;
  onToggleStats: (deviceId: string) => void;
  onEndRental: (deviceId: string) => void;
  onResetTrip: (deviceId: string) => void;
  onDeleteDevice?: (deviceId: string) => void;
  formatDuration: (seconds: number) => string;
  routeHistory?: Array<{ lat: number; lon: number; timestamp?: string }>;
  onRealtimePointsUpdate?: (deviceId: string, points: Array<{ lat: number; lon: number; timestamp?: string }>) => void;
  onGetMapCanvas?: (mapCanvas: MapCanvasHandle | null) => void;
  isPassive?: boolean; // Pasif cihaz - yol çizilmez, sadece anlık konum
}

const DeviceCard = memo(function DeviceCardComponent({
  deviceId,
  data: v,
  onToggleGps,
  onToggleStats,
  onEndRental,
  onResetTrip,
  onDeleteDevice,
  formatDuration,
  routeHistory = [],
  onRealtimePointsUpdate,
  onGetMapCanvas,
  isPassive = false,
}: DeviceCardProps) {
  const mapCanvasRef = useRef<MapCanvasHandle>(null);
  
  // MapCanvas ref'ini parent'a gönder (AdminPanel kullanacak)
  useEffect(() => {
    if (onGetMapCanvas) {
      onGetMapCanvas(mapCanvasRef.current);
    }
  }, [onGetMapCanvas]);
  
  // Realtime noktaları güncellerken callback çağır
  const handleRealtimePointsUpdate = (points: Array<{ lat: number; lon: number; timestamp?: string }>) => {
    console.log(`[DeviceCard] handleRealtimePointsUpdate: deviceId=${deviceId}, points=${points.length}`);
    if (onRealtimePointsUpdate) {
      onRealtimePointsUpdate(deviceId, points);
    }
  };

  // Ücret hesaplama fonksiyonu
  // Km başı: 1 TL, Dakika başı: 2 TL, Park modunda dakika başı: 1 TL
  const calculateCost = (distanceKm: number, driveDurationSec: number, parkDurationSec: number): number => {
    const kmCost = distanceKm * 1; // 1 TL/km
    const driveMinutes = driveDurationSec / 60;
    const driveCost = driveMinutes * 2; // 2 TL/dk sürüş
    const parkMinutes = parkDurationSec / 60;
    const parkCost = parkMinutes * 1; // 1 TL/dk park (yarı fiyat)
    return kmCost + driveCost + parkCost;
  };

  const lat = typeof v.lat === 'string' ? parseFloat(v.lat) : v.lat;
  const lon = typeof v.lon === 'string' ? parseFloat(v.lon) : v.lon;
  const speed = typeof v.speed === 'string' ? parseFloat(v.speed) : v.speed;
  const distance = typeof v.totalDistance === 'string' ? parseFloat(v.totalDistance) : v.totalDistance;
  const avgSpeed = typeof v.avgSpeed === 'string' ? parseFloat(v.avgSpeed) : v.avgSpeed;
  const tripDuration = typeof v.tripDuration === 'string' ? parseInt(v.tripDuration) : v.tripDuration;
  const parkDuration = typeof v.parkDuration === 'string' ? parseInt(v.parkDuration) : (v.parkDuration || 0);
  const timestamp = v.timestamp;

  // Sürüş süresi = Toplam süre - Park süresi
  const driveDuration = (tripDuration || 0) - parkDuration;
  // Toplam ücret hesapla
  const totalCost = calculateCost(distance || 0, driveDuration, parkDuration);

  const handleToggleGps = () => onToggleGps(deviceId);
  const handleToggleStats = () => onToggleStats(deviceId);
  const handleEndRental = () => onEndRental(deviceId);
  const handleResetTrip = () => onResetTrip(deviceId);

  return (
    <div className="device-card">
      <h2>📱 {deviceId}</h2>
      {/* Kontrol Durumu - butonlar */}
      <div className="device-status" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          className={v.gpsSend === true || v.gpsSend === "true" ? "active-btn" : "inactive-btn"}
          onClick={handleToggleGps}
        >
          {v.gpsSend === true || v.gpsSend === "true" ? "✅ GPS AKTİF" : "❌ GPS PASİF"}
        </button>
        <button
          className={v.statsSend === true || v.statsSend === "true" ? "active-btn" : "inactive-btn"}
          onClick={handleToggleStats}
        >
          {v.statsSend === true || v.statsSend === "true" ? "✅ STATS AKTİF" : "❌ STATS PASİF"}
        </button>
      </div>
      {/* ===== GPS VERİLERİ BÖLÜMÜ ===== */}
      <div className="data-section">
        <h3>🛰️ GPS VERİLERİ</h3>
        {/* GPS Konumu */}
        {lat !== undefined && lat !== null && lon !== undefined && lon !== null ? (
          <div className="device-info">
            <p className="info-text">📍 <strong>Konum:</strong> {Number(lat).toFixed(6)}, {Number(lon).toFixed(6)}</p>
            <div className="map-container" style={{ position: 'relative', height: '250px', borderRadius: '6px', overflow: 'hidden' }}>
              <div
                style={{
                  display: 'block',
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                <MapCanvas 
                  ref={mapCanvasRef}
                  lat={lat} 
                  lon={lon} 
                  routeHistory={routeHistory}
                  onRealtimePointsUpdate={handleRealtimePointsUpdate}
                  isPassive={isPassive}
                />
                <button
                  onClick={() => window.open(`https://www.google.com/maps?q=${lat},${lon}`, '_blank')}
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: '#667eea',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  title="Google Maps'te aç"
                >
                  🗺️ Google Maps'te Aç
                </button>
              </div>
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
              <p className="info-text">⏱️ <strong>Toplam Süre:</strong> {formatDuration(Number(tripDuration))}</p>
            )}
            {parkDuration > 0 && (
              <p className="info-text">🅿️ <strong>Park Süresi:</strong> {formatDuration(parkDuration)}</p>
            )}
            {driveDuration > 0 && (
              <p className="info-text">🚗 <strong>Sürüş Süresi:</strong> {formatDuration(driveDuration)}</p>
            )}
          </div>
        </div>
      )}
      {/* ===== ÜCRET BÖLÜMÜ (Sadece aktif kiralama için) ===== */}
      {!isPassive && (v.rentalActive === true || v.rentalActive === "true") && (
        <div className="data-section" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', padding: '16px', marginTop: '12px' }}>
          <h3 style={{ color: '#fff', marginBottom: '12px' }}>💰 ÜCRET BİLGİSİ</h3>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: '#fff', fontSize: '13px' }}>
              <p>📏 Mesafe ({(distance || 0).toFixed(2)} km × 1₺):</p>
              <p style={{ textAlign: 'right', fontWeight: 600 }}>{((distance || 0) * 1).toFixed(2)} ₺</p>
              
              <p>🚗 Sürüş ({(driveDuration / 60).toFixed(1)} dk × 2₺):</p>
              <p style={{ textAlign: 'right', fontWeight: 600 }}>{((driveDuration / 60) * 2).toFixed(2)} ₺</p>
              
              {parkDuration > 0 && (
                <>
                  <p>🅿️ Park ({(parkDuration / 60).toFixed(1)} dk × 1₺):</p>
                  <p style={{ textAlign: 'right', fontWeight: 600 }}>{((parkDuration / 60) * 1).toFixed(2)} ₺</p>
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
      )}
      {/* Timestamp */}
      {timestamp && (
        <p className="timestamp">Güncelleme: {new Date(timestamp).toLocaleString('tr-TR')}</p>
      )}
      {/* Device Control Buttons */}
      {(v.rentalActive === true || v.rentalActive === "true") && (
        <div className="device-controls">
          <button
            onClick={handleEndRental}
            className="device-control-btn end"
            title="Kiralama sonlandır"
          >
            🏁 Kiralama Bitir
          </button>
        </div>
      )}
      {/* Trip Reset Button */}
      <button
        onClick={handleResetTrip}
        className="device-control-btn reset"
        title="Trip verilerini sıfırla"
      >
        🔄 Trip Sıfırla
      </button>
      {/* Delete Button */}
      {onDeleteDevice && (
        <button
          onClick={() => onDeleteDevice(deviceId)}
          className="delete-device-btn"
          title="Cihazı sil"
        >
          🗑️ Cihazı Sil
        </button>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if specific data actually changed
  return (
    prevProps.deviceId === nextProps.deviceId &&
    prevProps.data.lat === nextProps.data.lat &&
    prevProps.data.lon === nextProps.data.lon &&
    prevProps.data.speed === nextProps.data.speed &&
    prevProps.data.totalDistance === nextProps.data.totalDistance &&
    prevProps.data.avgSpeed === nextProps.data.avgSpeed &&
    prevProps.data.tripDuration === nextProps.data.tripDuration &&
    prevProps.data.timestamp === nextProps.data.timestamp &&
    prevProps.data.gpsSend === nextProps.data.gpsSend &&
    prevProps.data.statsSend === nextProps.data.statsSend &&
    prevProps.data.rentalActive === nextProps.data.rentalActive
  );
});

export default DeviceCard;
