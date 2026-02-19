"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@heroui/react";
import { useAuth } from "@/lib/context/AuthContext";
import { useOrganization } from "@/lib/context/OrganizationContext";
import { formatCurrency, formatDate } from "@/lib/utils/format";

// ── Tipos locales ──────────────────────────────────────────────────────────

interface SummaryInvoice {
  id: string;
  number: string | null;
  amount: string;
  date: string;
  dueDate: string | null;
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
  client?: { id: string; name: string; company: string | null };
  createdAt: string;
}

interface SummaryExpense {
  id: string;
  description: string;
  amount: string;
  date: string;
  dueDate: string | null;
  type: "FIXED" | "VARIABLE";
  status: "PENDING" | "PAID" | "OVERDUE";
  createdAt: string;
}

interface DashboardSummary {
  invoices: {
    pendingCount: number;
    pendingAmount: string;
    pendingList: SummaryInvoice[];
  };
  expenses: {
    pendingCount: number;
    pendingAmount: string;
    pendingList: SummaryExpense[];
  };
  recentInvoices: SummaryInvoice[];
  recentExpenses: SummaryExpense[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const INVOICE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Cobrada",
  OVERDUE: "Vencida",
  CANCELLED: "Anulada",
};

const EXPENSE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  OVERDUE: "Vencido",
};

const EXPENSE_TYPE_LABELS: Record<string, string> = {
  FIXED: "Fijo",
  VARIABLE: "Variable",
};

function invoiceStatusClass(status: string) {
  return {
    PENDING: "bg-warning-100 text-warning-700",
    PAID: "bg-success-100 text-success-700",
    OVERDUE: "bg-danger-100 text-danger-700",
    CANCELLED: "bg-default-100 text-default-500",
  }[status] ?? "bg-default-100 text-default-500";
}

function expenseStatusClass(status: string) {
  return {
    PENDING: "bg-warning-100 text-warning-700",
    PAID: "bg-success-100 text-success-700",
    OVERDUE: "bg-danger-100 text-danger-700",
  }[status] ?? "bg-default-100 text-default-500";
}

