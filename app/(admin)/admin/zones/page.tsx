"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Edit2, Plus } from "lucide-react";
import Badge, { statusToBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { zonesApi } from "@/lib/api";
import type { Zone } from "@/lib/types";

const MOCK_ZONES: Zone[] = [
  {
    id: "zone-a",
    name: "Zone A — Central",
    address: "123 Main Street",
    totalCapacity: 20,
    availableCount: 12,
    spaces: [
      { id: "A-01", type: "REGULAR", state: "FREE", zoneId: "zone-a" },
      { id: "A-10", type: "EV", state: "RESERVED", zoneId: "zone-a" },
    ],
  },
  {
    id: "zone-b",
    name: "Zone B — Station",
    address: "45 Station Ave",
    totalCapacity: 15,
    availableCount: 4,
    spaces: [],
  },
  {
    id: "zone-c",
    name: "Zone C — Airport",
    address: "Airport Rd",
    totalCapacity: 30,
    availableCount: 0,
    spaces: [],
  },
];

export default function AdminZonesPage() {
  const [zones, setZones] = useState<Zone[]>(MOCK_ZONES);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["zone-a"]));

  useEffect(() => {
    zonesApi.list().then(async (fetchedZones) => {
      const withSpaces = await Promise.all(
        fetchedZones.map(async (z) => ({
          ...z,
          spaces: await zonesApi.spaces(z.id).catch(() => []),
        }))
      );
      setZones(withSpaces);
    }).catch(() => {/* use mock */});
  }, []);

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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[#1D1D1F]">Zone Management</h1>
        <Button>
          <Plus size={16} />
          Add Zone
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[2fr_2fr_1fr_1fr_2fr_auto] gap-4 px-4 py-3 border-b border-[#E5E5EA]">
          {["Zone Name", "Address", "Capacity", "Available", "Occupancy", ""].map((h) => (
            <div key={h} className="text-xs font-medium text-[#86868B] uppercase tracking-wide">
              {h}
            </div>
          ))}
        </div>

        {zones.map((zone) => {
          const isOpen = expanded.has(zone.id);
          const pct = occupancyPct(zone);
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
                <button
                  className="p-1 rounded-lg hover:bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Edit2 size={14} />
                </button>
              </div>

              {/* Expanded spaces */}
              {isOpen && (
                <div className="bg-[#FAFAFA] px-4 pb-4">
                  {/* Spaces sub-header */}
                  <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-4 py-2 mb-1">
                    {["Space ID", "Type", "Status", ""].map((h) => (
                      <div key={h} className="text-xs font-medium text-[#86868B] uppercase tracking-wide">
                        {h}
                      </div>
                    ))}
                  </div>

                  {(zone.spaces ?? []).map((space) => (
                    <div
                      key={space.id}
                      className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-4 py-2.5 bg-white rounded-xl border border-[#E5E5EA] mb-2 items-center"
                    >
                      <span className="text-sm font-medium text-[#1D1D1F]">{space.id}</span>
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
    </div>
  );
}
