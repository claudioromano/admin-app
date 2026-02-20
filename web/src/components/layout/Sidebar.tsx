"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { useAuth } from "@/lib/context/AuthContext";
import { OrgSelector } from "./OrgSelector";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: "🏠" },
  { href: "/dashboard/clients", label: "Clientes", icon: "👥" },
  { href: "/dashboard/invoices", label: "Facturas", icon: "📄" },
  { href: "/dashboard/expenses", label: "Gastos", icon: "💸" },
  { href: "/dashboard/payment-accounts", label: "Cuentas", icon: "🏦" },
  { href: "/dashboard/settings", label: "Configuración", icon: "⚙️" },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-divider bg-content1">
      <div className="p-4 border-b border-divider flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold mb-3">AdminApp</h1>
          <OrgSelector />
        </div>
        {/* Close button – mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden mt-1 shrink-0 text-default-400 hover:text-default-700 transition-colors"
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        )}
      </div>

      <nav className="flex-1 p-2 overflow-y-auto">
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
                  onClick={onClose}
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

      {/* User section */}
      <div className="border-t border-divider p-3 flex flex-col gap-2">
        <span className="text-xs text-default-500 truncate px-1">{user?.name}</span>
        <Button
          color="danger"
          variant="flat"
          size="sm"
          fullWidth
          onPress={handleLogout}
        >
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}
