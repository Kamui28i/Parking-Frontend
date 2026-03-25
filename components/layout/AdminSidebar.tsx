"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Layers, DollarSign, FileText } from "lucide-react";

const navItems = [
  { href: "/admin/zones", label: "Zone Management", icon: Layers },
  { href: "/admin/pricing", label: "Pricing Rules", icon: DollarSign },
  { href: "/admin/invoices", label: "All Invoices", icon: FileText },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    router.push("/login");
  };

  const email =
    typeof window !== "undefined"
      ? (JSON.parse(localStorage.getItem("user") ?? "{}").email ?? "admin@email.com")
      : "admin@email.com";

  return (
    <aside
      className="flex flex-col w-60 shrink-0 h-screen sticky top-0"
      style={{ background: "var(--sidebar-bg)", borderRight: "1px solid var(--border)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="w-8 h-8 rounded-lg bg-[#1D1D1F] flex items-center justify-center text-white text-xs font-bold">
          P
        </div>
        <span className="text-sm font-semibold text-[#1D1D1F]">Digital Parking</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-2 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors
                ${active
                  ? "bg-[#F5F5F7] text-[#1D1D1F] font-medium"
                  : "text-[#86868B] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]"
                }
              `}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-4 py-4 border-t border-[#E5E5EA]">
        <p className="text-xs text-[#86868B] mb-3 truncate">{email}</p>
        <button
          onClick={handleLogout}
          className="text-xs text-[#86868B] hover:text-[#1D1D1F] transition-colors cursor-pointer"
        >
          Log Out
        </button>
      </div>
    </aside>
  );
}
