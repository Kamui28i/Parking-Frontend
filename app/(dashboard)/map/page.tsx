"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import Badge, { statusToBadge } from "@/components/ui/Badge";
import { zonesApi, reservationsApi } from "@/lib/api";
import SpaceScheduleModal from "@/components/SpaceScheduleModal";
import type { Zone, Space } from "@/lib/types";

const LeafletMap = dynamic(() => import("@/components/map/LeafletMap"), { ssr: false });

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return new Date(aStart) < new Date(bEnd) && new Date(aEnd) > new Date(bStart);
}

const MOCK_ZONES: Zone[] = [
  {
    id: "zone-a", name: "Westenhellweg", address: "Westenhellweg, 44137 Dortmund",
    totalCapacity: 6, availableCount: 5,
    latitude: 51.5136, longitude: 7.4653,
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
    id: "zone-b", name: "Hauptbahnhof", address: "Königswall 15, 44137 Dortmund",
    totalCapacity: 5, availableCount: 1,
    latitude: 51.5178, longitude: 7.4590,
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
    id: "zone-c", name: "Westfalenhallen", address: "Rheinlanddamm 200, 44139 Dortmund",
    totalCapacity: 8, availableCount: 6,
    latitude: 51.5056, longitude: 7.4617,
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
    id: "zone-d", name: "Phoenixsee", address: "Phoenix-Seepromenade, 44263 Dortmund",
    totalCapacity: 4, availableCount: 3,
    latitude: 51.4833, longitude: 7.5167,
    boundary: "[[51.4840,7.5153],[51.4840,7.5181],[51.4826,7.5181],[51.4826,7.5153]]",
    spaces: [
      { id: "s20", name: "PHX-1", type: "REGULAR", state: "FREE", zoneId: "zone-d" },
      { id: "s21", name: "PHX-2", type: "REGULAR", state: "OCCUPIED", zoneId: "zone-d" },
      { id: "s22", name: "PHX-3", type: "EV", state: "FREE", zoneId: "zone-d" },
      { id: "s23", name: "PHX-4", type: "EV", state: "FREE", zoneId: "zone-d" },
    ],
  },
];

function nowPlusHours(h: number) {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setHours(d.getHours() + h);
  return d.toISOString().slice(0, 16);
}

