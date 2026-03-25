"use client";

import { useEffect, useState } from "react";
import Badge, { statusToBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { reservationsApi } from "@/lib/api";
import type { Reservation } from "@/lib/types";

type Tab = "ALL" | "ACTIVE" | "PAST";

const MOCK: Reservation[] = [
  { id: "1", spaceId: "A-01", spaceName: "A-01", zoneName: "Zone A — Central", start: "Mar 24, 10:00", end: "Mar 24, 11:00", fee: "€2.40", status: "CONFIRMED", evCharging: false },
  { id: "2", spaceId: "B-02", spaceName: "B-02", zoneName: "Zone B — Station", start: "Mar 25, 14:30", end: "Mar 25, 15:30", fee: "€3.60", status: "PENDING", evCharging: true },
  { id: "3", spaceId: "A-03", spaceName: "A-03", zoneName: "Zone A — Central", start: "Mar 23, 09:00", end: "Mar 23, 11:00", fee: "€2.80", status: "CANCELLED", evCharging: false },
  { id: "4", spaceId: "B-07", spaceName: "B-07", zoneName: "Zone B — Station", start: "Mar 20, 16:30", end: "Mar 20, 17:30", fee: "€3.60", status: "CONFIRMED", evCharging: false },
];

const tabs: Tab[] = ["ALL", "ACTIVE", "PAST"];

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
              {["Space ID", "Zone", "Start — End", "Fee", "Status", "Actions"].map((h) => (
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
                <td className="px-4 py-3 font-medium text-[#1D1D1F]">{r.spaceName}</td>
                <td className="px-4 py-3 text-[#86868B]">{r.zoneName}</td>
                <td className="px-4 py-3 text-[#86868B]">{r.start} — {r.end}</td>
                <td className="px-4 py-3 text-[#1D1D1F]">{r.fee}</td>
                <td className="px-4 py-3">
                  <Badge label={r.status} variant={statusToBadge(r.status)} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {(r.status === "CONFIRMED" || r.status === "ACTIVE") && (
                      <>
                        <Button
                          variant="destructive"
                          className="h-8 px-3 text-xs"
                          disabled={cancelling === r.id}
                          onClick={() => handleCancel(r.id)}
                        >
                          {cancelling === r.id ? "..." : "Cancel"}
                        </Button>
                        {r.evCharging && (
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
                <td colSpan={6} className="px-4 py-8 text-center text-[#86868B] text-sm">
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
