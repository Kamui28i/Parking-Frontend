"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Edit2, Map, Plus } from "lucide-react";
import Badge, { statusToBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { zonesApi } from "@/lib/api";
import type { Zone } from "@/lib/types";
import type { MapData } from "@/components/map/AdminMapEditor";
import type { NewZoneData } from "@/components/map/AddZoneModal";


const AdminMapEditor = dynamic(() => import("@/components/map/AdminMapEditor"), { ssr: false });
const AddZoneModal = dynamic(() => import("@/components/map/AddZoneModal"), { ssr: false });

const MOCK_ZONES: Zone[] = [
  {
    id: "zone-a",
    name: "Westenhellweg",
    address: "Westenhellweg, 44137 Dortmund",
    totalCapacity: 6,
    availableCount: 5,
    latitude: 51.5136,
    longitude: 7.4653,
    boundary: "[[51.5143,7.4640],[51.5143,7.4666],[51.5129,7.4666],[51.5129,7.4640]]",
    spaces: [
      { id: "s1", name: "WH-1", type: "REGULAR", state: "FREE", zoneId: "zone-a" },
      { id: "s2", name: "WH-2", type: "REGULAR", state: "FREE", zoneId: "zone-a" },
      { id: "s3", name: "WH-3", type: "REGULAR", state: "RESERVED", zoneId: "zone-a" },
      { id: "s4", name: "WH-4", type: "REGULAR", state: "FREE", zoneId: "zone-a" },
      { id: "s5", name: "WH-5", type: "EV", state: "FREE", zoneId: "zone-a" },
      { id: "s6", name: "WH-6", type: "EV", state: "FREE", zoneId: "zone-a" },
    ],
  },
  {
    id: "zone-b",
    name: "Hauptbahnhof",
    address: "Königswall 15, 44137 Dortmund",
    totalCapacity: 5,
    availableCount: 1,
    latitude: 51.5178,
    longitude: 7.4590,
    boundary: "[[51.5185,7.4577],[51.5185,7.4603],[51.5171,7.4603],[51.5171,7.4577]]",
    spaces: [
      { id: "s7", name: "HBF-1", type: "REGULAR", state: "OCCUPIED", zoneId: "zone-b" },
      { id: "s8", name: "HBF-2", type: "REGULAR", state: "OCCUPIED", zoneId: "zone-b" },
      { id: "s9", name: "HBF-3", type: "REGULAR", state: "OCCUPIED", zoneId: "zone-b" },
      { id: "s10", name: "HBF-4", type: "EV", state: "FREE", zoneId: "zone-b" },
      { id: "s11", name: "HBF-5", type: "EV", state: "RESERVED", zoneId: "zone-b" },
    ],
  },
  {
    id: "zone-c",
    name: "Westfalenhallen",
    address: "Rheinlanddamm 200, 44139 Dortmund",
    totalCapacity: 8,
    availableCount: 6,
    latitude: 51.5056,
    longitude: 7.4617,
    boundary: "[[51.5063,7.4603],[51.5063,7.4631],[51.5049,7.4631],[51.5049,7.4603]]",
    spaces: [
      { id: "s12", name: "WFH-1", type: "REGULAR", state: "FREE", zoneId: "zone-c" },
      { id: "s13", name: "WFH-2", type: "REGULAR", state: "FREE", zoneId: "zone-c" },
      { id: "s14", name: "WFH-3", type: "REGULAR", state: "FREE", zoneId: "zone-c" },
      { id: "s15", name: "WFH-4", type: "REGULAR", state: "RESERVED", zoneId: "zone-c" },
      { id: "s16", name: "WFH-5", type: "REGULAR", state: "OCCUPIED", zoneId: "zone-c" },
      { id: "s17", name: "WFH-6", type: "EV", state: "FREE", zoneId: "zone-c" },
      { id: "s18", name: "WFH-7", type: "EV", state: "FREE", zoneId: "zone-c" },
      { id: "s19", name: "WFH-8", type: "EV", state: "FREE", zoneId: "zone-c" },
    ],
  },
  {
    id: "zone-d",
    name: "Phoenixsee",
    address: "Phoenix-Seepromenade, 44263 Dortmund",
    totalCapacity: 4,
    availableCount: 3,
    latitude: 51.4833,
    longitude: 7.5167,
    boundary: "[[51.4840,7.5153],[51.4840,7.5181],[51.4826,7.5181],[51.4826,7.5153]]",
    spaces: [
      { id: "s20", name: "PHX-1", type: "REGULAR", state: "FREE", zoneId: "zone-d" },
      { id: "s21", name: "PHX-2", type: "REGULAR", state: "OCCUPIED", zoneId: "zone-d" },
      { id: "s22", name: "PHX-3", type: "EV", state: "FREE", zoneId: "zone-d" },
      { id: "s23", name: "PHX-4", type: "EV", state: "FREE", zoneId: "zone-d" },
    ],
  },
];

export default function AdminZonesPage() {
  const [zones, setZones] = useState<Zone[]>(MOCK_ZONES);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["zone-a"]));
  const [mapEditorZone, setMapEditorZone] = useState<Zone | null>(null);
  const [showAddZone, setShowAddZone] = useState(false);

  const refreshZones = async () => {
    const fetchedZones = await zonesApi.list();
    const withSpaces = await Promise.all(
      fetchedZones.map(async (z) => ({
        ...z,
        spaces: await zonesApi.spaces(z.id).catch(() => []),
      }))
    );
    setZones(withSpaces);
  };

  useEffect(() => {
    refreshZones().catch(() => { /* use mock */ });
  }, []);

  const handleCreateZone = async (data: NewZoneData) => {
    const created = await zonesApi.create({
      name: data.name,
      address: data.address,
      totalCapacity: data.totalCapacity,
    });
    await Promise.all([
      data.spaces.length > 0
        ? Promise.all(data.spaces.map((s) => zonesApi.addSpace(created.id, { name: s.name, type: s.type })))
        : Promise.resolve(),
      data.latitude != null || data.boundary != null
        ? zonesApi.updateMapData(created.id, {
            latitude: data.latitude,
            longitude: data.longitude,
            boundary: data.boundary,
          })
        : Promise.resolve(),
    ]);
    await refreshZones();
    setShowAddZone(false);
  };

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const occupancyPct = (zone: Zone) =>
    zone.totalCapacity > 0
      ? Math.round(((zone.totalCapacity - zone.availableCount) / zone.totalCapacity) * 100)
      : 0;

  const occupancyColor = (pct: number) =>
    pct >= 90 ? "bg-[#FF3B30]" : pct >= 60 ? "bg-[#FF9F0A]" : "bg-[#34C759]";

  const handleSaveMapData = async (zone: Zone, data: MapData) => {
    await zonesApi.updateMapData(zone.id, data);
    const fetchedZones = await zonesApi.list();
    const withSpaces = await Promise.all(
      fetchedZones.map(async (z) => ({
        ...z,
        spaces: await zonesApi.spaces(z.id).catch(() => []),
      }))
    );
    setZones(withSpaces);
    setMapEditorZone(null);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[#1D1D1F]">Zone Management</h1>
        <Button onClick={() => setShowAddZone(true)}>
          <Plus size={16} />
          Add Zone
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[2fr_2fr_1fr_1fr_2fr_auto] gap-4 px-4 py-3 border-b border-[#E5E5EA]">
          {["Zone Name", "Address", "Capacity", "Available", "Occupancy", ""].map((h) => (
            <div
              key={h}
              className="text-xs font-medium text-[#86868B] uppercase tracking-wide"
            >
              {h}
            </div>
          ))}
        </div>

        {zones.map((zone) => {
          const isOpen = expanded.has(zone.id);
          const pct = occupancyPct(zone);
          const hasPinOrBoundary = zone.latitude != null || zone.boundary;
          return (
            <div key={zone.id} className="border-b border-[#F5F5F7] last:border-0">
              {/* Zone row */}
              <div
                className="grid grid-cols-[2fr_2fr_1fr_1fr_2fr_auto] gap-4 px-4 py-3 items-center cursor-pointer hover:bg-[#FAFAFA] transition-colors"
                onClick={() => toggle(zone.id)}
              >
                <div className="flex items-center gap-2">
                  {isOpen ? (
                    <ChevronDown size={16} className="text-[#86868B] shrink-0" />
                  ) : (
                    <ChevronRight size={16} className="text-[#86868B] shrink-0" />
                  )}
                  <span className="text-sm font-medium text-[#1D1D1F]">{zone.name}</span>
                  {hasPinOrBoundary && (
                    <span className="text-[10px] bg-[#F0FAF3] text-[#34C759] border border-[#34C759]/30 rounded px-1.5 py-0.5 font-medium">
                      📍 mapped
                    </span>
                  )}
                </div>
                <span className="text-sm text-[#86868B]">{zone.address}</span>
                <span className="text-sm text-[#1D1D1F]">{zone.totalCapacity}</span>
                <span className="text-sm text-[#1D1D1F]">{zone.availableCount}</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-[#F5F5F7] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${occupancyColor(pct)}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#86868B] w-8 text-right">{pct}%</span>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    title="Edit on map"
                    className="p-1.5 rounded-lg hover:bg-[#F0FAF3] text-[#86868B] hover:text-[#34C759] transition-colors"
                    onClick={() => setMapEditorZone(zone)}
                  >
                    <Map size={14} />
                  </button>
                  <button className="p-1 rounded-lg hover:bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F] transition-colors">
                    <Edit2 size={14} />
                  </button>
                </div>
              </div>

              {/* Expanded spaces */}
              {isOpen && (
                <div className="bg-[#FAFAFA] px-4 pb-4">
                  <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-4 py-2 mb-1">
                    {["Space ID", "Type", "Status", ""].map((h) => (
                      <div
                        key={h}
                        className="text-xs font-medium text-[#86868B] uppercase tracking-wide"
                      >
                        {h}
                      </div>
                    ))}
                  </div>

                  {(zone.spaces ?? []).map((space) => (
                    <div
                      key={space.id}
                      className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-4 py-2.5 bg-white rounded-xl border border-[#E5E5EA] mb-2 items-center"
                    >
                      <span className="text-sm font-medium text-[#1D1D1F]">{space.name}</span>
                      <Badge label={space.type} variant="blue" />
                      <Badge label={space.state} variant={statusToBadge(space.state)} />
                      <button className="p-1 rounded-lg hover:bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F] transition-colors">
                        <Edit2 size={14} />
                      </button>
                    </div>
                  ))}

                  <button className="flex items-center gap-1.5 text-sm text-[#86868B] hover:text-[#1D1D1F] mt-2 ml-4 transition-colors">
                    <Plus size={14} />
                    Add Space
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Zone modal */}
      {showAddZone && (
        <AddZoneModal
          onSave={handleCreateZone}
          onClose={() => setShowAddZone(false)}
        />
      )}

      {/* Map editor modal */}
      {mapEditorZone && (
        <AdminMapEditor
          zone={mapEditorZone}
          onSave={(data) => handleSaveMapData(mapEditorZone, data)}
          onClose={() => setMapEditorZone(null)}
        />
      )}
    </div>
  );
}
