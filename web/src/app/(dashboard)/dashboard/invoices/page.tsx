"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useOrganization } from "@/lib/context/OrganizationContext";
import type { Invoice, InvoiceStatus } from "@/types/invoice";
import type { InvoicesPage as InvoicesPageData } from "@/types/invoice";
import { INVOICE_STATUS_LABELS } from "@/types/invoice";
import { Client } from "@/types/client";
import { PaymentAccount } from "@/types/payment-account";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import { formatCurrency, formatDate, toDateInput } from "@/lib/utils/format";
import * as invoicesApi from "@/lib/api/invoices";
import * as clientsApi from "@/lib/api/clients";
import * as paymentAccountsApi from "@/lib/api/payment-accounts";

const STATUSES: InvoiceStatus[] = ["PENDING", "PAID", "OVERDUE", "CANCELLED"];

const EMPTY_FORM = {
  clientId: "",
  paymentAccountId: "",
  number: "",
  description: "",
  amount: "",
  date: "",
  dueDate: "",
};

export default function InvoicesPage() {
  const { currentOrg } = useOrganization();

  // ── Lista ──────────────────────────────────────────────────────────────
  const [data, setData] = useState<InvoicesPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  // ── Filtros ────────────────────────────────────────────────────────────
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | "">("");
  const [filterClientId, setFilterClientId] = useState("");
  const [filterMonth, setFilterMonth] = useState(""); // YYYY-MM

  // ── Resumen de pendientes ──────────────────────────────────────────────
  const [pendingCount, setPendingCount] = useState(0);

  // ── Selectores (form) ──────────────────────────────────────────────────
  const [clients, setClients] = useState<Client[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);

  // ── Modal crear/editar ─────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // ── Modal eliminar ─────────────────────────────────────────────────────
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────

  /** Convierte YYYY-MM a dateFrom / dateTo */
  function monthToRange(month: string): { dateFrom?: string; dateTo?: string } {
    if (!month) return {};
    const [y, m] = month.split("-").map(Number);
    const from = new Date(Date.UTC(y, m - 1, 1));
    const to = new Date(Date.UTC(y, m, 0)); // último día del mes
    return {
      dateFrom: from.toISOString().split("T")[0],
      dateTo: to.toISOString().split("T")[0],
    };
  }

  // ── Carga de datos ─────────────────────────────────────────────────────

  const loadInvoices = useCallback(async () => {
    if (!currentOrg) return;
    setIsLoading(true);
    setError("");
    try {
      const range = monthToRange(filterMonth);
      const result = await invoicesApi.listInvoices(currentOrg.id, {
        page,
        status: filterStatus || undefined,
        clientId: filterClientId || undefined,
        ...range,
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg, page, filterStatus, filterClientId, filterMonth]);

  const loadSupportData = useCallback(async () => {
    if (!currentOrg) return;
    try {
      const [clientsRes, accountsRes, pendingRes] = await Promise.all([
        clientsApi.listClients(currentOrg.id, { limit: 100 }),
        paymentAccountsApi.listOrgPaymentAccounts(currentOrg.id),
        invoicesApi.listInvoices(currentOrg.id, { status: "PENDING", limit: 1 }),
      ]);
      setClients(clientsRes.items);
      setPaymentAccounts(accountsRes);
      setPendingCount(pendingRes.total);
    } catch {
      /* ignorar errores de soporte */
    }
  }, [currentOrg]);

  useEffect(() => {
    loadSupportData();
  }, [loadSupportData]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // ── Formulario ─────────────────────────────────────────────────────────

  const openCreateForm = () => {
    setEditingInvoice(null);
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().split("T")[0] });
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setForm({
      clientId: invoice.clientId,
      paymentAccountId: invoice.paymentAccountId ?? "",
      number: invoice.number ?? "",
      description: invoice.description ?? "",
      amount: parseFloat(invoice.amount).toFixed(2),
      date: toDateInput(invoice.date),
      dueDate: toDateInput(invoice.dueDate),
    });
    setFormError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!currentOrg || !form.clientId || !form.amount || !form.date) return;
    setFormError("");
    setIsSaving(true);
    try {
      const payload = {
        clientId: form.clientId,
        paymentAccountId: form.paymentAccountId || undefined,
        number: form.number.trim() || undefined,
        description: form.description.trim() || undefined,
        amount: parseFloat(form.amount),
        date: form.date,
        dueDate: form.dueDate || undefined,
      };
      if (editingInvoice) {
        await invoicesApi.updateInvoice(currentOrg.id, editingInvoice.id, payload);
      } else {
        await invoicesApi.createInvoice(currentOrg.id, payload);
      }
      setShowForm(false);
      await loadInvoices();
      await loadSupportData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentOrg || !deletingInvoice) return;
    setIsDeleting(true);
    try {
      await invoicesApi.deleteInvoice(currentOrg.id, deletingInvoice.id);
      setDeletingInvoice(null);
      await loadInvoices();
      await loadSupportData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setIsDeleting(false);
    }
  };

  const resetFilters = () => {
    setFilterStatus("");
    setFilterClientId("");
    setFilterMonth("");
    setPage(1);
  };

  const hasFilters = filterStatus || filterClientId || filterMonth;

  if (!currentOrg) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Facturas</h1>
        <p className="mt-2 text-default-500">Seleccioná una organización.</p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Facturas</h1>
        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90"
        >
          + Nueva factura
        </button>
      </div>

      {/* ── Alert pendientes ─────────────────────────────────────────────── */}
      {pendingCount > 0 && (
        <button
          type="button"
          onClick={() => {
            setFilterStatus("PENDING");
            setPage(1);
          }}
          className="w-full text-left mb-4 flex items-center gap-3 rounded-lg border border-warning-300 bg-warning-50 px-4 py-3 hover:bg-warning-100 transition-colors"
        >
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-warning-800">
              {pendingCount === 1
                ? "1 factura pendiente de cobro"
                : `${pendingCount} facturas pendientes de cobro`}
            </p>
            <p className="text-xs text-warning-600">
              Hacé clic para ver solo las pendientes
            </p>
          </div>
        </button>
      )}

      {/* ── Filtros ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Estado */}
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value as InvoiceStatus | "");
            setPage(1);
          }}
          className="rounded-md border border-default-300 px-3 py-1.5 text-sm bg-white"
        >
          <option value="">Todos los estados</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {INVOICE_STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        {/* Cliente */}
        {clients.length > 0 && (
          <select
            value={filterClientId}
            onChange={(e) => {
              setFilterClientId(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-default-300 px-3 py-1.5 text-sm bg-white"
          >
            <option value="">Todos los clientes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.company ? ` — ${c.company}` : ""}
              </option>
            ))}
          </select>
        )}

        {/* Mes */}
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => {
            setFilterMonth(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-default-300 px-3 py-1.5 text-sm bg-white"
        />

        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-md border border-default-300 px-3 py-1.5 text-sm hover:bg-default-100"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-4 rounded-lg bg-danger-50 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* ── Tabla ────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <p className="text-default-500">Cargando...</p>
      ) : data && data.items.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-default-200 text-left">
                  <th className="pb-2 pr-3 font-medium text-default-600">#</th>
                  <th className="pb-2 pr-3 font-medium text-default-600">Cliente</th>
                  <th className="pb-2 pr-3 font-medium text-default-600">Monto</th>
                  <th className="pb-2 pr-3 font-medium text-default-600">Fecha</th>
                  <th className="pb-2 pr-3 font-medium text-default-600">Vencimiento</th>
                  <th className="pb-2 pr-3 font-medium text-default-600">Estado</th>
                  <th className="pb-2 font-medium text-default-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className={`border-b border-default-100 hover:bg-default-50 ${
                      invoice.status === "PENDING"
                        ? "border-l-2 border-l-warning-400"
                        : invoice.status === "OVERDUE"
                        ? "border-l-2 border-l-danger-400"
                        : ""
                    }`}
                  >
                    <td className="py-3 pr-3 text-default-400 font-mono text-xs">
                      {invoice.number || "—"}
                    </td>
                    <td className="py-3 pr-3">
                      <Link
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {invoice.client?.name ?? "—"}
                      </Link>
                      {invoice.client?.company && (
                        <p className="text-xs text-default-400">
                          {invoice.client.company}
                        </p>
                      )}
                    </td>
                    <td className="py-3 pr-3 font-semibold tabular-nums">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="py-3 pr-3 text-default-500">
                      {formatDate(invoice.date)}
                    </td>
                    <td className="py-3 pr-3 text-default-500">
                      {invoice.dueDate ? (
                        <span
                          className={
                            invoice.status === "OVERDUE"
                              ? "text-danger font-medium"
                              : ""
                          }
                        >
                          {formatDate(invoice.dueDate)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/invoices/${invoice.id}`}
                          className="text-xs text-primary hover:underline"
                        >
                          Ver
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEditForm(invoice)}
                          className="text-xs text-default-600 hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingInvoice(invoice)}
                          className="text-xs text-danger hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded border border-default-300 px-3 py-1 text-sm disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm text-default-500">
                Página {data.page} de {data.totalPages} ({data.total} facturas)
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="rounded border border-default-300 px-3 py-1 text-sm disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="text-default-500">
          {hasFilters
            ? "No hay facturas con los filtros aplicados."
            : "No hay facturas aún. Creá la primera."}
        </p>
      )}

      {/* ── Modal crear/editar ────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {editingInvoice ? "Editar factura" : "Nueva factura"}
            </h2>

            {formError && (
              <div className="mb-3 rounded-lg bg-danger-50 p-3 text-sm text-danger">
                {formError}
              </div>
            )}

            <div className="flex flex-col gap-3">
              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Cliente <span className="text-danger">*</span>
                </label>
                <select
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  className="w-full rounded-md border border-default-300 px-3 py-2 text-sm"
                >
                  <option value="">Seleccioná un cliente...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.company ? ` — ${c.company}` : ""}
                    </option>
                  ))}
                </select>
                {clients.length === 0 && (
                  <p className="text-xs text-warning-600 mt-1">
                    No hay clientes. Creá uno primero.
                  </p>
                )}
              </div>

              {/* Cuenta de cobro */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Cuenta de cobro
                </label>
                <select
                  value={form.paymentAccountId}
                  onChange={(e) =>
                    setForm({ ...form, paymentAccountId: e.target.value })
                  }
                  className="w-full rounded-md border border-default-300 px-3 py-2 text-sm"
                >
                  <option value="">Sin cuenta asignada</option>
                  {paymentAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                      {a.alias ? ` — ${a.alias}` : ""}
                    </option>
                  ))}
                </select>
                {paymentAccounts.length === 0 && (
                  <p className="text-xs text-default-400 mt-1">
                    No hay cuentas vinculadas a esta organización.
                  </p>
                )}
              </div>

              {/* Número y monto */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Número de factura
                  </label>
                  <input
                    type="text"
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: e.target.value })}
                    placeholder="Ej: 0001-00000123"
                    className="w-full rounded-md border border-default-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Monto <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full rounded-md border border-default-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Fecha de emisión <span className="text-danger">*</span>
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

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Descripción
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Detalle de los servicios o productos..."
                  rows={2}
                  className="w-full rounded-md border border-default-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-md border border-default-300 px-4 py-2 text-sm hover:bg-default-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={
                  isSaving ||
                  !form.clientId ||
                  !form.amount ||
                  !form.date ||
                  parseFloat(form.amount) < 0
                }
                className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving
                  ? "Guardando..."
                  : editingInvoice
                  ? "Guardar"
                  : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal eliminar ────────────────────────────────────────────────── */}
      {deletingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-2">Eliminar factura</h2>
            <p className="text-sm text-default-500 mb-1">
              ¿Eliminar la factura de{" "}
              <strong>{deletingInvoice.client?.name}</strong> por{" "}
              <strong>{formatCurrency(deletingInvoice.amount)}</strong>?
            </p>
            <p className="text-xs text-default-400 mb-4">
              Se eliminarán también todos los archivos adjuntos. Esta acción no
              se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingInvoice(null)}
                className="rounded-md border border-default-300 px-4 py-2 text-sm hover:bg-default-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-md bg-danger px-4 py-2 text-sm text-white hover:bg-danger/90 disabled:opacity-50"
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
