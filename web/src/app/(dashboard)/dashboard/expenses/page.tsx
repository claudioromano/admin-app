"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useOrganization } from "@/lib/context/OrganizationContext";
import type { ExpensesPage as ExpensesPageData } from "@/types/expense";
import {
  Expense,
  ExpenseType,
  ExpenseStatus,
  CreateExpenseData,
  EXPENSE_TYPE_LABELS,
  EXPENSE_STATUS_LABELS,
} from "@/types/expense";
import * as expensesApi from "@/lib/api/expenses";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useToast } from "@/lib/context/ToastContext";
import { SkeletonTable } from "@/components/ui/Skeleton";

type ExpenseStatusFilter = ExpenseStatus | "";
type ExpenseTypeFilter = ExpenseType | "";

function monthToRange(month: string): { dateFrom: string; dateTo: string } | null {
  if (!month) return null;
  const [y, m] = month.split("-").map(Number);
  const from = new Date(Date.UTC(y, m - 1, 1));
  const to = new Date(Date.UTC(y, m, 0, 23, 59, 59));
  return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
}

const EMPTY_FORM: CreateExpenseData & { dueDate: string } = {
  description: "",
  amount: 0,
  date: "",
  dueDate: "",
  type: "VARIABLE",
  notes: "",
};

export default function ExpensesPage() {
  const router = useRouter();
  const { currentOrg } = useOrganization();
  const { showToast } = useToast();

  // ── Listado ────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ExpenseStatusFilter>("");
  const [typeFilter, setTypeFilter] = useState<ExpenseTypeFilter>("");
  const [monthFilter, setMonthFilter] = useState("");
  const [result, setResult] = useState<ExpensesPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Pendientes ─────────────────────────────────────────────────────────
  const [pendingTotal, setPendingTotal] = useState<number | null>(null);

  // ── Modal crear ────────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadExpenses = useCallback(async () => {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const range = monthToRange(monthFilter);
      const data = await expensesApi.listExpenses(currentOrg.id, {
        page,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        dateFrom: range?.dateFrom,
        dateTo: range?.dateTo,
      });
      setResult(data);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Error al cargar gastos",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg, page, statusFilter, typeFilter, monthFilter, showToast]);

  const loadPendingTotal = useCallback(async () => {
    if (!currentOrg) return;
    try {
      const data = await expensesApi.listExpenses(currentOrg.id, {
        status: "PENDING",
        limit: 1,
      });
      setPendingTotal(data.total);
    } catch {
      /* ignorar */
    }
  }, [currentOrg]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter, monthFilter]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  useEffect(() => {
    loadPendingTotal();
  }, [loadPendingTotal]);

  const handleCreate = async () => {
    if (!currentOrg || !form.description || !form.amount || !form.date) return;
    setFormError("");
    setIsSaving(true);
    try {
      const created = await expensesApi.createExpense(currentOrg.id, {
        description: form.description.trim(),
        amount: parseFloat(String(form.amount)),
        date: form.date,
        dueDate: form.dueDate || null,
        type: form.type,
        notes: form.notes?.trim() || undefined,
      });
      setShowModal(false);
      setForm(EMPTY_FORM);
      loadPendingTotal();
      router.push(`/dashboard/expenses/${created.id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al crear gasto");
    } finally {
      setIsSaving(false);
    }
  };

  const statusBadge = (status: ExpenseStatus) => {
    const cls = {
      PENDING: "bg-warning-100 text-warning-700",
      PAID: "bg-success-100 text-success-700",
      OVERDUE: "bg-danger-100 text-danger-700",
    }[status];
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
        {EXPENSE_STATUS_LABELS[status]}
      </span>
    );
  };

  const typeBadge = (type: ExpenseType) => {
    const cls =
      type === "FIXED"
        ? "bg-primary-100 text-primary-700"
        : "bg-default-100 text-default-600";
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
        {EXPENSE_TYPE_LABELS[type]}
      </span>
    );
  };

  if (!currentOrg) {
    return <p className="text-default-500">Seleccioná una organización.</p>;
  }

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gastos</h1>
          {pendingTotal !== null && pendingTotal > 0 && (
            <p className="text-sm text-warning-600 mt-0.5">
              {pendingTotal} gasto{pendingTotal !== 1 ? "s" : ""} pendiente
              {pendingTotal !== 1 ? "s" : ""} de pago
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setForm(EMPTY_FORM);
            setFormError("");
            setShowModal(true);
          }}
          className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90"
        >
          + Nuevo gasto
        </button>
      </div>

      {/* ── Alerta pendientes ──────────────────────────────────────────────── */}
      {pendingTotal !== null && pendingTotal > 0 && !statusFilter && (
        <div className="mb-4 rounded-lg bg-warning-50 border border-warning-200 p-3 flex items-center gap-2">
          <span className="text-warning-600 font-medium text-sm">
            Tenés {pendingTotal} gasto{pendingTotal !== 1 ? "s" : ""} pendiente
            {pendingTotal !== 1 ? "s" : ""} de pago.
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter("PENDING")}
            className="text-sm text-warning-700 underline"
          >
            Ver pendientes
          </button>
        </div>
      )}

      {/* ── Filtros ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ExpenseStatusFilter)}
          className="rounded-md border border-default-300 px-3 py-1.5 text-sm"
        >
          <option value="">Todos los estados</option>
          {Object.entries(EXPENSE_STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ExpenseTypeFilter)}
          className="rounded-md border border-default-300 px-3 py-1.5 text-sm"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(EXPENSE_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        <input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="rounded-md border border-default-300 px-3 py-1.5 text-sm"
        />

        {(statusFilter || typeFilter || monthFilter) && (
          <button
            type="button"
            onClick={() => {
              setStatusFilter("");
              setTypeFilter("");
              setMonthFilter("");
            }}
            className="text-sm text-default-500 hover:text-default-700 underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ── Tabla ──────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : result?.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-4">💸</div>
          <h3 className="text-lg font-semibold mb-1">
            {statusFilter || typeFilter || monthFilter
              ? "Sin resultados"
              : "Todavía no hay gastos"}
          </h3>
          <p className="text-sm text-default-500 mb-4">
            {statusFilter || typeFilter || monthFilter
              ? "No hay gastos con los filtros seleccionados."
              : "Empezá registrando tu primer gasto."}
          </p>
          {!statusFilter && !typeFilter && !monthFilter && (
            <button
              type="button"
              onClick={() => {
                setForm(EMPTY_FORM);
                setFormError("");
                setShowModal(true);
              }}
              className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90"
            >
              + Nuevo gasto
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-default-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-default-50 text-default-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Descripción</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Vencimiento</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default-100">
              {result?.items.map((expense: Expense) => (
                <tr
                  key={expense.id}
                  onClick={() => router.push(`/dashboard/expenses/${expense.id}`)}
                  className={`cursor-pointer hover:bg-default-50 transition-colors ${
                    expense.status === "PENDING"
                      ? "border-l-2 border-l-warning-400"
                      : expense.status === "OVERDUE"
                      ? "border-l-2 border-l-danger-400"
                      : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium">{expense.description}</span>
                    {(expense._count?.files ?? 0) > 0 && (
                      <span className="ml-2 text-xs text-default-400">
                        📎 {expense._count!.files}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{typeBadge(expense.type)}</td>
                  <td className="px-4 py-3 text-default-600">
                    {formatDate(expense.date)}
                  </td>
                  <td
                    className={`px-4 py-3 ${
                      expense.status === "OVERDUE"
                        ? "text-danger font-medium"
                        : "text-default-600"
                    }`}
                  >
                    {expense.dueDate ? formatDate(expense.dueDate) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="px-4 py-3">{statusBadge(expense.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Paginación ─────────────────────────────────────────────────────── */}
      {result && result.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-default-500">
          <span>
            Mostrando {result.items.length} de {result.total} gastos
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded border border-default-200 disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="px-3 py-1">
              {page} / {result.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(result.totalPages, p + 1))}
              disabled={page >= result.totalPages}
              className="px-3 py-1 rounded border border-default-200 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* ── Modal crear gasto ──────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Nuevo gasto</h2>

            {formError && (
              <div className="mb-3 rounded-lg bg-danger-50 p-3 text-sm text-danger">
                {formError}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Descripción <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Ej: Alquiler oficina, Servicio de hosting..."
                  className="w-full rounded-md border border-default-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tipo <span className="text-danger">*</span>
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({ ...form, type: e.target.value as ExpenseType })
                    }
                    className="w-full rounded-md border border-default-300 px-3 py-2 text-sm"
                  >
                    {Object.entries(EXPENSE_TYPE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Monto <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-md border border-default-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Fecha <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-md border border-default-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Vencimiento
                  </label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm({ ...form, dueDate: e.target.value })
                    }
                    className="w-full rounded-md border border-default-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Notas adicionales..."
                  className="w-full rounded-md border border-default-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-md border border-default-300 px-4 py-2 text-sm hover:bg-default-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={
                  isSaving || !form.description || !form.amount || !form.date
                }
                className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving ? "Creando..." : "Crear gasto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
