"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Calendar } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Toggle from "@/components/ui/Toggle";
import { reservationsApi } from "@/lib/api";

const PRICE_PER_HOUR = 2.40;
const EV_SURCHARGE = 1.20;

function calcPrice(start: string, end: string, ev: boolean): number {
  if (!start || !end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.max(0, ms / 3_600_000);
  return +(hours * (PRICE_PER_HOUR + (ev ? EV_SURCHARGE : 0))).toFixed(2);
}

export default function ReservationPage(props: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = use(props.params);
  const searchParams = useSearchParams();
  const router = useRouter();

  const zoneName = searchParams.get("zoneName") ?? "Zone A — Central";
  const spaceName = searchParams.get("spaceName") ?? spaceId;

  const now = new Date();
  const padded = (n: number) => String(n).padStart(2, "0");
  const defaultStart = `${now.getFullYear()}-${padded(now.getMonth() + 1)}-${padded(now.getDate())}T${padded(now.getHours())}:00`;
  const defaultEnd = `${now.getFullYear()}-${padded(now.getMonth() + 1)}-${padded(now.getDate())}T${padded(now.getHours() + 1)}:00`;

  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [evCharging, setEvCharging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = calcPrice(start, end, evCharging);

  const handleConfirm = async () => {
    setError("");
    setLoading(true);
    try {
      await reservationsApi.create({ spaceId, start, end, evCharging });
      router.push("/my-reservations");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reservation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      {/* Back link */}
      <Link
        href="/map"
        className="inline-flex items-center gap-1 text-sm text-[#86868B] hover:text-[#1D1D1F] mb-6 transition-colors"
      >
        <ChevronLeft size={16} />
        Back to Map
      </Link>

      <h1 className="text-2xl font-semibold text-[#1D1D1F] mb-6">Reserve Parking Space</h1>

      {/* Summary card */}
      <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-[#1D1D1F]">{zoneName}</p>
            <p className="text-sm text-[#86868B] mt-0.5">Space {spaceName} · #{spaceId}</p>
          </div>
          <Badge label="FREE" variant="green" />
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-[#E5E5EA] p-5 flex flex-col gap-5">
        {/* Date range */}
        <div className="flex gap-4">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-sm text-[#1D1D1F]">Start</label>
            <div className="relative">
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full h-11 px-3 pr-10 rounded-xl border border-[#D2D2D7] bg-white text-sm text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F]"
              />
              <Calendar size={16} className="absolute right-3 top-3.5 text-[#AEAEB2] pointer-events-none" />
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-sm text-[#1D1D1F]">End</label>
            <div className="relative">
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full h-11 px-3 pr-10 rounded-xl border border-[#D2D2D7] bg-white text-sm text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F]"
              />
              <Calendar size={16} className="absolute right-3 top-3.5 text-[#AEAEB2] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* EV toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#1D1D1F]">Add EV Charging</p>
            <p className="text-xs text-[#86868B] mt-0.5">Charge your vehicle while parked</p>
          </div>
          <Toggle checked={evCharging} onChange={setEvCharging} />
        </div>

        {/* Price breakdown */}
        <div className="rounded-xl bg-[#F5F5F7] p-4 flex flex-col gap-2">
          <p className="text-sm font-medium text-[#1D1D1F]">Price Estimate</p>
          <div className="flex justify-between text-sm">
            <span className="text-[#86868B]">Base</span>
            <span className="text-[#1D1D1F]">€{PRICE_PER_HOUR.toFixed(2)}/hour</span>
          </div>
          {evCharging && (
            <div className="flex justify-between text-sm">
              <span className="text-[#86868B]">EV Charging</span>
              <span className="text-[#1D1D1F]">€{EV_SURCHARGE.toFixed(2)}/hour</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-semibold border-t border-[#E5E5EA] pt-2 mt-1">
            <span className="text-[#1D1D1F]">Estimated Total</span>
            <span className="text-[#1D1D1F]">€{total.toFixed(2)}</span>
          </div>
        </div>

        {error && <p className="text-sm text-[#FF3B30]">{error}</p>}

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-2">
          <Button fullWidth onClick={handleConfirm} disabled={loading}>
            {loading ? "Confirming..." : "Confirm Reservation"}
          </Button>
          <Button variant="ghost" fullWidth onClick={() => router.push("/map")}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