export default function MapPage() {
  const [zones, setZones] = useState<Zone[]>(MOCK_ZONES);
  const [selectedZoneId, setSelectedZoneId] = useState<string>(MOCK_ZONES[0].id);

  // Time filter
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");
  const [availableSpaceIds, setAvailableSpaceIds] = useState<Set<string> | null>(null);
  const [filterLoading, setFilterLoading] = useState(false);

  // Schedule modal
  const [scheduleSpace, setScheduleSpace] = useState<{ space: Space; zone: Zone } | null>(null);

  useEffect(() => {
    zonesApi.list().then(async (fetchedZones) => {
      const withSpaces = await Promise.all(
        fetchedZones.map(async (z) => ({
          ...z,
          spaces: await zonesApi.spaces(z.id).catch(() => []),
        }))
      );
      setZones(withSpaces);
      if (withSpaces.length > 0) setSelectedZoneId(withSpaces[0].id);
    }).catch(() => { /* use mock */ });
  }, []);

  const handleSearch = async () => {
    if (!filterStart || !filterEnd || filterEnd <= filterStart) return;
    setFilterLoading(true);
    try {
      // Try backend first (all zones at once)
      const spaces = await zonesApi.allAvailableSpaces(filterStart, filterEnd);
      setAvailableSpaceIds(new Set(spaces.map((s) => s.id)));
    } catch {
      // Fallback: client-side check across all zones
      try {
        const allSpaces = zones.flatMap((z) => z.spaces ?? []);
        const results = await Promise.all(
          allSpaces.map(async (space) => {
            const reservations = await reservationsApi.forSpace(space.id).catch(() => []);
            const blocked = reservations.some(
              (r) =>
                r.status !== "CANCELLED" &&
                overlaps(filterStart, filterEnd, r.startTime, r.endTime)
            );
            return blocked ? null : space.id;
          })
        );
        setAvailableSpaceIds(new Set(results.filter(Boolean) as string[]));
      } catch {
        setAvailableSpaceIds(null);
      }
    } finally {
      setFilterLoading(false);
    }
  };

  const clearFilter = () => {
    setFilterStart("");
    setFilterEnd("");
    setAvailableSpaceIds(null);
  };

  const selectedZone = zones.find((z) => z.id === selectedZoneId);

  const spaceAvailability = (space: Space): "available" | "unavailable" | "unknown" => {
    if (!availableSpaceIds) return "unknown";
    return availableSpaceIds.has(space.id) ? "available" : "unavailable";
  };

  return (
    <div className="flex h-screen">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div className="w-80 shrink-0 flex flex-col bg-white border-r border-[#E5E5EA]">

        {/* Time filter */}
        <div className="px-4 pt-4 pb-3 border-b border-[#E5E5EA]">
          <p className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider mb-2">
            Find Available Spaces
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#86868B]">From</label>
              <input
                type="datetime-local"
                value={filterStart}
                onChange={(e) => { setFilterStart(e.target.value); setAvailableSpaceIds(null); }}
                className="h-8 px-2 rounded-lg border border-[#D2D2D7] text-xs bg-[#FAFAFA] focus:outline-none focus:border-[#1D1D1F]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#86868B]">To</label>
              <input
                type="datetime-local"
                value={filterEnd}
                onChange={(e) => { setFilterEnd(e.target.value); setAvailableSpaceIds(null); }}
                className="h-8 px-2 rounded-lg border border-[#D2D2D7] text-xs bg-[#FAFAFA] focus:outline-none focus:border-[#1D1D1F]"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                disabled={!filterStart || !filterEnd || filterLoading}
                className="flex-1 h-8 flex items-center justify-center gap-1.5 rounded-lg bg-[#1D1D1F] text-white text-xs font-medium hover:bg-[#3a3a3c] disabled:opacity-40 transition-colors"
              >
                <Search size={12} />
                {filterLoading ? "Checking…" : "Check Availability"}
              </button>
              {availableSpaceIds && (
                <button onClick={clearFilter} className="h-8 px-3 rounded-lg border border-[#E5E5EA] text-xs text-[#86868B] hover:bg-[#F5F5F7]">
                  Clear
                </button>
              )}
            </div>
          </div>
          {availableSpaceIds && (
            <p className="text-[11px] text-[#34C759] mt-2 font-medium">
              {availableSpaceIds.size} space{availableSpaceIds.size !== 1 ? "s" : ""} available in selected window
            </p>
          )}
        </div>

        {/* Zone selector */}
        <div className="px-4 py-3 border-b border-[#E5E5EA]">
          <p className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider mb-2">Zones</p>
          <div className="flex flex-col gap-1">
            {zones.map((zone) => {
              const isSelected = selectedZoneId === zone.id;
              const freeCount = availableSpaceIds
                ? (zone.spaces ?? []).filter((s) => availableSpaceIds.has(s.id)).length
                : zone.availableCount;
              return (
                <button
                  key={zone.id}
                  onClick={() => { setSelectedZoneId(zone.id); setAvailableSpaceIds(null); }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors ${
                    isSelected ? "bg-[#1D1D1F] text-white" : "hover:bg-[#F5F5F7] text-[#1D1D1F]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${freeCount > 0 ? "bg-[#34C759]" : "bg-[#FF3B30]"}`} />
                    <div>
                      <p className="text-sm font-medium leading-tight">{zone.name}</p>
                      <p className={`text-xs leading-tight mt-0.5 ${isSelected ? "text-white/60" : "text-[#86868B]"}`}>
                        {zone.address}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold shrink-0 ml-2 ${
                    isSelected
                      ? freeCount > 0 ? "text-[#4ade80]" : "text-red-400"
                      : freeCount > 0 ? "text-[#34C759]" : "text-[#FF3B30]"
                  }`}>
                    {freeCount > 0 ? `${freeCount} free` : "Full"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Spaces list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {selectedZone && (
            <>
              <p className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider mb-3">
                {selectedZone.name} — Spaces
                {availableSpaceIds && (
                  <span className="ml-2 normal-case text-[#34C759]">
                    ({availableSpaceIds.size} available)
                  </span>
                )}
              </p>
              <div className="flex flex-col gap-2">
                {(selectedZone.spaces ?? []).map((space) => {
                  const avail = spaceAvailability(space);
                  return (
                    <button
                      key={space.id}
                      onClick={() => setScheduleSpace({ space, zone: selectedZone })}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-colors w-full ${
                        avail === "available"
                          ? "border-[#34C759]/40 bg-[#F0FAF3] hover:bg-[#E6F7EC]"
                          : avail === "unavailable"
                          ? "border-[#FF3B30]/20 bg-[#FFF5F5] hover:bg-[#FFE8E8]"
                          : "border-[#E5E5EA] bg-white hover:bg-[#FAFAFA]"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#1D1D1F]">{space.name}</p>
                        <p className="text-xs text-[#86868B] mt-0.5">{space.type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {avail === "available" && (
                          <span className="text-[10px] font-semibold text-[#34C759]">FREE</span>
                        )}
                        {avail === "unavailable" && (
                          <span className="text-[10px] font-semibold text-[#FF3B30]">BOOKED</span>
                        )}
                        {avail === "unknown" && (
                          <Badge label={space.state} variant={statusToBadge(space.state)} />
                        )}
                        <span className="text-[11px] text-[#86868B] underline">View →</span>
                      </div>
                    </button>
                  );
                })}
                {(selectedZone.spaces ?? []).length === 0 && (
                  <p className="text-sm text-[#86868B] text-center py-6">No spaces in this zone.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Map area ─────────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden isolate">
        <LeafletMap
          zones={zones}
          selectedZoneId={selectedZoneId}
          onSelectZone={setSelectedZoneId}
        />
        <div className="absolute bottom-5 left-5 z-[1000] flex items-center gap-4 bg-white rounded-xl px-4 py-2 shadow-sm border border-[#E5E5EA]">
          {[
            { color: "bg-[#34C759]", label: "Free" },
            { color: "bg-[#FF9F0A]", label: "Reserved" },
            { color: "bg-[#FF3B30]", label: "Occupied" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
              <span className="text-xs text-[#1D1D1F]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule modal */}
      {scheduleSpace && (
        <SpaceScheduleModal
          space={scheduleSpace.space}
          zone={scheduleSpace.zone}
          initialStart={filterStart || undefined}
          initialEnd={filterEnd || undefined}
          onClose={() => setScheduleSpace(null)}
          onReserved={() => setScheduleSpace(null)}
        />
      )}
    </div>
  );
}
