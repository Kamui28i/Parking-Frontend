"use client";

import dynamic from "next/dynamic";
import { use, Suspense, useState } from "react";
import { Search } from "lucide-react";
import Badge, { statusToBadge } from "@/components/ui/Badge";
import { zonesApi, reservationsApi } from "@/lib/api";
import SpaceScheduleModal from "@/components/SpaceScheduleModal";
import type { Zone, Space } from "@/lib/types";

const LeafletMap = dynamic(() => import("@/components/map/LeafletMap"), { ssr: false });

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return new Date(aStart) < new Date(bEnd) && new Date(aEnd) > new Date(bStart);
}

async function fetchZones(): Promise<Zone[]> {
  const zones = await zonesApi.list();
  return Promise.all(
    zones.map(async (z) => ({
      ...z,
      spaces: await zonesApi.spaces(z.id).catch(() => []),
    }))
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function MapSkeleton() {
  return (
    <div className="flex h-screen">
      <div className="w-80 shrink-0 flex flex-col bg-white border-r border-[#E5E5EA]">
        {/* Time filter placeholder */}
        <div className="px-4 pt-4 pb-3 border-b border-[#E5E5EA]">
          <div className="h-3 w-36 rounded bg-[#E5E5EA] animate-pulse mb-3" />
          <div className="flex flex-col gap-2">
            <div className="h-8 rounded-lg bg-[#F5F5F7] animate-pulse" />
            <div className="h-8 rounded-lg bg-[#F5F5F7] animate-pulse" />
            <div className="h-8 rounded-lg bg-[#E5E5EA] animate-pulse" />
          </div>
        </div>
        {/* Zone list placeholder */}
        <div className="px-4 py-3 border-b border-[#E5E5EA]">
          <div className="h-3 w-12 rounded bg-[#E5E5EA] animate-pulse mb-3" />
          <div className="flex flex-col gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-[#E5E5EA] animate-pulse shrink-0" />
                <div className="flex-1">
                  <div className="h-3.5 w-28 rounded bg-[#E5E5EA] animate-pulse mb-1" />
                  <div className="h-3 w-40 rounded bg-[#F5F5F7] animate-pulse" />
                </div>
                <div className="h-3 w-10 rounded bg-[#F5F5F7] animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        {/* Spaces placeholder */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="h-3 w-24 rounded bg-[#E5E5EA] animate-pulse mb-3" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-[#E5E5EA]">
                <div>
                  <div className="h-3.5 w-14 rounded bg-[#E5E5EA] animate-pulse mb-1" />
                  <div className="h-3 w-16 rounded bg-[#F5F5F7] animate-pulse" />
                </div>
                <div className="h-5 w-16 rounded-full bg-[#F5F5F7] animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Map placeholder */}
      <div className="flex-1 bg-[#E8EDF2] animate-pulse" />
    </div>
  );
}

// ── Main content (suspends until zones are loaded) ─────────────────────────────

function MapContent({ promise }: { promise: Promise<Zone[]> }) {
  const initialZones = use(promise);
  const [zones, setZones] = useState(initialZones);
  const [selectedZoneId, setSelectedZoneId] = useState(initialZones[0]?.id ?? "");

  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");
  const [availableSpaceIds, setAvailableSpaceIds] = useState<Set<string> | null>(null);
  const [filterLoading, setFilterLoading] = useState(false);

  const [scheduleSpace, setScheduleSpace] = useState<{ space: Space; zone: Zone } | null>(null);

  const handleSearch = async () => {
    if (!filterStart || !filterEnd || filterEnd <= filterStart) return;
    setFilterLoading(true);
    try {
      const spaces = await zonesApi.allAvailableSpaces(filterStart, filterEnd);
      setAvailableSpaceIds(new Set(spaces.map((s) => s.id)));
    } catch {
      try {
        const allSpaces = zones.flatMap((z) => z.spaces ?? []);
        const results = await Promise.all(
          allSpaces.map(async (space) => {
            const reservations = await reservationsApi.forSpace(space.id).catch(() => []);
            const blocked = reservations.some(
              (r) => r.status !== "CANCELLED" && overlaps(filterStart, filterEnd, r.startTime, r.endTime)
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
      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
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
                    ({(selectedZone.spaces ?? []).filter(s => availableSpaceIds.has(s.id)).length} available)
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
                        {avail === "available" && <span className="text-[10px] font-semibold text-[#34C759]">FREE</span>}
                        {avail === "unavailable" && <span className="text-[10px] font-semibold text-[#FF3B30]">BOOKED</span>}
                        {avail === "unknown" && <Badge label={space.state} variant={statusToBadge(space.state)} />}
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

      {/* ── Map area ──────────────────────────────────────────────────────── */}
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MapPage() {
  const [promise] = useState(() => fetchZones());

  return (
    <Suspense fallback={<MapSkeleton />}>
      <MapContent promise={promise} />
    </Suspense>
  );
}
