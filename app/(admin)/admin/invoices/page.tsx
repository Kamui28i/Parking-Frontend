"use client";

import { useEffect, useState } from "react";
import Badge, { statusToBadge } from "@/components/ui/Badge";
import { invoicesApi } from "@/lib/api";
import type { Invoice } from "@/lib/types";

const MOCK: Invoice[] = [
  { id: "INV-2024-001", reservationId: "RES-A01-3092", amount: "2.40", status: "PAID", createdAt: "2025-03-24T11:04:00" },
  { id: "INV-2024-002", reservationId: "RES-B10-1974", amount: "2.80", status: "PENDING", createdAt: "2025-03-24T16:50:00" },
  { id: "INV-2024-003", reservationId: "RES-B10-0143", amount: "5.60", status: "FAILED", createdAt: "2025-03-23T17:30:00" },
  { id: "INV-2024-004", reservationId: "RES-C05-8821", amount: "3.20", status: "PAID", createdAt: "2025-03-22T09:15:00" },
];

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK);

  useEffect(() => {
    invoicesApi.listAll().then(setInvoices).catch(() => {/* use mock */});
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-[#1D1D1F] mb-6">All Invoices</h1>

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
                <td className="px-4 py-3 font-medium text-[#1D1D1F]">€{inv.amount}</td>
                <td className="px-4 py-3">
                  <Badge label={inv.status} variant={statusToBadge(inv.status)} />
                </td>
                <td className="px-4 py-3 text-[#86868B]">{inv.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
