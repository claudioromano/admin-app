"use client";

import { useRouter } from "next/navigation";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  Spinner,
} from "@heroui/react";
import { useAuth } from "@/lib/context/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen">
      <Navbar maxWidth="full">
        <NavbarBrand>
          <p className="font-bold text-inherit">AdminApp</p>
        </NavbarBrand>
        <NavbarContent justify="end">
          <NavbarItem>
            <span className="text-sm text-default-500">{user.name}</span>
          </NavbarItem>
          <NavbarItem>
            <Button color="danger" variant="flat" size="sm" onPress={handleLogout}>
              Cerrar sesión
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>
      <main className="p-6">{children}</main>
    </div>
  );
}
