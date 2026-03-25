"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { pricingApi } from "@/lib/api";
import type { PricingRule } from "@/lib/types";

const MOCK: PricingRule[] = [
  { id: "1", zone: "Zone A — Central", spaceType: "REGULAR", basePrice: "€2.40", validFrom: "Jun 1, 2023", validTo: null, active: true },
  { id: "2", zone: "Zone A — Central", spaceType: "EV", basePrice: "€3.50", validFrom: "Jun 1, 2024", validTo: "Oct 27, 2024", active: false },
  { id: "3", zone: "Zone B — Station", spaceType: "REGULAR", basePrice: "€1.80", validFrom: "Mar 1, 2024", validTo: null, active: true },
  { id: "4", zone: "Zone C — Airport", spaceType: "REGULAR", basePrice: "€4.00", validFrom: "Jun 1, 2024", validTo: "Apr 30, 2024", active: false },
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
              {["Zone", "Space Type", "Base Price", "Valid From", "Valid To", "Actions"].map((h) => (
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
                <td className="px-4 py-3 text-[#1D1D1F]">{rule.zone}</td>
                <td className="px-4 py-3">
                  <Badge label={rule.spaceType} variant="blue" />
                </td>
                <td className="px-4 py-3 font-medium text-[#1D1D1F]">{rule.basePrice}</td>
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
