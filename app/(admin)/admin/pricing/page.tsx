"use client";

import { use, Suspense, useState } from "react";
import { Plus, X } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { pricingApi, zonesApi } from "@/lib/api";
import type { PricingRule, PricingSpaceType, Zone } from "@/lib/types";

type PageData = { rules: PricingRule[]; zones: Zone[] };

const HEADERS = ["Zone", "Space Type", "Rate / Hour", "Valid From", "Valid To", "Actions"];

const SPACE_TYPES: PricingSpaceType[] = ["REGULAR", "EV", "ALL"];

function toBackendDateTime(local: string) {
  // datetime-local gives "YYYY-MM-DDTHH:MM", backend needs seconds
  return local ? `${local}:00` : null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-DE", { year: "numeric", month: "short", day: "numeric" });
}

// ── Add/Edit modal ────────────────────────────────────────────────────────────

interface RuleFormProps {
  zones: Zone[];
  initial?: PricingRule;
  onSave: (rule: PricingRule) => void;
  onClose: () => void;
}

function RuleFormModal({ zones, initial, onSave, onClose }: RuleFormProps) {
  const [zoneId, setZoneId] = useState(initial?.zoneId ?? zones[0]?.id ?? "");
  const [spaceType, setSpaceType] = useState<PricingSpaceType>(initial?.spaceType ?? "REGULAR");
  const [rate, setRate] = useState(initial?.ratePerHour ?? "");
  const [validFrom, setValidFrom] = useState(initial?.validFrom?.slice(0, 16) ?? "");
  const [validTo, setValidTo] = useState(initial?.validTo?.slice(0, 16) ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!zoneId || !rate || !validFrom) {
      setError("Zone, rate and valid-from date are required.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        zoneId,
        spaceType,
        ratePerHour: rate,
        validFrom: toBackendDateTime(validFrom),
        validTo: validTo ? toBackendDateTime(validTo) : null,
      };
      const saved = initial
        ? await pricingApi.update(initial.id, payload)
        : await pricingApi.create(payload);
      onSave(saved);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save rule.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-[420px] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-[#1D1D1F]">
            {initial ? "Edit Rule" : "Add Pricing Rule"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F5F7] text-[#86868B]">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Zone */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#1D1D1F]">Zone</label>
            <select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className="h-9 px-3 rounded-xl border border-[#D2D2D7] text-sm bg-[#FAFAFA] focus:outline-none focus:border-[#1D1D1F]"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>

          {/* Space type */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#1D1D1F]">Space Type</label>
            <div className="flex gap-2">
              {SPACE_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setSpaceType(t)}
                  className={`flex-1 h-9 rounded-xl text-sm font-medium border transition-colors ${
                    spaceType === t
                      ? "bg-[#1D1D1F] text-white border-[#1D1D1F]"
                      : "bg-white text-[#86868B] border-[#D2D2D7] hover:bg-[#F5F5F7]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Rate */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#1D1D1F]">Rate per Hour (€)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="e.g. 2.50"
              className="h-9 px-3 rounded-xl border border-[#D2D2D7] text-sm bg-[#FAFAFA] focus:outline-none focus:border-[#1D1D1F]"
            />
          </div>

          {/* Valid from / to */}
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs font-medium text-[#1D1D1F]">Valid From</label>
              <input
                type="datetime-local"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="h-9 px-3 rounded-xl border border-[#D2D2D7] text-sm bg-[#FAFAFA] focus:outline-none focus:border-[#1D1D1F]"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs font-medium text-[#1D1D1F]">Valid To <span className="text-[#86868B] font-normal">(optional)</span></label>
              <input
                type="datetime-local"
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
                className="h-9 px-3 rounded-xl border border-[#D2D2D7] text-sm bg-[#FAFAFA] focus:outline-none focus:border-[#1D1D1F]"
              />
            </div>
          </div>

          {error && <p className="text-xs text-[#FF3B30]">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-10 rounded-xl bg-[#1D1D1F] text-white text-sm font-medium hover:bg-[#3a3a3c] disabled:opacity-40 transition-colors"
          >
            {submitting ? "Saving…" : initial ? "Save Changes" : "Create Rule"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────

function PricingTable({ promise }: { promise: Promise<PageData> }) {
  const { rules: initial, zones } = use(promise);
  const [rules, setRules] = useState(initial);
  const [modal, setModal] = useState<"add" | PricingRule | null>(null);

  const zoneName = (id: string) => zones.find((z) => z.id === id)?.name ?? id;

  const handleDelete = async (ruleId: string) => {
    try {
      await pricingApi.delete(ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch {/* ignore */}
  };

  const handleSave = (saved: PricingRule) => {
    setRules((prev) => {
      const idx = prev.findIndex((r) => r.id === saved.id);
      return idx >= 0 ? prev.map((r) => (r.id === saved.id ? saved : r)) : [saved, ...prev];
    });
    setModal(null);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[#1D1D1F]">Pricing Rules</h1>
        <Button onClick={() => setModal("add")}>
          <Plus size={16} />
          Add Rule
        </Button>
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
            {rules.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#86868B]">
                  No pricing rules found.
                </td>
              </tr>
            )}
            {rules.map((rule) => (
              <tr key={rule.id} className="hover:bg-[#FAFAFA] transition-colors">
                <td className="px-4 py-3 font-medium text-[#1D1D1F]">{zoneName(rule.zoneId)}</td>
                <td className="px-4 py-3">
                  <Badge label={rule.spaceType} variant="blue" />
                </td>
                <td className="px-4 py-3 font-semibold text-[#1D1D1F]">€{rule.ratePerHour}/hr</td>
                <td className="px-4 py-3 text-[#86868B]">{formatDate(rule.validFrom)}</td>
                <td className="px-4 py-3 text-[#86868B]">{rule.validTo ? formatDate(rule.validTo) : "No expiry"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setModal(rule)}
                      className="text-xs text-[#1D1D1F] hover:text-[#86868B] font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="text-xs text-[#FF3B30] hover:text-[#d63028] font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <RuleFormModal
          zones={zones}
          initial={modal === "add" ? undefined : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

function PricingTableSkeleton() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-40 rounded-xl bg-[#E5E5EA] animate-pulse" />
        <div className="h-10 w-28 rounded-xl bg-[#E5E5EA] animate-pulse" />
      </div>
      <div className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E5EA]">
              {HEADERS.map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#86868B] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <TableSkeleton rows={4} cols={6} />
        </table>
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminPricingPage() {
  const [promise] = useState(() =>
    Promise.all([pricingApi.list(), zonesApi.list()]).then(
      ([rules, zones]) => ({ rules, zones })
    )
  );

  return (
    <div className="p-8">
      <Suspense fallback={<PricingTableSkeleton />}>
        <PricingTable promise={promise} />
      </Suspense>
    </div>
  );
}
