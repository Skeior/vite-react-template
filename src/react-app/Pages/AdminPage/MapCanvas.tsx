import { useEffect, useRef, memo, forwardRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RoutePoint {
  lat: number;
  lon: number;
  timestamp?: string;
}

interface MapCanvasProps {
  lat: number;
  lon: number;
  routeHistory?: RoutePoint[];
  onRealtimePointsUpdate?: (points: RoutePoint[]) => void;
  isPassive?: boolean; // Pasif mod - yol çizilmez, sadece anlık konum
}

export interface MapCanvasHandle {
  getRealtimePoints: () => RoutePoint[];
  resetRealtimePoints: () => void;
  invalidateSize: () => void;
  fullReset: () => void; // Haritayı tamamen sıfırla
}

const MapCanvas = memo(forwardRef<MapCanvasHandle, MapCanvasProps>(function MapCanvasComponent({ lat, lon, routeHistory = [], onRealtimePointsUpdate, isPassive = false }: MapCanvasProps, ref) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const realtimePolylineRef = useRef<L.Polyline | null>(null);
  const historyMarkersRef = useRef<(L.Marker | L.CircleMarker)[]>([]);
  const prevLocationRef = useRef<[number, number] | null>(null);
  const realtimePointsRef = useRef<[number, number][]>([]);

  // Expose realtime points getter via ref
  useEffect(() => {
    if (ref && 'current' in ref) {
      ref.current = {
        getRealtimePoints: () => {
          return realtimePointsRef.current.map(([lat, lon]) => ({
            lat,
            lon,
            timestamp: new Date().toISOString(),
          }));
        },
        resetRealtimePoints: () => {
          realtimePointsRef.current = [];
          prevLocationRef.current = null;
          if (realtimePolylineRef.current && mapRef.current) {
            mapRef.current.removeLayer(realtimePolylineRef.current);
            realtimePolylineRef.current = null;
          }
          console.log('[MapCanvas] Realtime points reset');
        },
        invalidateSize: () => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
          }
        },
        fullReset: () => {
          console.log('[MapCanvas] Full reset triggered');
          // Tüm noktaları temizle
          realtimePointsRef.current = [];
          prevLocationRef.current = null;
          
          // Polyline'ı kaldır
          if (realtimePolylineRef.current && mapRef.current) {
            mapRef.current.removeLayer(realtimePolylineRef.current);
            realtimePolylineRef.current = null;
          }
          
          // Haritayı başlangıç konumuna döndür (Türkiye merkezi)
          if (mapRef.current) {
            mapRef.current.setView([39.9334, 32.8597], 6);
          }
          
          // Marker'ı gizle veya başlangıç konumuna al
          if (markerRef.current && mapRef.current) {
            markerRef.current.setLatLng([39.9334, 32.8597]);
          }
          
          console.log('[MapCanvas] Full reset completed');
        }
      };
    }
  }, [ref]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Map henüz oluşturulmadıysa oluştur
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([lat, lon], 13);

      // CartoDB Dark tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        maxZoom: 20,
        subdomains: 'abcd',
      }).addTo(mapRef.current);

      // Mevcut konumun marker'ı (kırmızı)
      markerRef.current = L.marker([lat, lon], {
        icon: L.icon({
          iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjEwIiByPSI5IiBmaWxsPSIjZWY0NDQ0Ii8+PHBhdGggZD0iTTAgMGgzMnYzMkgweiIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16],
        }),
      }).addTo(mapRef.current);

      // Map oluşturulduktan sonra invalidateSize çağır (display:none durumunda tiles yüklenmesi için)
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
          console.log('[MapCanvas] Initial invalidateSize called');
        }
      }, 100);
    } else {
      // Marker'ı yeni konuma taşı (sadece pasif modda değilse - aktif kiralama sürüyorsa)
      if (markerRef.current) {
        if (!isPassive || (!routeHistory || routeHistory.length === 0)) {
          markerRef.current.setLatLng([lat, lon]);
          if (!mapRef.current.hasLayer(markerRef.current)) {
            markerRef.current.addTo(mapRef.current);
          }
        }
      }
      // Map view'ı güncelle
      mapRef.current.setView([lat, lon], 18);

      // Gerçek zamanlı çizgi: önceki konumdan yeni konuma çizgi çek 
      // (sadece aktif modda VE route history yokken - route history varsa onunla çiz)
      if (!isPassive && prevLocationRef.current && (!routeHistory || routeHistory.length === 0)) {
        // Yeni segment ekle
        realtimePointsRef.current.push([lat, lon]);
        
        // Polyline güncelle veya oluştur
        if (realtimePolylineRef.current) {
          // Mevcut polyline'a yeni point ekle
          realtimePolylineRef.current.setLatLngs(realtimePointsRef.current);
        } else {
          // Yeni polyline oluştur
          realtimePolylineRef.current = L.polyline([prevLocationRef.current, [lat, lon]], {
            color: '#ef4444',
            weight: 3,
            opacity: 0.8,
            smoothFactor: 1.0,
          }).addTo(mapRef.current);
          realtimePointsRef.current = [prevLocationRef.current, [lat, lon]];
        }
        
        // Callback çağır - realtime noktaları parent'a gönder
        if (onRealtimePointsUpdate) {
          const routePoints: RoutePoint[] = realtimePointsRef.current.map(([lat, lon]) => ({
            lat,
            lon,
            timestamp: new Date().toISOString(),
          }));
          console.log(`[MapCanvas] onRealtimePointsUpdate: ${routePoints.length} points`);
          onRealtimePointsUpdate(routePoints);
        }
      }
      
      // Şu anki konumu önceki konum olarak kaydet (sadece aktif modda)
      if (!isPassive) {
        prevLocationRef.current = [lat, lon];
      }
    }

    // Route history çiz
    if (routeHistory && routeHistory.length > 1 && mapRef.current) {
      console.log(`[MapCanvas] Drawing routeHistory: ${routeHistory.length} points`, routeHistory);
      
      // Realtime marker'ı gizle (route history varken sarı end marker yeterli)
      if (markerRef.current && mapRef.current.hasLayer(markerRef.current)) {
        mapRef.current.removeLayer(markerRef.current);
      }
      
      // Realtime polyline'ı kaldır (route history ile çakışmasın)
      if (realtimePolylineRef.current) {
        mapRef.current.removeLayer(realtimePolylineRef.current);
        realtimePolylineRef.current = null;
      }
      
      // Eski polyline'ı kaldır
      if (polylineRef.current) {
        mapRef.current.removeLayer(polylineRef.current);
      }

      // Eski history marker'larını kaldır
      historyMarkersRef.current.forEach(marker => {
        if (mapRef.current) mapRef.current.removeLayer(marker);
      });
      historyMarkersRef.current = [];

      // Yeni polyline çiz (route history)
      const routeCoordinates = routeHistory.map(point => [point.lat, point.lon] as [number, number]);
      polylineRef.current = L.polyline(routeCoordinates, {
        color: '#ef4444', // Kırmızı ve belirgin
        weight: 4,
        opacity: 0.9,
        smoothFactor: 1.0,
      }).addTo(mapRef.current);

      // İlk ve son noktaya marker koy
      if (routeHistory.length > 0) {
        const firstPoint = routeHistory[0];
        const lastPoint = routeHistory[routeHistory.length - 1];

        // Başlangıç noktası (yeşil)
        const startMarker = L.circleMarker([firstPoint.lat, firstPoint.lon], {
          radius: 6,
          fillColor: '#22c55e',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        }).addTo(mapRef.current);
        historyMarkersRef.current.push(startMarker);

        // Son nokta (sarı)
        if (lastPoint !== firstPoint) {
          const endMarker = L.circleMarker([lastPoint.lat, lastPoint.lon], {
            radius: 6,
            fillColor: '#eab308',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
          }).addTo(mapRef.current);
          historyMarkersRef.current.push(endMarker);
        }
      }
    }
  }, [lat, lon, routeHistory]);

  // Cleanup: component unmount olduğunda map'i destroy et
  useEffect(() => {
    return () => {
      console.log('[MapCanvas] Cleanup - destroying map');
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      realtimePointsRef.current = [];
      prevLocationRef.current = null;
      realtimePolylineRef.current = null;
      historyMarkersRef.current = [];
      markerRef.current = null;
    };
  }, []);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '6px',
        overflow: 'hidden',
      }}
    />
  );
}));

export default MapCanvas;
