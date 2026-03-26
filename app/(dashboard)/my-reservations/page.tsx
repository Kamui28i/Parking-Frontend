"use client";

import { use, Suspense, useState } from "react";
import { Zap } from "lucide-react";
import Badge, { statusToBadge } from "@/components/ui/Badge";
import TableSkeleton from "@/components/ui/TableSkeleton";
import ScanPlateModal from "@/components/ScanPlateModal";
import { reservationsApi, chargingApi } from "@/lib/api";
import type { Reservation, ChargingSession } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";

type Tab = "ALL" | "ACTIVE" | "PAST";

const tabs: Tab[] = ["ALL", "ACTIVE", "PAST"];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const HEADERS = ["Parking Space", "Start — End", "Fee", "Status", "Actions"];

type PageData = { reservations: Reservation[]; sessions: ChargingSession[] };

function ReservationsList({ promise }: { promise: Promise<PageData> }) {
  const { reservations: initial, sessions: initialSessions } = use(promise);
  const [reservations, setReservations] = useState(initial);
  const [tab, setTab] = useState<Tab>("ALL");
  const [cancelling, setCancelling] = useState<string | null>(null);
  // reservationId -> active ChargingSession (seeded from API)
  const [activeSessions, setActiveSessions] = useState<Record<string, ChargingSession>>(() =>
    Object.fromEntries(
      initialSessions.filter(s => s.status === "ACTIVE").map(s => [s.reservationId, s])
    )
  );
  const [completedSessions, setCompletedSessions] = useState<Set<string>>(() =>
    new Set(initialSessions.filter(s => s.status === "COMPLETED").map(s => s.reservationId))
  );
  const [startingCharging, setStartingCharging] = useState<string | null>(null);
  const [stoppingCharging, setStoppingCharging] = useState<string | null>(null);
  const [scanningReservation, setScanningReservation] = useState<Reservation | null>(null);
  const toast = useToast();

  const filtered = reservations.filter((r) => {
    if (tab === "ACTIVE") return r.status === "CONFIRMED" || r.status === "PENDING";
    if (tab === "PAST") return r.status === "CANCELLED";
    return true;
  });

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      await reservationsApi.cancel(id);
      setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status: "CANCELLED" } : r)));
      toast("success", "Reservation cancelled.");
    } catch {
      toast("error", "Failed to cancel reservation.");
    } finally {
      setCancelling(null);
    }
  };

  const handleStartCharging = async (reservationId: string) => {
    setStartingCharging(reservationId);
    try {
      const session = await reservationsApi.startCharging(reservationId);
      setActiveSessions((prev) => ({ ...prev, [reservationId]: session }));
      toast("success", "Charging session started.");
    } catch {
      toast("error", "Failed to start charging.");
    } finally {
      setStartingCharging(null);
    }
  };

  const handleStopCharging = async (reservationId: string) => {
    const session = activeSessions[reservationId];
    if (!session) return;
    setStoppingCharging(reservationId);
    try {
      await chargingApi.stop(session.id);
      setActiveSessions((prev) => {
        const next = { ...prev };
        delete next[reservationId];
        return next;
      });
      setCompletedSessions((prev) => new Set([...prev, reservationId]));
      toast("success", "Charging session stopped.");
    } catch {
      toast("error", "Failed to stop charging.");
    } finally {
      setStoppingCharging(null);
    }
  };

  return (
    <>
      {scanningReservation && (
        <ScanPlateModal
          reservationId={scanningReservation.id}
          onClose={() => setScanningReservation(null)}
          onChargingStarted={(session) => {
            setActiveSessions((prev) => ({ ...prev, [session.reservationId]: session }));
            setScanningReservation(null);
          }}
        />
      )}
      <div className="flex gap-1 mb-6">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === t ? "bg-[#1D1D1F] text-white" : "text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
            }`}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

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
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-[#FAFAFA] transition-colors">
                <td className="px-4 py-3 font-medium text-[#1D1D1F]">
                  {r.spaceName ?? r.spaceId}
                  {r.zoneName && <span className="block text-xs font-normal text-[#86868B]">{r.zoneName}</span>}
                  {r.licensePlate && <span className="block text-xs font-mono text-[#AEAEB2]">{r.licensePlate}</span>}
                </td>
                <td className="px-4 py-3 text-[#86868B]">{formatDateTime(r.startTime)} — {formatDateTime(r.endTime)}</td>
                <td className="px-4 py-3 text-[#1D1D1F]">€{r.estimatedFee}</td>
                <td className="px-4 py-3">
                  <Badge label={r.status} variant={statusToBadge(r.status)} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {(r.status === "CONFIRMED" || r.status === "PENDING") && (
                      <>
                        <button
                          disabled={cancelling === r.id}
                          onClick={() => handleCancel(r.id)}
                          className="text-xs text-[#FF3B30] hover:text-[#d63028] disabled:opacity-40 transition-colors font-medium"
                        >
                          {cancelling === r.id ? "…" : "Cancel"}
                        </button>

                        {r.withCharging && (
                          activeSessions[r.id] ? (
                            <>
                              <span className="text-[#D2D2D7]">·</span>
                              <span className="flex items-center gap-1 text-xs font-medium text-[#34C759]">
                                <Zap size={11} className="fill-[#34C759]" />
                                Charging
                              </span>
                              <button
                                disabled={stoppingCharging === r.id}
                                onClick={() => handleStopCharging(r.id)}
                                className="text-xs text-[#86868B] hover:text-[#1D1D1F] disabled:opacity-40 transition-colors font-medium underline underline-offset-2"
                              >
                                {stoppingCharging === r.id ? "…" : "Stop"}
                              </button>
                            </>
                          ) : completedSessions.has(r.id) ? (
                            <>
                              <span className="text-[#D2D2D7]">·</span>
                              <span className="flex items-center gap-1 text-xs text-[#86868B]">
                                <Zap size={11} />
                                Charged
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-[#D2D2D7]">·</span>
                              {r.licensePlate && (
                                <button
                                  onClick={() => setScanningReservation(r)}
                                  className="flex items-center gap-1 text-xs text-[#3B82F6] hover:text-[#2563eb] transition-colors font-medium"
                                >
                                  <Zap size={11} />
                                  Scan Plate
                                </button>
                              )}
                              {r.licensePlate && <span className="text-[#D2D2D7]">·</span>}
                              <button
                                disabled={startingCharging === r.id}
                                onClick={() => handleStartCharging(r.id)}
                                className="flex items-center gap-1 text-xs text-[#3B82F6] hover:text-[#2563eb] disabled:opacity-40 transition-colors font-medium"
                              >
                                <Zap size={11} />
                                {startingCharging === r.id ? "…" : "Start charging"}
                              </button>
                            </>
                          )
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
    </>
  );
}

function ReservationsSkeleton() {
  return (
    <>
      <div className="flex gap-1 mb-6">
        {tabs.map((t) => (
          <div key={t} className="h-9 w-16 rounded-xl bg-[#F5F5F7] animate-pulse" />
        ))}
      </div>
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
          <TableSkeleton rows={4} cols={5} />
        </table>
      </div>
    </>
  );
}

export default function MyReservationsPage() {
  const [promise] = useState(() =>
    Promise.all([reservationsApi.list(), chargingApi.list()]).then(
      ([reservations, sessions]) => ({ reservations, sessions })
    )
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-[#1D1D1F] mb-6">My Reservations</h1>
      <Suspense fallback={<ReservationsSkeleton />}>
        <ReservationsList promise={promise} />
      </Suspense>
    </div>
  );
}
