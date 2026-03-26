"use client";

import { use, Suspense, useState } from "react";
import Badge, { statusToBadge } from "@/components/ui/Badge";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { invoicesApi } from "@/lib/api";
import type { Invoice } from "@/lib/types";

const HEADERS = ["Invoice", "Parking Space", "Amount", "Status", "Date"];

function InvoicesList({ promise }: { promise: Promise<Invoice[]> }) {
  const invoices = use(promise);

  const total = invoices
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + parseFloat(i.amount), 0)
    .toFixed(2);

  return (
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
          {invoices.map((inv) => (
            <tr key={inv.id} className="hover:bg-[#FAFAFA] transition-colors">
              <td className="px-4 py-3 font-medium text-[#1D1D1F]">{inv.id}</td>
              <td className="px-4 py-3 font-medium text-[#1D1D1F]">
                {inv.spaceName ?? inv.reservationId}
                {inv.zoneName && <span className="block text-xs font-normal text-[#86868B]">{inv.zoneName}</span>}
              </td>
              <td className="px-4 py-3 text-[#1D1D1F]">€{inv.amount}</td>
              <td className="px-4 py-3">
                <Badge label={inv.status} variant={statusToBadge(inv.status)} />
              </td>
              <td className="px-4 py-3 text-[#86868B]">
                {new Date(inv.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </td>
            </tr>
          ))}
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
  );
}

function InvoicesSkeleton() {
  return (
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
  );
}

export default function MyInvoicesPage() {
  const [promise] = useState(() => invoicesApi.list());

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-[#1D1D1F] mb-6">My Invoices</h1>
      <Suspense fallback={<InvoicesSkeleton />}>
        <InvoicesList promise={promise} />
      </Suspense>
    </div>
  );
}
