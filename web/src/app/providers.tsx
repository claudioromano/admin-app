"use client";

import { HeroUIProvider } from "@heroui/react";
import { AuthProvider } from "@/lib/context/AuthContext";
import { OrganizationProvider } from "@/lib/context/OrganizationContext";
import { ToastProvider } from "@/lib/context/ToastContext";
import { ToastContainer } from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <ToastProvider>
        <AuthProvider>
          <OrganizationProvider>{children}</OrganizationProvider>
        </AuthProvider>
        <ToastContainer />
      </ToastProvider>
    </HeroUIProvider>
  );
}
