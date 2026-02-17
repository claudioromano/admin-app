"use client";

import { Button } from "@heroui/react";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">AdminApp</h1>
        <p className="text-lg text-default-500 mb-6">
          Administracion de emprendimientos, facturas y gastos
        </p>
        <Button color="primary" size="lg">
          Comenzar
        </Button>
      </div>
    </div>
  );
}
