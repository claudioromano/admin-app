"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody, Input, Button } from "@heroui/react";
import { useAuth } from "@/lib/context/AuthContext";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({ email, password });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-1 px-6 pt-6">
          <h1 className="text-2xl font-bold">Iniciar sesión</h1>
          <p className="text-sm text-default-500">
            Ingresá tus credenciales para continuar
          </p>
        </CardHeader>
        <CardBody className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger">
                {error}
              </div>
            )}
            <Input
              type="email"
              label="Email"
              placeholder="tu@email.com"
              value={email}
              onValueChange={setEmail}
              isRequired
            />
            <Input
              type="password"
              label="Contraseña"
              placeholder="Tu contraseña"
              value={password}
              onValueChange={setPassword}
              isRequired
            />
            <Button
              type="submit"
              color="primary"
              isLoading={isSubmitting}
              className="mt-2"
            >
              Iniciar sesión
            </Button>
            <p className="text-center text-sm text-default-500">
              ¿No tenés cuenta?{" "}
              <Link href="/register" className="text-primary">
                Registrate
              </Link>
            </p>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
