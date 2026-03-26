"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Zap, CheckCircle2 } from "lucide-react";
import { reservationsApi } from "@/lib/api";
import type { Reservation, Space, Zone } from "@/lib/types";
import Toggle from "@/components/ui/Toggle";

interface Props {
  space: Space;
  zone: Zone;
  initialStart?: string;
  initialEnd?: string;
  onClose: () => void;
  onReserved: () => void;
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && aEnd > bStart;
}

/** Format a Date as a local datetime-local string (YYYY-MM-DDTHH:MM). */
function toLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function nowPlusHours(h: number) {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setHours(d.getHours() + h);
  return toLocal(d);
}

const SLOT_START = 0;  // midnight
const SLOT_END = 24;   // midnight

type SlotStatus = "past" | "free" | "booked" | "selected";

interface TimeSlot {
  start: string;
  end: string;
  label: string;
  status: SlotStatus;
  reservation?: Reservation;
}

function buildSlots(
  dayOffset: number,
  reservations: Reservation[],
  selStart: string,
  selEnd: string,
): TimeSlot[] {
  const now = new Date();
  now.setSeconds(0, 0);
  const nowStr = toLocal(now);

  const base = new Date(now);
  base.setDate(base.getDate() + dayOffset);
  base.setHours(0, 0, 0, 0);

  return Array.from({ length: SLOT_END - SLOT_START }, (_, i) => {
    const h = SLOT_START + i;
    const slotStart = new Date(base);
    slotStart.setHours(h, 0, 0, 0);
    const slotEnd = new Date(base);
    slotEnd.setHours(h + 1, 0, 0, 0);

    const startStr = toLocal(slotStart);
    const endStr = toLocal(slotEnd);

    const isPast = endStr <= nowStr;
    const booking = reservations.find(r =>
      overlaps(startStr, endStr, toLocal(new Date(r.startTime)), toLocal(new Date(r.endTime)))
    );
    const isSelected =
      !isPast && !booking && selStart && selEnd
        ? overlaps(startStr, endStr, selStart, selEnd)
        : false;

    let status: SlotStatus;
    if (isPast) status = "past";
    else if (booking) status = "booked";
    else if (isSelected) status = "selected";
    else status = "free";

    const label = slotStart.toLocaleTimeString("en-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return { start: startStr, end: endStr, label, status, reservation: booking };
  });
}

function getDayMeta(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return {
    weekday: d.toLocaleDateString("en-DE", { weekday: "short" }),
    date: d.getDate(),
    month: d.toLocaleDateString("en-DE", { month: "short" }),
  };
}

export default function SpaceScheduleModal({
  space, zone, initialStart, initialEnd, onClose, onReserved,
}: Props) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [calDay, setCalDay] = useState(0);

  const [start, setStart] = useState(initialStart ?? nowPlusHours(1));
  const [end, setEnd] = useState(initialEnd ?? nowPlusHours(2));
  const [evCharging, setEvCharging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    reservationsApi.forSpace(space.id)
      .then((data) => {
        const upcoming = data
          .filter(r => r.status !== "CANCELLED" && new Date(r.endTime) > new Date())
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
        setReservations(upcoming);
      })
      .finally(() => setLoading(false));
  }, [space.id]);

  const slots = useMemo(
    () => buildSlots(calDay, reservations, start, end),
    [calDay, reservations, start, end],
  );

  const conflict = reservations.some(r =>
    overlaps(start, end, toLocal(new Date(r.startTime)), toLocal(new Date(r.endTime)))
  );

  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.status !== "free") return;
    const nextBooking = reservations
      .filter(r => toLocal(new Date(r.startTime)) >= slot.end)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
    const defaultEndMs = new Date(slot.start).getTime() + 60 * 60 * 1000;
    const cappedEndMs = nextBooking
      ? Math.min(defaultEndMs, new Date(nextBooking.startTime).getTime())
      : defaultEndMs;
    setStart(slot.start);
    setEnd(toLocal(new Date(cappedEndMs)));
    setError(null);
  };

  const handleReserve = async () => {
    if (!start || !end || end <= start) {
      setError("End time must be after start time.");
      return;
    }
    if (conflict) {
      setError("This slot overlaps with an existing reservation.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await reservationsApi.create({
        spaceId: space.id,
        startTime: start,
        endTime: end,
        withCharging: evCharging,
      });
      setSuccess(true);
      onReserved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Reservation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const days = Array.from({ length: 7 }, (_, i) => getDayMeta(i));

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden w-[560px] max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5EA] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[#1D1D1F]">
              {space.name}
              <span className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded ${
                space.type === "EV" ? "bg-blue-50 text-blue-600" : "bg-[#F5F5F7] text-[#86868B]"
              }`}>
                {space.type}
              </span>
            </h2>
            <p className="text-xs text-[#86868B] mt-0.5">{zone.name} · {zone.address}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F5F7] text-[#86868B]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">

          {/* Calendar */}
          <div className="px-5 pt-4 pb-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
                Availability
              </p>
              {/* Legend */}
              <div className="flex items-center gap-3">
                {[
                  { cls: "bg-[#34C759]/20 border border-[#34C759]/40", label: "Free" },
                  { cls: "bg-[#FF3B30]/15 border border-[#FF3B30]/25", label: "Booked" },
                  { cls: "bg-[#1D1D1F]", label: "Selected" },
                  { cls: "bg-[#F0F0F0] border border-[#E5E5EA]", label: "Past" },
                ].map(({ cls, label }) => (
                  <div key={label} className="flex items-center gap-1">
                    <div className={`w-2.5 h-2.5 rounded-sm ${cls}`} />
                    <span className="text-[10px] text-[#86868B]">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Day tabs */}
            <div className="flex gap-1 mb-3">
              {days.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setCalDay(i)}
                  className={`flex flex-col items-center flex-1 py-2 rounded-xl transition-colors ${
                    calDay === i
                      ? "bg-[#1D1D1F] text-white"
                      : "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E8E8ED]"
                  }`}
                >
                  <span className={`text-[9px] font-medium uppercase tracking-wide ${
                    calDay === i ? "text-white/60" : "text-[#AEAEB2]"
                  }`}>
                    {d.weekday}
                  </span>
                  <span className="text-sm font-bold leading-tight">{d.date}</span>
                  <span className={`text-[9px] ${calDay === i ? "text-white/60" : "text-[#AEAEB2]"}`}>
                    {d.month}
                  </span>
                </button>
              ))}
            </div>

            {/* Time grid */}
            {loading ? (
              <div className="h-56 flex items-center justify-center text-sm text-[#86868B]">
                Loading schedule…
              </div>
            ) : (
              <div
                className="overflow-y-auto rounded-xl border border-[#E5E5EA]"
                style={{ maxHeight: 300 }}
              >
                {slots.map((slot, i) => (
                  <button
                    key={slot.start}
                    onClick={() => handleSlotClick(slot)}
                    disabled={slot.status === "past" || slot.status === "booked"}
                    className={`flex items-center w-full px-3 gap-3 text-left transition-colors ${
                      i > 0 ? "border-t border-[#F5F5F7]" : ""
                    } ${
                      slot.status === "past"
                        ? "bg-[#FAFAFA] cursor-default"
                        : slot.status === "booked"
                        ? "bg-[#FFF5F5] cursor-default"
                        : slot.status === "selected"
                        ? "bg-[#1D1D1F]"
                        : "bg-white hover:bg-[#F0FAF3] cursor-pointer"
                    }`}
                    style={{ height: 38 }}
                  >
                    {/* Time label */}
                    <span className={`text-[11px] font-mono w-10 shrink-0 ${
                      slot.status === "selected" ? "text-white/70"
                      : slot.status === "past" ? "text-[#C7C7CC]"
                      : "text-[#86868B]"
                    }`}>
                      {slot.label}
                    </span>

                    {/* Status bar */}
                    <div className={`flex-1 h-5 rounded flex items-center px-2 ${
                      slot.status === "past" ? "bg-[#E5E5EA]"
                      : slot.status === "booked" ? "bg-[#FF3B30]/20"
                      : slot.status === "selected" ? "bg-white/15"
                      : "bg-[#34C759]/15"
                    }`}>
                      <span className={`text-[10px] font-semibold ${
                        slot.status === "selected" ? "text-white"
                        : slot.status === "past" ? "text-[#C7C7CC]"
                        : slot.status === "booked" ? "text-[#FF3B30]"
                        : "text-[#34C759]"
                      }`}>
                        {slot.status === "past" && "Past"}
                        {slot.status === "booked" && (() => {
                          if (!slot.reservation) return "Booked";
                          const end = new Date(slot.reservation.endTime);
                          const hh = String(end.getHours()).padStart(2, "0");
                          const mm = String(end.getMinutes()).padStart(2, "0");
                          return `Booked · until ${hh}:${mm}`;
                        })()}
                        {slot.status === "selected" && "Selected"}
                        {slot.status === "free" && "Free — click to select"}
                      </span>
                    </div>

                    {/* EV icon for booked slots with charging */}
                    {slot.status === "booked" && slot.reservation?.withCharging && (
                      <Zap size={11} className="text-blue-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Book form */}
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider mb-3">
              Book a Slot
            </p>

            {success ? (
              <div className="rounded-xl bg-[#F0FAF3] border border-[#34C759]/30 px-4 py-3 flex items-center gap-2 text-sm text-[#1D1D1F]">
                <CheckCircle2 size={16} className="text-[#34C759] shrink-0" />
                Reservation confirmed! View it in <strong>My Reservations</strong>.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-xs font-medium text-[#1D1D1F]">Start</label>
                    <input
                      type="datetime-local"
                      value={start}
                      onChange={(e) => { setStart(e.target.value); setError(null); }}
                      className="w-full h-9 px-3 rounded-xl border border-[#D2D2D7] text-xs bg-[#FAFAFA] focus:outline-none focus:border-[#1D1D1F]"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-xs font-medium text-[#1D1D1F]">End</label>
                    <input
                      type="datetime-local"
                      value={end}
                      onChange={(e) => { setEnd(e.target.value); setError(null); }}
                      className="w-full h-9 px-3 rounded-xl border border-[#D2D2D7] text-xs bg-[#FAFAFA] focus:outline-none focus:border-[#1D1D1F]"
                    />
                  </div>
                </div>

                {conflict && (
                  <div className="rounded-xl bg-[#FFF0EF] border border-[#FF3B30]/30 px-3 py-2 text-xs text-[#FF3B30]">
                    ⚠️ This time overlaps with an existing booking. Select a free slot above.
                  </div>
                )}

                {space.type === "EV" && (
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-sm font-medium text-[#1D1D1F]">EV Charging</p>
                      <p className="text-xs text-[#86868B]">Charge your vehicle while parked</p>
                    </div>
                    <Toggle checked={evCharging} onChange={setEvCharging} />
                  </div>
                )}

                {error && <p className="text-xs text-[#FF3B30]">{error}</p>}

                <button
                  onClick={handleReserve}
                  disabled={submitting || conflict || !start || !end}
                  className="w-full h-10 rounded-xl bg-[#1D1D1F] text-white text-sm font-medium hover:bg-[#3a3a3c] disabled:opacity-40 transition-colors"
                >
                  {submitting ? "Reserving…" : "Confirm Reservation"}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