// ── Componente ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const router = useRouter();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    if (!currentOrg) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/organizations/summary?orgId=${currentOrg.id}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Error al cargar resumen");
      setSummary(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar resumen");
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Actividad reciente: combina facturas y gastos, ordena por createdAt desc
  const recentActivity = summary
    ? [
        ...summary.recentInvoices.map((i) => ({
          ...i,
          _type: "invoice" as const,
          _label: i.number ? `Factura ${i.number}` : i.client?.name ?? "Factura",
        })),
        ...summary.recentExpenses.map((e) => ({
          ...e,
          _type: "expense" as const,
          _label: e.description,
        })),
      ]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 8)
    : [];

  // ── Sin org ──────────────────────────────────────────────────────────────

  if (!currentOrg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <p className="text-2xl font-bold mb-2">Hola, {user?.name?.split(" ")[0]}</p>
        <p className="text-default-500">
          Seleccioná una organización para comenzar.
        </p>
      </div>
    );
  }

  // ── Render principal ─────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Hola, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-default-400 text-sm mt-0.5">{currentOrg.name}</p>
      </div>

      {/* ── Accesos rápidos ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-7">
        <Link
          href="/dashboard/invoices"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          <span>+</span> Nueva factura
        </Link>
        <Link
          href="/dashboard/expenses"
          className="inline-flex items-center gap-1.5 rounded-md bg-default-800 px-4 py-2 text-sm font-medium text-white hover:bg-default-700 transition-colors"
        >
          <span>+</span> Nuevo gasto
        </Link>
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-1.5 rounded-md border border-default-300 px-4 py-2 text-sm font-medium text-default-700 hover:bg-default-100 transition-colors"
        >
          <span>+</span> Nuevo cliente
        </Link>
        <Link
          href="/dashboard/invoices"
          className="inline-flex items-center gap-1.5 rounded-md border border-default-300 px-4 py-2 text-sm font-medium text-default-700 hover:bg-default-100 transition-colors"
        >
          Ver facturas
        </Link>
        <Link
          href="/dashboard/expenses"
          className="inline-flex items-center gap-1.5 rounded-md border border-default-300 px-4 py-2 text-sm font-medium text-default-700 hover:bg-default-100 transition-colors"
        >
          Ver gastos
        </Link>
      </div>

      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      {isLoading ? (
        <p className="text-default-400 text-sm">Cargando resumen...</p>
      ) : !summary ? null : (
        <>
          {/* ── Cards de resumen ─────────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-7">
            {/* Facturas por cobrar */}
            <Card
              isPressable
              onPress={() => router.push("/dashboard/invoices?status=PENDING")}
              className="cursor-pointer"
            >
              <CardBody className="p-5">
                <p className="text-xs text-default-400 uppercase tracking-wide mb-2">
                  Facturas por cobrar
                </p>
                <p className="text-2xl font-bold text-warning-600">
                  {formatCurrency(summary.invoices.pendingAmount)}
                </p>
                <p className="text-sm text-default-500 mt-1">
                  {summary.invoices.pendingCount}{" "}
                  {summary.invoices.pendingCount === 1 ? "factura" : "facturas"}
                </p>
              </CardBody>
            </Card>

            {/* Gastos pendientes */}
            <Card
              isPressable
              onPress={() => router.push("/dashboard/expenses")}
              className="cursor-pointer"
            >
              <CardBody className="p-5">
                <p className="text-xs text-default-400 uppercase tracking-wide mb-2">
                  Gastos pendientes de pago
                </p>
                <p className="text-2xl font-bold text-danger-600">
                  {formatCurrency(summary.expenses.pendingAmount)}
                </p>
                <p className="text-sm text-default-500 mt-1">
                  {summary.expenses.pendingCount}{" "}
                  {summary.expenses.pendingCount === 1 ? "gasto" : "gastos"}
                </p>
              </CardBody>
            </Card>

            {/* Balance estimado */}
            <Card>
              <CardBody className="p-5">
                <p className="text-xs text-default-400 uppercase tracking-wide mb-2">
                  Balance estimado
                </p>
                <p
                  className={`text-2xl font-bold ${
                    parseFloat(summary.invoices.pendingAmount) -
                      parseFloat(summary.expenses.pendingAmount) >=
                    0
                      ? "text-success-600"
                      : "text-danger-600"
                  }`}
                >
                  {formatCurrency(
                    (
                      parseFloat(summary.invoices.pendingAmount) -
                      parseFloat(summary.expenses.pendingAmount)
                    ).toFixed(2),
                  )}
                </p>
                <p className="text-sm text-default-400 mt-1">
                  cobros − gastos pendientes
                </p>
              </CardBody>
            </Card>
          </div>

          {/* ── Dos columnas: facturas + gastos ──────────────────────────── */}
          <div className="grid gap-5 lg:grid-cols-2 mb-7">

            {/* Facturas pendientes de cobro */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">
                  Facturas pendientes de cobro
                </h2>
                <Link
                  href="/dashboard/invoices"
                  className="text-xs text-primary hover:underline"
                >
                  Ver todas
                </Link>
              </div>

              {summary.invoices.pendingList.length === 0 ? (
                <div className="rounded-lg border border-default-200 p-5 text-center">
                  <p className="text-sm text-default-400">
                    No hay facturas pendientes. ¡Todo al día!
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-default-200 divide-y divide-default-100">
                  {summary.invoices.pendingList.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() =>
                        router.push(`/dashboard/invoices/${inv.id}`)
                      }
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-default-50 transition-colors ${
                        inv.status === "OVERDUE"
                          ? "border-l-2 border-l-danger-400"
                          : "border-l-2 border-l-warning-400"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {inv.client?.name ?? "—"}
                          {inv.number && (
                            <span className="ml-1 text-default-400 font-normal">
                              #{inv.number}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-default-400">
                          {inv.dueDate
                            ? `Vence ${formatDate(inv.dueDate)}`
                            : formatDate(inv.date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${invoiceStatusClass(inv.status)}`}
                        >
                          {INVOICE_STATUS_LABELS[inv.status]}
                        </span>
                        <span className="text-sm font-semibold">
                          {formatCurrency(inv.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gastos próximos a vencer */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">
                  Gastos pendientes de pago
                </h2>
                <Link
                  href="/dashboard/expenses"
                  className="text-xs text-primary hover:underline"
                >
                  Ver todos
                </Link>
              </div>

              {summary.expenses.pendingList.length === 0 ? (
                <div className="rounded-lg border border-default-200 p-5 text-center">
                  <p className="text-sm text-default-400">
                    No hay gastos pendientes de pago.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-default-200 divide-y divide-default-100">
                  {summary.expenses.pendingList.map((exp) => (
                    <div
                      key={exp.id}
                      onClick={() =>
                        router.push(`/dashboard/expenses/${exp.id}`)
                      }
                      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-default-50 transition-colors border-l-2 border-l-default-300"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {exp.description}
                        </p>
                        <p className="text-xs text-default-400">
                          {EXPENSE_TYPE_LABELS[exp.type]}
                          {exp.dueDate &&
                            ` · Vence ${formatDate(exp.dueDate)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${expenseStatusClass(exp.status)}`}
                        >
                          {EXPENSE_STATUS_LABELS[exp.status]}
                        </span>
                        <span className="text-sm font-semibold">
                          {formatCurrency(exp.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Actividad reciente ───────────────────────────────────────── */}
          {recentActivity.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-3">Actividad reciente</h2>
              <div className="rounded-lg border border-default-200 divide-y divide-default-100">
                {recentActivity.map((item) => {
                  const isInvoice = item._type === "invoice";
                  const inv = isInvoice ? (item as typeof item & SummaryInvoice) : null;
                  const exp = !isInvoice ? (item as typeof item & SummaryExpense) : null;

                  return (
                    <div
                      key={`${item._type}-${item.id}`}
                      onClick={() =>
                        router.push(
                          `/dashboard/${isInvoice ? "invoices" : "expenses"}/${item.id}`,
                        )
                      }
                      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-default-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="shrink-0 text-base">
                          {isInvoice ? "📄" : "💸"}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item._label}
                          </p>
                          <p className="text-xs text-default-400">
                            {isInvoice ? "Factura" : "Gasto"} ·{" "}
                            {formatDate(item.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            isInvoice
                              ? invoiceStatusClass(inv!.status)
                              : expenseStatusClass(exp!.status)
                          }`}
                        >
                          {isInvoice
                            ? INVOICE_STATUS_LABELS[inv!.status]
                            : EXPENSE_STATUS_LABELS[exp!.status]}
                        </span>
                        <span className="text-sm font-semibold">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
