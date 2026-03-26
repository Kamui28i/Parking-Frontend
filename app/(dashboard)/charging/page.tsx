"use client";

import { use, Suspense, useState } from "react";
import { Zap } from "lucide-react";
import Badge, { statusToBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { chargingApi } from "@/lib/api";
import type { ChargingSession } from "@/lib/types";

const HEADERS = ["Parking Space", "Started", "Energy", "Status", "Actions"];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function ChargingSessionsList({ promise }: { promise: Promise<ChargingSession[]> }) {
  const initial = use(promise);
  const [sessions, setSessions] = useState(initial);
  const [stopping, setStopping] = useState<string | null>(null);

  const handleStop = async (id: string) => {
    setStopping(id);
    try {
      const updated = await chargingApi.stop(id);
      setSessions((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch {/* ignore */} finally {
      setStopping(null);
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E5EA] px-6 py-16 text-center">
        <Zap size={32} className="mx-auto mb-3 text-[#D2D2D7]" />
        <p className="text-sm font-medium text-[#1D1D1F]">No charging sessions yet</p>
        <p className="text-xs text-[#86868B] mt-1">
          Start a session from a reservation with EV charging enabled.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E5E5EA]">
            {HEADERS.map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#86868B] uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F5F5F7]">
          {sessions.map((s) => (
            <tr key={s.id} className="hover:bg-[#FAFAFA] transition-colors">
              <td className="px-4 py-3 font-medium text-[#1D1D1F]">
                {s.spaceName ?? s.spaceId}
                {s.zoneName && <span className="block text-xs font-normal text-[#86868B]">{s.zoneName}</span>}
              </td>
              <td className="px-4 py-3 text-[#86868B]">{formatDateTime(s.startedAt)}</td>
              <td className="px-4 py-3 text-[#1D1D1F]">
                {s.energyKwh != null ? `${s.energyKwh} kWh` : "—"}
              </td>
              <td className="px-4 py-3">
                <Badge
                  label={s.status.charAt(0) + s.status.slice(1).toLowerCase()}
                  variant={statusToBadge(s.status)}
                />
              </td>
              <td className="px-4 py-3">
                {s.status === "ACTIVE" && (
                  <Button
                    variant="destructive"
                    className="h-8 px-3 text-xs"
                    disabled={stopping === s.id}
                    onClick={() => handleStop(s.id)}
                  >
                    {stopping === s.id ? "..." : "Stop"}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChargingSessionsSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E5E5EA]">
            {HEADERS.map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#86868B] uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <TableSkeleton rows={3} cols={5} />
      </table>
    </div>
  );
}

export default function ChargingSessionsPage() {
  const [promise] = useState(() => chargingApi.list());

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-[#1D1D1F] mb-6">Charging Sessions</h1>
      <Suspense fallback={<ChargingSessionsSkeleton />}>
        <ChargingSessionsList promise={promise} />
      </Suspense>
    </div>
  );
}
