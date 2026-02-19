"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { useAuth } from "@/lib/context/AuthContext";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-divider px-4 md:px-6 bg-content1 gap-4">
      {/* Hamburger – mobile only */}
      <button
        onClick={onMenuClick}
        className="md:hidden shrink-0 flex flex-col gap-1 p-1"
        aria-label="Abrir menú"
      >
        <span className="block h-0.5 w-5 bg-default-600" />
        <span className="block h-0.5 w-5 bg-default-600" />
        <span className="block h-0.5 w-5 bg-default-600" />
      </button>

      <div className="flex items-center gap-4 ml-auto">
        <span className="hidden sm:block text-sm text-default-500 truncate max-w-[160px]">
          {user?.name}
        </span>
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
