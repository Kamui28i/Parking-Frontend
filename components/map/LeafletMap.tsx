"use client";

import { useEffect, useRef } from "react";
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

interface Props {
  zones: Zone[];
  selectedZoneId: string;
  onSelectZone: (id: string) => void;
}

export default function LeafletMap({ zones, selectedZoneId, onSelectZone }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const polygonsRef = useRef<Map<string, L.Polygon>>(new Map());

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView([51.5136, 7.4653], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync zone layers whenever zones or selection changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous layers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();
    polygonsRef.current.forEach((p) => p.remove());
    polygonsRef.current.clear();

    zones.forEach((zone) => {
      const selected = zone.id === selectedZoneId;

      if (zone.boundary) {
        try {
          const coords: [number, number][] = JSON.parse(zone.boundary);
          const polygon = L.polygon(coords, {
            color: selected ? "#1D1D1F" : "#34C759",
            fillColor: selected ? "#1D1D1F" : "#34C759",
            fillOpacity: selected ? 0.18 : 0.08,
            weight: selected ? 2.5 : 1.5,
          }).addTo(map);
          polygon.bindTooltip(zone.name, { sticky: true });
          polygon.on("click", () => onSelectZone(zone.id));
          polygonsRef.current.set(zone.id, polygon);
        } catch {
          // ignore malformed JSON
        }
      }

      if (zone.latitude != null && zone.longitude != null) {
        const marker = L.marker([zone.latitude, zone.longitude], { icon: PinIcon }).addTo(map);
        marker.bindPopup(
          `<div style="min-width:130px">
            <b>${zone.name}</b><br/>
            <small style="color:#86868B">${zone.address}</small><br/>
            <span style="color:${zone.availableCount > 0 ? "#34C759" : "#FF3B30"};font-weight:600">
              ${zone.availableCount}/${zone.totalCapacity} free
            </span>
          </div>`
        );
        marker.on("click", () => onSelectZone(zone.id));
        markersRef.current.set(zone.id, marker);
        if (selected) marker.openPopup();
      }
    });

    // Pan to selected zone
    const sel = zones.find((z) => z.id === selectedZoneId);
    if (sel?.latitude != null && sel?.longitude != null) {
      map.panTo([sel.latitude, sel.longitude], { animate: true, duration: 0.5 });
    }
  }, [zones, selectedZoneId, onSelectZone]);

  return <div ref={containerRef} style={{ height: "100%", width: "100%" }} />;
}
