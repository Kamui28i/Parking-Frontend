"use client";

import { useEffect, useState } from "react";
import Badge, { statusToBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { reservationsApi } from "@/lib/api";
import type { Reservation } from "@/lib/types";

type Tab = "ALL" | "ACTIVE" | "PAST";

const MOCK: Reservation[] = [
  { id: "1", spaceId: "LotA1", citizenId: "u1", startTime: "2025-03-24T10:00:00", endTime: "2025-03-24T11:00:00", durationMinutes: 60, estimatedFee: "2.40", withCharging: false, status: "CONFIRMED" },
  { id: "2", spaceId: "LotB3", citizenId: "u1", startTime: "2025-03-25T14:30:00", endTime: "2025-03-25T15:30:00", durationMinutes: 60, estimatedFee: "3.60", withCharging: true, status: "PENDING" },
  { id: "3", spaceId: "LotA2", citizenId: "u1", startTime: "2025-03-23T09:00:00", endTime: "2025-03-23T11:00:00", durationMinutes: 120, estimatedFee: "2.80", withCharging: false, status: "CANCELLED" },
];

const tabs: Tab[] = ["ALL", "ACTIVE", "PAST"];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>(MOCK);
  const [tab, setTab] = useState<Tab>("ALL");
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    reservationsApi.list().then(setReservations).catch(() => {/* use mock */});
  }, []);

  const filtered = reservations.filter((r) => {
    if (tab === "ACTIVE") return r.status === "CONFIRMED" || r.status === "PENDING";
    if (tab === "PAST") return r.status === "CANCELLED";
    return true;
  });

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      await reservationsApi.cancel(id);
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "CANCELLED" } : r))
      );
    } catch {/* ignore */} finally {
      setCancelling(null);
    }
  };

  const handleStartCharging = async (id: string) => {
    try {
      await reservationsApi.startCharging(id);
    } catch {/* ignore */}
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-[#1D1D1F] mb-6">My Reservations</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`
              px-4 py-2 rounded-xl text-sm font-medium transition-colors
              ${tab === t
                ? "bg-[#1D1D1F] text-white"
                : "text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
              }
            `}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E5EA]">
              {["Space ID", "Start — End", "Fee", "Status", "Actions"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-medium text-[#86868B] uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F5F7]">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-[#FAFAFA] transition-colors">
                <td className="px-4 py-3 font-medium text-[#1D1D1F]">{r.spaceId}</td>
                <td className="px-4 py-3 text-[#86868B]">{formatDateTime(r.startTime)} — {formatDateTime(r.endTime)}</td>
                <td className="px-4 py-3 text-[#1D1D1F]">€{r.estimatedFee}</td>
                <td className="px-4 py-3">
                  <Badge label={r.status} variant={statusToBadge(r.status)} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {(r.status === "CONFIRMED" || r.status === "PENDING") && (
                      <>
                        <Button
                          variant="destructive"
                          className="h-8 px-3 text-xs"
                          disabled={cancelling === r.id}
                          onClick={() => handleCancel(r.id)}
                        >
                          {cancelling === r.id ? "..." : "Cancel"}
                        </Button>
                        {r.withCharging && (
                          <Button
                            variant="secondary"
                            className="h-8 px-3 text-xs"
                            onClick={() => handleStartCharging(r.id)}
                          >
                            Start charging
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#86868B] text-sm">
                  No reservations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
