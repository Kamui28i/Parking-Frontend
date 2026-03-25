"use client";

import { useEffect, useState } from "react";
import Badge, { statusToBadge } from "@/components/ui/Badge";
import { invoicesApi } from "@/lib/api";
import type { Invoice } from "@/lib/types";

const MOCK: Invoice[] = [
  { id: "INV-2024-001", reservationId: "RES-A01-3092", amount: "€2.40", status: "PAID", createdAt: "Mar 24, 11:04" },
  { id: "INV-y024-002", reservationId: "RES-B10-1974", amount: "€2.80", status: "PENDING", createdAt: "Mar 24, 16:50" },
  { id: "INV-2024-003", reservationId: "RES-B10-0143", amount: "€5.60", status: "FAILED", createdAt: "Mar 23, 17:30" },
];

export default function MyInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK);

  useEffect(() => {
    invoicesApi.list().then(setInvoices).catch(() => {/* use mock */});
  }, []);

  const total = invoices
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + parseFloat(i.amount.replace("€", "")), 0)
    .toFixed(2);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-[#1D1D1F] mb-6">My Invoices</h1>

      <div className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E5EA]">
              {["Invoice ID", "Reservation ID", "Amount", "Status", "Created"].map((h) => (
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
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-[#FAFAFA] transition-colors">
                <td className="px-4 py-3 font-medium text-[#1D1D1F]">{inv.id}</td>
                <td className="px-4 py-3 text-[#86868B]">{inv.reservationId}</td>
                <td className="px-4 py-3 text-[#1D1D1F]">{inv.amount}</td>
                <td className="px-4 py-3">
                  <Badge label={inv.status} variant={statusToBadge(inv.status)} />
                </td>
                <td className="px-4 py-3 text-[#86868B]">{inv.createdAt}</td>
              </tr>
            ))}
            {/* Total row */}
            <tr className="bg-[#F5F5F7]">
              <td className="px-4 py-3 font-semibold text-[#1D1D1F]">Total Paid</td>
              <td />
              <td className="px-4 py-3 font-semibold text-[#1D1D1F]">€{total}</td>
              <td />
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
