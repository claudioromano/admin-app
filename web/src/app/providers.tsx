"use client";

import { HeroUIProvider } from "@heroui/react";
import { AuthProvider } from "@/lib/context/AuthContext";
import { OrganizationProvider } from "@/lib/context/OrganizationContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <AuthProvider>
        <OrganizationProvider>{children}</OrganizationProvider>
      </AuthProvider>
    </HeroUIProvider>
  );
}
