"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useOrganization } from "@/lib/context/OrganizationContext";
import { Invoice, InvoiceFile, InvoiceStatus, INVOICE_STATUS_LABELS } from "@/types/invoice";
import { Client } from "@/types/client";
import { PaymentAccount } from "@/types/payment-account";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import { formatCurrency, formatDate, formatFileSize, toDateInput } from "@/lib/utils/format";
import * as invoicesApi from "@/lib/api/invoices";
import * as clientsApi from "@/lib/api/clients";
import * as paymentAccountsApi from "@/lib/api/payment-accounts";

// Estados a los que se puede cambiar manualmente
const STATUS_TRANSITIONS: { status: InvoiceStatus; label: string; style: string }[] = [
  { status: "PENDING", label: "Marcar pendiente", style: "border-warning-400 text-warning-700 hover:bg-warning-50" },
  { status: "PAID", label: "Marcar cobrada", style: "border-success-400 text-success-700 hover:bg-success-50" },
  { status: "OVERDUE", label: "Marcar vencida", style: "border-danger-400 text-danger-700 hover:bg-danger-50" },
  { status: "CANCELLED", label: "Anular", style: "border-default-400 text-default-600 hover:bg-default-50" },
];

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentOrg } = useOrganization();
  const invoiceId = params.id as string;

  // ── Datos ──────────────────────────────────────────────────────────────
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Formularios auxiliares ─────────────────────────────────────────────
  const [clients, setClients] = useState<Client[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);

  // ── Modal editar ───────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    clientId: "",
    paymentAccountId: "",
    number: "",
    description: "",
    amount: "",
    date: "",
    dueDate: "",
  });
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // ── Estado de la factura ───────────────────────────────────────────────
  const [statusLoading, setStatusLoading] = useState<InvoiceStatus | null>(null);
  const [statusError, setStatusError] = useState("");

  // ── Archivos ───────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [openingFileId, setOpeningFileId] = useState<string | null>(null);

  // ── Modal eliminar factura ─────────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Carga ──────────────────────────────────────────────────────────────

  const loadInvoice = useCallback(async () => {
    if (!currentOrg) return;
    setIsLoading(true);
    setError("");
    try {
      const data = await invoicesApi.getInvoice(currentOrg.id, invoiceId);
      setInvoice(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar factura");
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg, invoiceId]);

  const loadSupport = useCallback(async () => {
    if (!currentOrg) return;
    try {
      const [clientsRes, accountsRes] = await Promise.all([
        clientsApi.listClients(currentOrg.id, { limit: 100 }),
        paymentAccountsApi.listOrgPaymentAccounts(currentOrg.id),
      ]);
      setClients(clientsRes.items);
      setPaymentAccounts(accountsRes);
    } catch {
      /* ignorar */
    }
  }, [currentOrg]);

  useEffect(() => {
    loadInvoice();
    loadSupport();
  }, [loadInvoice, loadSupport]);

  // ── Editar ─────────────────────────────────────────────────────────────

  const startEditing = () => {
    if (!invoice) return;
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
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!currentOrg || !invoice || !form.clientId || !form.amount || !form.date) return;
    setFormError("");
    setIsSaving(true);
    try {
      const updated = await invoicesApi.updateInvoice(currentOrg.id, invoice.id, {
        clientId: form.clientId,
        paymentAccountId: form.paymentAccountId || null,
        number: form.number.trim() || undefined,
        description: form.description.trim() || undefined,
        amount: parseFloat(form.amount),
        date: form.date,
        dueDate: form.dueDate || null,
      });
      setInvoice({ ...invoice, ...updated, files: invoice.files });
      setIsEditing(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Estado ─────────────────────────────────────────────────────────────

  const handleStatusChange = async (status: InvoiceStatus) => {
    if (!currentOrg || !invoice || status === invoice.status) return;
    setStatusError("");
    setStatusLoading(status);
    try {
      const updated = await invoicesApi.updateInvoiceStatus(currentOrg.id, invoice.id, {
        status,
        paidAt: status === "PAID" ? new Date().toISOString() : undefined,
      });
      setInvoice((prev) => prev ? { ...prev, ...updated, files: prev.files } : prev);
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Error al cambiar estado");
    } finally {
      setStatusLoading(null);
    }
  };

  // ── Archivos ───────────────────────────────────────────────────────────

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentOrg || !invoice) return;
    e.target.value = "";

    setUploadError("");
    setIsUploading(true);
    try {
      const newFile = await invoicesApi.uploadInvoiceFile(currentOrg.id, invoice.id, file);
      setInvoice((prev) =>
        prev ? { ...prev, files: [newFile, ...(prev.files ?? [])] } : prev,
      );
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error al subir archivo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!currentOrg || !invoice) return;
    setDeletingFileId(fileId);
    try {
      await invoicesApi.deleteInvoiceFile(currentOrg.id, invoice.id, fileId);
      setInvoice((prev) =>
        prev
          ? { ...prev, files: prev.files?.filter((f) => f.id !== fileId) }
          : prev,
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar archivo");
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleOpenFile = async (file: InvoiceFile) => {
    setOpeningFileId(file.id);
    try {
      const url = await invoicesApi.getFileUrl(file.fileKey);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      alert("No se pudo obtener la URL del archivo");
    } finally {
      setOpeningFileId(null);
    }
  };

  // ── Eliminar factura ───────────────────────────────────────────────────

  const handleDeleteInvoice = async () => {
    if (!currentOrg || !invoice) return;
    setIsDeleting(true);
    try {
      await invoicesApi.deleteInvoice(currentOrg.id, invoice.id);
      router.push("/dashboard/invoices");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar");
      setIsDeleting(false);
    }
  };

  // ── Renders ────────────────────────────────────────────────────────────

  if (!currentOrg) {
    return <p className="text-default-500">Seleccioná una organización.</p>;
  }

  if (isLoading) {
    return <p className="text-default-500">Cargando...</p>;
  }

  if (error || !invoice) {
    return (
      <div>
        <p className="text-danger">{error || "Factura no encontrada"}</p>
        <Link
          href="/dashboard/invoices"
          className="text-primary text-sm hover:underline mt-2 inline-block"
        >
          Volver a facturas
        </Link>
      </div>
    );
  }

  const files: InvoiceFile[] = invoice.files ?? [];

  return (
    <div className="max-w-3xl">
      {/* ── Breadcrumb ────────────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        <Link href="/dashboard/invoices" className="text-primary hover:underline">
          Facturas
        </Link>
        <span className="text-default-400">/</span>
        <span className="text-default-600">
          {invoice.number
            ? `Factura ${invoice.number}`
            : invoice.client?.name
            ? `${invoice.client.name}`
            : "Detalle"}
        </span>
      </div>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">
              {invoice.number ? `Factura ${invoice.number}` : "Factura sin número"}
            </h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="text-default-500 text-sm">
            {invoice.client?.name}
            {invoice.client?.company ? ` — ${invoice.client.company}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={startEditing}
            className="rounded-md border border-default-300 px-3 py-1.5 text-sm hover:bg-default-100"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-md border border-danger text-danger px-3 py-1.5 text-sm hover:bg-danger-50"
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* ── Detalle ───────────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-default-200 p-5 mb-5">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-default-400 uppercase tracking-wide">Monto</p>
            <p className="text-xl font-bold mt-1">{formatCurrency(invoice.amount)}</p>
          </div>
          <div>
            <p className="text-xs text-default-400 uppercase tracking-wide">Fecha de emisión</p>
            <p className="text-sm mt-1">{formatDate(invoice.date)}</p>
          </div>
          <div>
            <p className="text-xs text-default-400 uppercase tracking-wide">Vencimiento</p>
            <p className={`text-sm mt-1 ${invoice.status === "OVERDUE" ? "text-danger font-medium" : ""}`}>
              {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-default-400 uppercase tracking-wide">Cuenta de cobro</p>
            <p className="text-sm mt-1">
              {invoice.paymentAccount
                ? `${invoice.paymentAccount.name}${invoice.paymentAccount.alias ? ` (${invoice.paymentAccount.alias})` : ""}`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-default-400 uppercase tracking-wide">Fecha de cobro</p>
            <p className="text-sm mt-1">
              {invoice.paidAt ? formatDate(invoice.paidAt) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-default-400 uppercase tracking-wide">Creada</p>
            <p className="text-sm mt-1">{formatDate(invoice.createdAt)}</p>
          </div>
        </div>
        {invoice.description && (
          <div className="mt-4 pt-4 border-t border-default-100">
            <p className="text-xs text-default-400 uppercase tracking-wide">Descripción</p>
            <p className="text-sm mt-1 whitespace-pre-wrap">{invoice.description}</p>
          </div>
        )}
      </div>

      {/* ── Cambio de estado ─────────────────────────────────────────────── */}
      <div className="rounded-lg border border-default-200 p-5 mb-5">
        <h2 className="text-sm font-semibold mb-3">Cambiar estado</h2>
        {statusError && (
          <p className="text-sm text-danger mb-2">{statusError}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {STATUS_TRANSITIONS.filter((t) => t.status !== invoice.status).map(
            (t) => (
              <button
                key={t.status}
                type="button"
                onClick={() => handleStatusChange(t.status)}
                disabled={statusLoading !== null}
                className={`rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 ${t.style}`}
              >
                {statusLoading === t.status
                  ? "Guardando..."
                  : t.label}
              </button>
            ),
          )}
        </div>
        <p className="text-xs text-default-400 mt-2">
          Estado actual:{" "}
          <strong>{INVOICE_STATUS_LABELS[invoice.status]}</strong>
          {invoice.paidAt && ` — Cobrada el ${formatDate(invoice.paidAt)}`}
        </p>
      </div>

      {/* ── Archivos adjuntos ─────────────────────────────────────────────── */}
      <div className="rounded-lg border border-default-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">
            Archivos adjuntos
            {files.length > 0 && (
              <span className="ml-2 text-default-400 font-normal">
                ({files.length})
              </span>
            )}
          </h2>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept="*/*"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="rounded-md bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {isUploading ? "Subiendo..." : "+ Adjuntar archivo"}
            </button>
          </div>
        </div>

        {uploadError && (
          <p className="text-sm text-danger mb-3">{uploadError}</p>
        )}

        {files.length === 0 ? (
          <p className="text-sm text-default-400">
            No hay archivos adjuntos. Adjuntá comprobantes, presupuestos u otros documentos.
          </p>
        ) : (
          <ul className="divide-y divide-default-100">
            {files.map((file) => (
              <li
                key={file.id}
                className="flex items-center justify-between py-2.5 gap-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg shrink-0">
                    {file.mimeType.startsWith("image/")
                      ? "🖼️"
                      : file.mimeType === "application/pdf"
                      ? "📄"
                      : "📎"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.fileName}</p>
                    <p className="text-xs text-default-400">
                      {formatFileSize(file.fileSize)} ·{" "}
                      {formatDate(file.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenFile(file)}
                    disabled={openingFileId === file.id}
                    className="text-xs text-primary hover:underline disabled:opacity-50"
                  >
                    {openingFileId === file.id ? "Abriendo..." : "Ver / Descargar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteFile(file.id)}
                    disabled={deletingFileId === file.id}
                    className="text-xs text-danger hover:underline disabled:opacity-50"
                  >
                    {deletingFileId === file.id ? "..." : "Eliminar"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Modal editar ─────────────────────────────────────────────────── */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Editar factura</h2>

            {formError && (
              <div className="mb-3 rounded-lg bg-danger-50 p-3 text-sm text-danger">
                {formError}
              </div>
            )}

            <div className="flex flex-col gap-3">
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
              </div>

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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Número de factura
                  </label>
                  <input
                    type="text"
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: e.target.value })}
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
                    className="w-full rounded-md border border-default-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

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

              <div>
                <label className="block text-sm font-medium mb-1">
                  Descripción
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                  className="w-full rounded-md border border-default-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
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
                  !form.date
                }
                className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal eliminar factura ────────────────────────────────────────── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-2">Eliminar factura</h2>
            <p className="text-sm text-default-500 mb-1">
              ¿Eliminar esta factura por{" "}
              <strong>{formatCurrency(invoice.amount)}</strong>?
            </p>
            <p className="text-xs text-default-400 mb-4">
              También se eliminarán todos los archivos adjuntos. Esta acción no
              se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-md border border-default-300 px-4 py-2 text-sm hover:bg-default-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteInvoice}
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
