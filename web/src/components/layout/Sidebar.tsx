"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrgSelector } from "./OrgSelector";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: "🏠" },
  { href: "/dashboard/clients", label: "Clientes", icon: "👥" },
  { href: "/dashboard/invoices", label: "Facturas", icon: "📄" },
  { href: "/dashboard/expenses", label: "Gastos", icon: "💸" },
  { href: "/dashboard/payment-accounts", label: "Cuentas", icon: "🏦" },
  { href: "/dashboard/settings", label: "Configuración", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-divider bg-content1">
      <div className="p-4 border-b border-divider">
        <h1 className="text-lg font-bold mb-3">AdminApp</h1>
        <OrgSelector />
      </div>

      <nav className="flex-1 p-2">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-default-600 hover:bg-default-100"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
