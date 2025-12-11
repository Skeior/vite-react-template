import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface PassiveDevice {
  deviceId: string;
  lat: number;
  lon: number;
  rentalActive?: boolean | string;
}

interface ClientMapProps {
  devices: PassiveDevice[];
  onSelectDevice?: (deviceId: string) => void;
  selectedDeviceId?: string | null;
}

const DEFAULT_CENTER: [number, number] = [39.9334, 32.8597]; // Ankara center fallback
const bikeSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17h2l3-7h3l2 4h-3"/><path d="m16 6-2 4"/><path d="M5 10h6"/><path d="M8 7l-2 3"/><circle cx="16" cy="6" r="1"/></svg>';

export default function ClientMap({ devices, onSelectDevice, selectedDeviceId }: ClientMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        zoomControl: false,
        scrollWheelZoom: false,
      }).setView(DEFAULT_CENTER, 6);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap © CARTO",
        maxZoom: 18,
        subdomains: "abcd",
      }).addTo(mapRef.current);

      // Ensure map renders properly
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 200);
    }

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (devices.length === 0) {
      return;
    }

    const bounds = L.latLngBounds([]);

    devices.forEach((d) => {
      if (d.lat == null || d.lon == null) return;
      const isActive = d.rentalActive === true || d.rentalActive === "true";
      const isSelected = selectedDeviceId === d.deviceId;
      const bikeIcon = `
        <div class="marker-shell ${isActive ? "is-active" : "is-passive"} ${isSelected ? "is-selected" : ""}">
          <div class="marker-pin"></div>
          <div class="marker-icon">${isActive ? "" : bikeSvg}</div>
        </div>
      `;
      const marker = L.marker([d.lat, d.lon], {
        icon: L.divIcon({
          className: "client-map-marker",
          html: bikeIcon,
          iconSize: [32, 42],
          iconAnchor: [16, 42],
        }),
        title: d.deviceId,
      }).addTo(mapRef.current!);
      if (onSelectDevice) {
        marker.on("click", () => onSelectDevice(d.deviceId));
      }
      markersRef.current.push(marker);
      bounds.extend([d.lat, d.lon]);
    });

    if (bounds.isValid()) {
      mapRef.current!.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [devices]);

  useEffect(() => {
    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return <div className="client-map" ref={containerRef} />;
}
