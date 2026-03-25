"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Badge, { statusToBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { zonesApi } from "@/lib/api";
import type { Zone } from "@/lib/types";

// Mock data used until backend is connected
const MOCK_ZONES: Zone[] = [
  {
    id: "zone-a",
    name: "Zone A — Central",
    address: "123 Main Street",
    capacity: 10,
    available: 7,
    occupancy: 30,
    spaces: [
      { id: "A-01", name: "A-01", type: "REGULAR", status: "FREE", zoneId: "zone-a" },
      { id: "A-02", name: "A-02", type: "EV", status: "RESERVED", zoneId: "zone-a" },
    ],
  },
  {
    id: "zone-b",
    name: "Zone B — Station",
    address: "45 Station Ave",
    capacity: 15,
    available: 4,
    occupancy: 73,
    spaces: [
      { id: "B-01", name: "B-01", type: "REGULAR", status: "OCCUPIED", zoneId: "zone-b" },
    ],
  },
  {
    id: "zone-c",
    name: "Zone C — Airport",
    address: "Airport Rd",
    capacity: 30,
    available: 0,
    occupancy: 100,
    spaces: [],
  },
];

export default function MapPage() {
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>(MOCK_ZONES);
  const [selectedZone, setSelectedZone] = useState<string | null>("zone-a");

  useEffect(() => {
    zonesApi.list().then(setZones).catch(() => {/* use mock */});
  }, []);

  const zoneColors: Record<number, { bg: string; border: string; label: string }> = {
    0: { bg: "bg-[#F0FAF3]", border: "border-[#34C759]", label: "Zone A" },
    1: { bg: "bg-[#FFFBEB]", border: "border-[#F59E0B]", label: "Zone B" },
    2: { bg: "bg-[#FFF0EF]", border: "border-[#EF4444]", label: "Zone C" },
  };

  return (
    <div className="flex h-screen">
      {/* Left panel */}
      <div
        className="w-72 shrink-0 flex flex-col bg-white border-r border-[#E5E5EA] overflow-y-auto"
      >
        <div className="px-5 py-5 border-b border-[#E5E5EA]">
          <h1 className="text-lg font-semibold text-[#1D1D1F]">Find Parking</h1>
          <p className="text-sm text-[#86868B] mt-0.5">Duration (minutes)</p>
          <input
            type="number"
            placeholder="60"
            className="mt-2 w-full h-9 px-3 rounded-lg border border-[#D2D2D7] text-sm focus:outline-none"
          />
        </div>

        <div className="flex flex-col divide-y divide-[#E5E5EA]">
          {zones.map((zone) => {
            const isSelected = selectedZone === zone.id;
            const statusVariant = zone.available > 0 ? "green" : "red";
            return (
              <div
                key={zone.id}
                className={`px-5 py-4 cursor-pointer transition-colors ${isSelected ? "bg-[#F5F5F7]" : "hover:bg-[#F5F5F7]"}`}
                onClick={() => setSelectedZone(zone.id)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-medium text-[#1D1D1F]">{zone.name}</p>
                    <p className="text-xs text-[#86868B]">{zone.available} available · {zone.address}</p>
                  </div>
                  <Badge
                    label={zone.available > 0 ? `${zone.available} FREE` : "FULL"}
                    variant={statusVariant}
                  />
                </div>

                {isSelected && zone.spaces.length > 0 && (
                  <div className="flex flex-col gap-2 mt-3">
                    {zone.spaces.map((space) => (
                      <div
                        key={space.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E5E5EA]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#1D1D1F]">{space.name}</span>
                          <Badge label={space.type} variant="blue" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge label={space.status} variant={statusToBadge(space.status)} />
                          {space.status === "FREE" && (
                            <Button
                              variant="primary"
                              className="h-8 px-4 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/reservations/${space.id}?zoneId=${zone.id}&spaceName=${space.name}&zoneName=${encodeURIComponent(zone.name)}`);
                              }}
                            >
                              Reserve
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 relative bg-[#F0F0F0] overflow-hidden">
        {/* Zone visual markers */}
        <div className="absolute inset-0 p-8">
          {zones.map((zone, i) => {
            const positions = [
              { top: "10%", left: "15%" },
              { top: "8%", right: "15%" },
              { bottom: "20%", right: "20%" },
            ];
            const colors = zoneColors[i] ?? zoneColors[0];
            const pos = positions[i] ?? { top: "50%", left: "50%" };
            return (
              <div
                key={zone.id}
                className={`absolute w-36 h-28 rounded-2xl border-2 ${colors.bg} ${colors.border} flex flex-col items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-105 shadow-sm`}
                style={pos}
                onClick={() => setSelectedZone(zone.id)}
              >
                <span className="text-xs font-semibold text-[#1D1D1F]">{colors.label}</span>
                <div className="flex gap-1.5">
                  {zone.spaces.slice(0, 4).map((s) => (
                    <div
                      key={s.id}
                      className={`w-3 h-3 rounded-full ${
                        s.status === "FREE"
                          ? "bg-[#34C759]"
                          : s.status === "RESERVED"
                          ? "bg-[#FF9F0A]"
                          : "bg-[#FF3B30]"
                      }`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="absolute top-4 left-4 flex items-center gap-4 bg-white rounded-xl px-4 py-2 shadow-sm border border-[#E5E5EA]">
          {[
            { color: "bg-[#34C759]", label: "Free" },
            { color: "bg-[#FF9F0A]", label: "Reserved" },
            { color: "bg-[#FF3B30]", label: "Occupied" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
              <span className="text-xs text-[#1D1D1F]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
