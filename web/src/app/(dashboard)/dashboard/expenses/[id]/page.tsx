"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useOrganization } from "@/lib/context/OrganizationContext";
import {
  Expense,
  ExpenseFile,
  ExpenseStatus,
  ExpenseType,
  ExpenseFileType,
  EXPENSE_STATUS_LABELS,
  EXPENSE_TYPE_LABELS,
  EXPENSE_FILE_TYPE_LABELS,
} from "@/types/expense";
import { formatCurrency, formatDate, formatFileSize, toDateInput } from "@/lib/utils/format";
import * as expensesApi from "@/lib/api/expenses";
import { useToast } from "@/lib/context/ToastContext";
import { SkeletonDetail } from "@/components/ui/Skeleton";

// Estados a los que se puede cambiar manualmente
const STATUS_TRANSITIONS: { status: ExpenseStatus; label: string; style: string }[] = [
  { status: "PENDING", label: "Marcar pendiente", style: "border-warning-400 text-warning-700 hover:bg-warning-50" },
  { status: "PAID", label: "Marcar pagado", style: "border-success-400 text-success-700 hover:bg-success-50" },
  { status: "OVERDUE", label: "Marcar vencido", style: "border-danger-400 text-danger-700 hover:bg-danger-50" },
];

const FILE_TYPE_OPTIONS: { value: ExpenseFileType; label: string }[] = [
  { value: "INVOICE", label: "Factura proveedor" },
  { value: "RECEIPT", label: "Comprobante de pago" },
  { value: "OTHER", label: "Otro" },
];

