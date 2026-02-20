"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";
import { useAuth } from "@/lib/context/AuthContext";
import { useOrganization } from "@/lib/context/OrganizationContext";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const { isLoading: orgLoading } = useOrganization();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isLoading = authLoading || orgLoading;

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:static md:z-auto md:block transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Mobile hamburger bar */}
        <div className="flex items-center h-12 px-4 md:hidden border-b border-divider bg-content1 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col gap-1 p-1"
            aria-label="Abrir menú"
          >
            <span className="block h-0.5 w-5 bg-default-600" />
            <span className="block h-0.5 w-5 bg-default-600" />
            <span className="block h-0.5 w-5 bg-default-600" />
          </button>
        </div>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
