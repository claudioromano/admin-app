"use client";

import { useAuth } from "@/lib/context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold">
        Bienvenido, {user?.name}
      </h1>
      <p className="mt-2 text-default-500">
        Este es tu panel de administración.
      </p>
    </div>
  );
}