export default function ExpenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentOrg } = useOrganization();
  const { showToast } = useToast();
  const expenseId = params.id as string;

  // ── Datos ──────────────────────────────────────────────────────────────
  const [expense, setExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Modal editar ───────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    date: "",
    dueDate: "",
    type: "VARIABLE" as ExpenseType,
    notes: "",
  });
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // ── Estado del gasto ───────────────────────────────────────────────────
  const [statusLoading, setStatusLoading] = useState<ExpenseStatus | null>(null);
  const [statusError, setStatusError] = useState("");

  // ── Archivos ───────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileType, setSelectedFileType] = useState<ExpenseFileType>("INVOICE");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  // ── Modal eliminar gasto ───────────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Carga ──────────────────────────────────────────────────────────────

  const loadExpense = useCallback(async () => {
    if (!currentOrg) return;
    setIsLoading(true);
    setError("");
    try {
      const data = await expensesApi.getExpense(currentOrg.id, expenseId);
      setExpense(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar gasto");
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg, expenseId]);

  useEffect(() => {
    loadExpense();
  }, [loadExpense]);

  // ── Editar ─────────────────────────────────────────────────────────────

  const startEditing = () => {
    if (!expense) return;
    setForm({
      description: expense.description,
      amount: parseFloat(expense.amount).toFixed(2),
      date: toDateInput(expense.date),
      dueDate: toDateInput(expense.dueDate),
      type: expense.type,
      notes: expense.notes ?? "",
    });
    setFormError("");
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!currentOrg || !expense || !form.description || !form.amount || !form.date)
      return;
    setFormError("");
    setIsSaving(true);
    try {
      const updated = await expensesApi.updateExpense(currentOrg.id, expense.id, {
        description: form.description.trim(),
        amount: parseFloat(form.amount),
        date: form.date,
        dueDate: form.dueDate || null,
        type: form.type,
        notes: form.notes.trim() || undefined,
      });
      setExpense({ ...expense, ...updated, files: expense.files });
      setIsEditing(false);
      showToast("Gasto actualizado", "success");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Estado ─────────────────────────────────────────────────────────────

  const handleStatusChange = async (status: ExpenseStatus) => {
    if (!currentOrg || !expense || status === expense.status) return;
    setStatusError("");
    setStatusLoading(status);
    try {
      const updated = await expensesApi.updateExpenseStatus(
        currentOrg.id,
        expense.id,
        {
          status,
          paidAt: status === "PAID" ? new Date().toISOString() : undefined,
        },
      );
      setExpense((prev) => (prev ? { ...prev, ...updated, files: prev.files } : prev));
      showToast(`Estado cambiado a ${EXPENSE_STATUS_LABELS[status]}`, "success");
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Error al cambiar estado");
    } finally {
      setStatusLoading(null);
    }
  };

  // ── Archivos ───────────────────────────────────────────────────────────

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentOrg || !expense) return;
    e.target.value = "";

    setUploadError("");
    setIsUploading(true);
    try {
      const newFile = await expensesApi.uploadExpenseFile(
        currentOrg.id,
        expense.id,
        file,
        selectedFileType,
      );
      setExpense((prev) =>
        prev ? { ...prev, files: [newFile, ...(prev.files ?? [])] } : prev,
      );
      showToast("Archivo adjuntado correctamente", "success");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error al subir archivo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!currentOrg || !expense) return;
    setDeletingFileId(fileId);
    try {
      await expensesApi.deleteExpenseFile(currentOrg.id, expense.id, fileId);
      setExpense((prev) =>
        prev
          ? { ...prev, files: prev.files?.filter((f) => f.id !== fileId) }
          : prev,
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Error al eliminar archivo",
        "error"
      );
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleOpenFile = (file: ExpenseFile) => {
    const qs = new URLSearchParams({ key: file.fileKey, filename: file.fileName });
    window.open(`/api/files?${qs.toString()}`, "_blank", "noopener,noreferrer");
  };

  // ── Eliminar gasto ─────────────────────────────────────────────────────

  const handleDeleteExpense = async () => {
    if (!currentOrg || !expense) return;
    setIsDeleting(true);
    try {
      await expensesApi.deleteExpense(currentOrg.id, expense.id);
      router.push("/dashboard/expenses");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Error al eliminar",
        "error"
      );
      setIsDeleting(false);
    }
  };

  // ── Renders ────────────────────────────────────────────────────────────

  if (!currentOrg) {
    return <p className="text-default-500">Seleccioná una organización.</p>;
  }

  if (isLoading) {
    return <SkeletonDetail />;
  }

  if (error || !expense) {
    return (
      <div>
        <p className="text-danger">{error || "Gasto no encontrado"}</p>
        <Link
          href="/dashboard/expenses"
          className="text-primary text-sm hover:underline mt-2 inline-block"
        >
          Volver a gastos
        </Link>
      </div>
    );
  }

  const files: ExpenseFile[] = expense.files ?? [];

  const statusColor = {
    PENDING: "bg-warning-100 text-warning-700",
    PAID: "bg-success-100 text-success-700",
    OVERDUE: "bg-danger-100 text-danger-700",
  }[expense.status];

  return (
    <div className="max-w-3xl">
      {/* ── Breadcrumb ────────────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        <Link href="/dashboard/expenses" className="text-primary hover:underline">
          Gastos
        </Link>
        <span className="text-default-400">/</span>
        <span className="text-default-600">{expense.description}</span>
      </div>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{expense.description}</h1>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}
            >
              {EXPENSE_STATUS_LABELS[expense.status]}
            </span>
          </div>
          <p className="text-default-500 text-sm">
            {EXPENSE_TYPE_LABELS[expense.type]}
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
            <p className="text-xl font-bold mt-1">{formatCurrency(expense.amount)}</p>
          </div>
          <div>
            <p className="text-xs text-default-400 uppercase tracking-wide">Fecha</p>
            <p className="text-sm mt-1">{formatDate(expense.date)}</p>
          </div>
          <div>
            <p className="text-xs text-default-400 uppercase tracking-wide">Vencimiento</p>
            <p
              className={`text-sm mt-1 ${
                expense.status === "OVERDUE" ? "text-danger font-medium" : ""
              }`}
            >
              {expense.dueDate ? formatDate(expense.dueDate) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-default-400 uppercase tracking-wide">Tipo</p>
            <p className="text-sm mt-1">{EXPENSE_TYPE_LABELS[expense.type]}</p>
          </div>
          <div>
            <p className="text-xs text-default-400 uppercase tracking-wide">Fecha de pago</p>
            <p className="text-sm mt-1">
              {expense.paidAt ? formatDate(expense.paidAt) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-default-400 uppercase tracking-wide">Creado</p>
            <p className="text-sm mt-1">{formatDate(expense.createdAt)}</p>
          </div>
        </div>
        {expense.notes && (
          <div className="mt-4 pt-4 border-t border-default-100">
            <p className="text-xs text-default-400 uppercase tracking-wide">Notas</p>
            <p className="text-sm mt-1 whitespace-pre-wrap">{expense.notes}</p>
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
          {STATUS_TRANSITIONS.filter((t) => t.status !== expense.status).map((t) => (
            <button
              key={t.status}
              type="button"
              onClick={() => handleStatusChange(t.status)}
              disabled={statusLoading !== null}
              className={`rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 ${t.style}`}
            >
              {statusLoading === t.status ? "Guardando..." : t.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-default-400 mt-2">
          Estado actual:{" "}
          <strong>{EXPENSE_STATUS_LABELS[expense.status]}</strong>
          {expense.paidAt && ` — Pagado el ${formatDate(expense.paidAt)}`}
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
          <div className="flex items-center gap-2">
            <select
              value={selectedFileType}
              onChange={(e) => setSelectedFileType(e.target.value as ExpenseFileType)}
              className="rounded-md border border-default-300 px-2 py-1 text-xs"
            >
              {FILE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
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
              {isUploading ? "Subiendo..." : "+ Adjuntar"}
            </button>
          </div>
        </div>

        {uploadError && (
          <p className="text-sm text-danger mb-3">{uploadError}</p>
        )}

        {files.length === 0 ? (
          <p className="text-sm text-default-400">
            No hay archivos adjuntos. Podés adjuntar facturas del proveedor,
            comprobantes de pago u otros documentos.
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
                      <span className="rounded-full bg-default-100 px-1.5 py-0.5 mr-1">
                        {EXPENSE_FILE_TYPE_LABELS[file.type]}
                      </span>
                      {formatFileSize(file.fileSize)} · {formatDate(file.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenFile(file)}
                    className="text-xs text-primary hover:underline"
                  >
                    Ver / Descargar
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
            <h2 className="text-lg font-semibold mb-4">Editar gasto</h2>

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
                    value={form.amount}
                    onChange={(e) =>
                      setForm({ ...form, amount: e.target.value })
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
                  isSaving || !form.description || !form.amount || !form.date
                }
                className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal eliminar gasto ──────────────────────────────────────────── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-2">Eliminar gasto</h2>
            <p className="text-sm text-default-500 mb-1">
              ¿Eliminar{" "}
              <strong>{expense.description}</strong> por{" "}
              <strong>{formatCurrency(expense.amount)}</strong>?
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
                onClick={handleDeleteExpense}
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
