"use client";

import { Card, CardBody } from "@heroui/react";
import { useAuth } from "@/lib/context/AuthContext";
import { useOrganization } from "@/lib/context/OrganizationContext";

export default function DashboardPage() {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();

  return (
    <div>
      <h1 className="text-3xl font-bold">Bienvenido, {user?.name}</h1>
      {currentOrg && (
        <p className="mt-1 text-default-500">
          Organización activa: {currentOrg.name}
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">Clientes</p>
            <p className="text-2xl font-bold">-</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">Facturas pendientes</p>
            <p className="text-2xl font-bold">-</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">Gastos del mes</p>
            <p className="text-2xl font-bold">-</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
