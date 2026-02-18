"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { useAuth } from "@/lib/context/AuthContext";

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="flex h-14 items-center justify-end border-b border-divider px-6 bg-content1">
      <div className="flex items-center gap-4">
        <span className="text-sm text-default-500">{user?.name}</span>
        <Button
          color="danger"
          variant="flat"
          size="sm"
          onPress={handleLogout}
        >
          Cerrar sesión
        </Button>
      </div>
    </header>
  );
}
