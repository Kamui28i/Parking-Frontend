"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { pricingApi } from "@/lib/api";
import type { PricingRule } from "@/lib/types";

const MOCK: PricingRule[] = [
  { id: "1", zoneId: "zone-a", spaceType: "REGULAR", ratePerHour: "2.40", validFrom: "2023-06-01T00:00:00", validTo: null },
  { id: "2", zoneId: "zone-a", spaceType: "EV", ratePerHour: "3.50", validFrom: "2024-06-01T00:00:00", validTo: "2024-10-27T23:59:59" },
  { id: "3", zoneId: "zone-b", spaceType: "REGULAR", ratePerHour: "1.80", validFrom: "2024-03-01T00:00:00", validTo: null },
  { id: "4", zoneId: "zone-c", spaceType: "REGULAR", ratePerHour: "4.00", validFrom: "2024-06-01T00:00:00", validTo: "2024-04-30T23:59:59" },
];

export default function AdminPricingPage() {
  const [rules, setRules] = useState<PricingRule[]>(MOCK);

  useEffect(() => {
    pricingApi.list().then(setRules).catch(() => {/* use mock */});
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await pricingApi.delete(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch {/* ignore */}
  };

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
              {["Zone ID", "Space Type", "Rate/Hour", "Valid From", "Valid To", "Actions"].map((h) => (
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
            {rules.map((rule) => (
              <tr key={rule.id} className="hover:bg-[#FAFAFA] transition-colors">
                <td className="px-4 py-3 text-[#1D1D1F]">{rule.zoneId}</td>
                <td className="px-4 py-3">
                  <Badge label={rule.spaceType} variant="blue" />
                </td>
                <td className="px-4 py-3 font-medium text-[#1D1D1F]">€{rule.ratePerHour}/hr</td>
                <td className="px-4 py-3 text-[#86868B]">{rule.validFrom}</td>
                <td className="px-4 py-3 text-[#86868B]">{rule.validTo ?? "No expiry"}</td>
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
