"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody, Input, Button } from "@heroui/react";
import { useAuth } from "@/lib/context/AuthContext";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await register({ name, email, password });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-1 px-6 pt-6">
          <h1 className="text-2xl font-bold">Crear cuenta</h1>
          <p className="text-sm text-default-500">
            Completá tus datos para registrarte
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
              type="text"
              label="Nombre"
              placeholder="Tu nombre"
              value={name}
              onValueChange={setName}
              isRequired
            />
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
              placeholder="Mínimo 6 caracteres"
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
              Registrarse
            </Button>
            <p className="text-center text-sm text-default-500">
              ¿Ya tenés cuenta?{" "}
              <Link href="/login" className="text-primary">
                Iniciá sesión
              </Link>
            </p>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
