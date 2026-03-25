"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Zone } from "@/lib/types";

const PinIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface MapData {
  latitude: number | null;
  longitude: number | null;
  boundary: string | null;
}

interface Props {
  zone: Zone;
  onSave: (data: MapData) => Promise<void>;
  onClose: () => void;
}

function parseBoundary(raw: string | null | undefined): [number, number][] {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export default function AdminMapEditor({ zone, onSave, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pinMarkerRef = useRef<L.Marker | null>(null);
  const polygonRef = useRef<L.Polygon | null>(null);
  const vertexMarkersRef = useRef<L.CircleMarker[]>([]);

  const [mode, setMode] = useState<"pin" | "boundary">("pin");
  const [pinLatLng, setPinLatLng] = useState<[number, number] | null>(
    zone.latitude != null && zone.longitude != null
      ? [zone.latitude as number, zone.longitude as number]
      : null
  );
  const [boundaryPoints, setBoundaryPoints] = useState<[number, number][]>(
    parseBoundary(zone.boundary)
  );
  const [saving, setSaving] = useState(false);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: [number, number] =
      pinLatLng ?? [51.5136, 7.4653];
    const map = L.map(containerRef.current).setView(center, 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync pin marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (pinMarkerRef.current) {
      pinMarkerRef.current.remove();
      pinMarkerRef.current = null;
    }
    if (pinLatLng) {
      const marker = L.marker(pinLatLng, { icon: PinIcon, draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        setPinLatLng([lat, lng]);
      });
      pinMarkerRef.current = marker;
    }
  }, [pinLatLng]);

  // Sync boundary polygon + vertex dots
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (polygonRef.current) {
      polygonRef.current.remove();
      polygonRef.current = null;
    }
    vertexMarkersRef.current.forEach((m) => m.remove());
    vertexMarkersRef.current = [];

    if (boundaryPoints.length >= 3) {
      polygonRef.current = L.polygon(boundaryPoints, {
        color: "#1D1D1F",
        fillOpacity: 0.1,
        weight: 2,
        dashArray: "6 4",
      }).addTo(map);
    }

    boundaryPoints.forEach((pt) => {
      const cm = L.circleMarker(pt, {
        radius: 5,
        color: "#1D1D1F",
        fillColor: "#ffffff",
        fillOpacity: 1,
        weight: 2,
      }).addTo(map);
      vertexMarkersRef.current.push(cm);
    });
  }, [boundaryPoints]);

  // Map click handler — depends on current mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (mode === "pin") {
        setPinLatLng([lat, lng]);
      } else {
        setBoundaryPoints((prev) => [...prev, [lat, lng]]);
      }
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [mode]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        latitude: pinLatLng ? pinLatLng[0] : null,
        longitude: pinLatLng ? pinLatLng[1] : null,
        boundary: boundaryPoints.length >= 3 ? JSON.stringify(boundaryPoints) : null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ width: 820, height: 620 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5EA] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[#1D1D1F]">
              Map Editor — {zone.name}
            </h2>
            <p className="text-xs text-[#86868B] mt-0.5">
              Place a pin at the zone centre, or draw a polygon boundary
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F] text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[#E5E5EA] bg-[#FAFAFA] shrink-0">
          <button
            onClick={() => setMode("pin")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === "pin"
                ? "bg-[#1D1D1F] text-white"
                : "bg-white border border-[#E5E5EA] text-[#1D1D1F] hover:bg-[#F5F5F7]"
            }`}
          >
            📍 Set Pin
          </button>
          <button
            onClick={() => setMode("boundary")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === "boundary"
                ? "bg-[#1D1D1F] text-white"
                : "bg-white border border-[#E5E5EA] text-[#1D1D1F] hover:bg-[#F5F5F7]"
            }`}
          >
            ✏️ Draw Boundary
          </button>
          <span className="text-xs text-[#86868B] ml-1">
            {mode === "pin"
              ? "Click the map to place the zone pin"
              : `Click to add vertices (${boundaryPoints.length} added${boundaryPoints.length >= 3 ? ", polygon closed" : ""})`}
          </span>
          <div className="ml-auto flex gap-3">
            {pinLatLng && (
              <button
                onClick={() => setPinLatLng(null)}
                className="text-xs text-[#FF3B30] hover:underline"
              >
                Clear pin
              </button>
            )}
            {boundaryPoints.length > 0 && (
              <button
                onClick={() => setBoundaryPoints([])}
                className="text-xs text-[#FF3B30] hover:underline"
              >
                Clear boundary
              </button>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
          {/* Mode cursor hint */}
          <div className="absolute top-3 right-3 z-[1000] bg-white/90 text-xs text-[#1D1D1F] px-3 py-1.5 rounded-lg shadow pointer-events-none">
            {mode === "pin" ? "Click to place pin" : "Click to add points"}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#E5E5EA] shrink-0">
          <p className="text-xs text-[#86868B]">
            {pinLatLng
              ? `📍 ${pinLatLng[0].toFixed(5)}, ${pinLatLng[1].toFixed(5)}`
              : "No pin set"}
            {boundaryPoints.length >= 3 &&
              ` · Boundary: ${boundaryPoints.length} vertices`}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-xl border border-[#E5E5EA] text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm rounded-xl bg-[#1D1D1F] text-white hover:bg-[#3a3a3c] disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
