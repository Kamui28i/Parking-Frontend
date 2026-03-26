"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { SpaceType } from "@/lib/types";

const PinIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface NewSpaceEntry {
  name: string;
  type: SpaceType;
}

export interface NewZoneData {
  name: string;
  address: string;
  spaces: NewSpaceEntry[];
  latitude: number | null;
  longitude: number | null;
  boundary: string | null;
}

interface Props {
  onSave: (data: NewZoneData) => Promise<void>;
  onClose: () => void;
}

export default function AddZoneModal({ onSave, onClose }: Props) {
  // Form
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  // Spaces
  const [spaces, setSpaces] = useState<NewSpaceEntry[]>([]);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceType, setNewSpaceType] = useState<SpaceType>("REGULAR");

  // Map
  const [mode, setMode] = useState<"pin" | "boundary">("pin");
  const [pinLatLng, setPinLatLng] = useState<[number, number] | null>(null);
  const [boundaryPoints, setBoundaryPoints] = useState<[number, number][]>([]);

  // UI
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Leaflet refs
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pinMarkerRef = useRef<L.Marker | null>(null);
  const polygonRef = useRef<L.Polygon | null>(null);
  const vertexMarkersRef = useRef<L.CircleMarker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current).setView([51.5136, 7.4653], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (pinMarkerRef.current) { pinMarkerRef.current.remove(); pinMarkerRef.current = null; }
    if (pinLatLng) {
      const marker = L.marker(pinLatLng, { icon: PinIcon, draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        setPinLatLng([lat, lng]);
      });
      pinMarkerRef.current = marker;
    }
  }, [pinLatLng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (polygonRef.current) { polygonRef.current.remove(); polygonRef.current = null; }
    vertexMarkersRef.current.forEach((m) => m.remove());
    vertexMarkersRef.current = [];
    if (boundaryPoints.length >= 3) {
      polygonRef.current = L.polygon(boundaryPoints, {
        color: "#1D1D1F", fillOpacity: 0.1, weight: 2, dashArray: "6 4",
      }).addTo(map);
    }
    boundaryPoints.forEach((pt) => {
      const cm = L.circleMarker(pt, {
        radius: 5, color: "#1D1D1F", fillColor: "#fff", fillOpacity: 1, weight: 2,
      }).addTo(map);
      vertexMarkersRef.current.push(cm);
    });
  }, [boundaryPoints]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const onClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (mode === "pin") setPinLatLng([lat, lng]);
      else setBoundaryPoints((prev) => [...prev, [lat, lng]]);
    };
    map.on("click", onClick);
    return () => { map.off("click", onClick); };
  }, [mode]);

  const addSpace = () => {
    const n = newSpaceName.trim();
    if (!n) return;
    setSpaces((prev) => [...prev, { name: n, type: newSpaceType }]);
    setNewSpaceName("");
  };

  const removeSpace = (i: number) =>
    setSpaces((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!name.trim() || !address.trim()) {
      setError("Name and address are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        address: address.trim(),
        spaces,
        latitude: pinLatLng ? pinLatLng[0] : null,
        longitude: pinLatLng ? pinLatLng[1] : null,
        boundary: boundaryPoints.length >= 3 ? JSON.stringify(boundaryPoints) : null,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create zone.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ width: 980, height: 660 }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5EA] shrink-0">
          <h2 className="text-base font-semibold text-[#1D1D1F]">Add Zone</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F] text-lg">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">

          {/* Left panel */}
          <div className="w-80 shrink-0 flex flex-col border-r border-[#E5E5EA] overflow-y-auto">

            {/* Zone details */}
            <div className="px-5 py-4 flex flex-col gap-3 border-b border-[#F5F5F7]">
              <p className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">Zone Details</p>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#1D1D1F]">Zone Name</label>
                <input
                  type="text"
                  placeholder="e.g. Westpark"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-[#D2D2D7] text-sm focus:outline-none focus:border-[#1D1D1F] bg-[#FAFAFA]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#1D1D1F]">Address</label>
                <input
                  type="text"
                  placeholder="e.g. Märkische Str. 10, 44141 Dortmund"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-[#D2D2D7] text-sm focus:outline-none focus:border-[#1D1D1F] bg-[#FAFAFA]"
                />
              </div>
            </div>

            {/* Parking spaces */}
            <div className="px-5 py-4 flex flex-col gap-3 border-b border-[#F5F5F7]">
              <p className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">Parking Spaces</p>

              {/* Add space row */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Space name"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSpace()}
                  className="flex-1 h-8 px-3 rounded-lg border border-[#D2D2D7] text-xs focus:outline-none focus:border-[#1D1D1F] bg-[#FAFAFA]"
                />
                <select
                  value={newSpaceType}
                  onChange={(e) => setNewSpaceType(e.target.value as SpaceType)}
                  className="h-8 px-2 rounded-lg border border-[#D2D2D7] text-xs focus:outline-none focus:border-[#1D1D1F] bg-[#FAFAFA]"
                >
                  <option value="REGULAR">Regular</option>
                  <option value="EV">EV</option>
                </select>
                <button
                  onClick={addSpace}
                  className="h-8 px-3 rounded-lg bg-[#1D1D1F] text-white text-xs font-medium hover:bg-[#3a3a3c] transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Space list */}
              {spaces.length === 0 ? (
                <p className="text-xs text-[#86868B]">No spaces added yet.</p>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                  {spaces.map((s, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-[#FAFAFA] rounded-lg border border-[#E5E5EA]">
                      <span className="text-xs font-medium text-[#1D1D1F]">{s.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${s.type === "EV" ? "bg-blue-50 text-blue-600" : "bg-[#F5F5F7] text-[#86868B]"}`}>
                          {s.type}
                        </span>
                        <button onClick={() => removeSpace(i)} className="text-[#FF3B30] hover:text-red-700 text-xs leading-none">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Map mode */}
            <div className="px-5 py-4 flex flex-col gap-3">
              <p className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">Map Placement</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setMode("pin")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${mode === "pin" ? "bg-[#1D1D1F] text-white" : "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#EBEBEB]"}`}
                >
                  <span>📍</span><span>Set Pin</span>
                </button>
                <button
                  onClick={() => setMode("boundary")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left ${mode === "boundary" ? "bg-[#1D1D1F] text-white" : "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#EBEBEB]"}`}
                >
                  <span>✏️</span><span>Draw Boundary</span>
                </button>
              </div>
              <div className="text-xs text-[#86868B] space-y-1">
                {pinLatLng ? (
                  <p className="flex items-center justify-between">
                    <span>📍 Pin set</span>
                    <button onClick={() => setPinLatLng(null)} className="text-[#FF3B30] hover:underline">Clear</button>
                  </p>
                ) : <p>No pin set</p>}
                {boundaryPoints.length > 0 ? (
                  <p className="flex items-center justify-between">
                    <span>✏️ {boundaryPoints.length} pts{boundaryPoints.length >= 3 ? " ✓" : ""}</span>
                    <button onClick={() => setBoundaryPoints([])} className="text-[#FF3B30] hover:underline">Clear</button>
                  </p>
                ) : <p>No boundary drawn</p>}
              </div>
            </div>

            {error && <p className="px-5 pb-4 text-xs text-[#FF3B30]">{error}</p>}
          </div>

          {/* Map */}
          <div className="flex-1 relative">
            <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
            <div className="absolute top-3 right-3 z-[1000] bg-white/90 text-xs text-[#1D1D1F] px-3 py-1.5 rounded-lg shadow pointer-events-none">
              {mode === "pin" ? "Click to place pin" : "Click to add boundary points"}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[#E5E5EA] shrink-0">
          <p className="text-xs text-[#86868B]">
            {spaces.length > 0 ? `${spaces.length} space${spaces.length > 1 ? "s" : ""} · ` : ""}
            {pinLatLng ? "Pin set · " : ""}
            {boundaryPoints.length >= 3 ? "Boundary drawn" : ""}
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-[#E5E5EA] text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm rounded-xl bg-[#1D1D1F] text-white hover:bg-[#3a3a3c] disabled:opacity-50 transition-colors">
              {saving ? "Creating…" : "Create Zone"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
