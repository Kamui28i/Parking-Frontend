"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { pricingApi, zonesApi } from "@/lib/api";
import type { PricingRule, Zone } from "@/lib/types";

export default function AdminPricingPage() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([pricingApi.list(), zonesApi.list()])
      .then(([fetchedRules, fetchedZones]) => {
        setRules(fetchedRules);
        setZones(fetchedZones);
      })
      .finally(() => setLoading(false));
  }, []);

  const zoneName = (id: string) => zones.find((z) => z.id === id)?.name ?? id;

  const handleDelete = async (ruleId: string) => {
    try {
      await pricingApi.delete(ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch {
      /* ignore */
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-DE", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[#1D1D1F]">Pricing Rules</h1>
        <Button>
          <Plus size={16} />
          Add Rule
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E5EA]">
              {["Zone", "Space Type", "Rate / Hour", "Valid From", "Valid To", "Actions"].map((h) => (
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
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#86868B]">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rules.length === 0 && (
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
                <td className="px-4 py-3 text-[#86868B]">
                  {rule.validTo ? formatDate(rule.validTo) : "No expiry"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" className="h-8 px-3 text-xs">
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      className="h-8 px-3 text-xs"
                      onClick={() => handleDelete(rule.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
