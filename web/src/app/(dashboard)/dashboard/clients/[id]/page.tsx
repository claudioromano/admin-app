"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useOrganization } from "@/lib/context/OrganizationContext";
import { useToast } from "@/lib/context/ToastContext";
import { Client } from "@/types/client";
import * as clientsApi from "@/lib/api/clients";
import { SkeletonDetail } from "@/components/ui/Skeleton";

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentOrg } = useOrganization();
  const { showToast } = useToast();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadClient = useCallback(async () => {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const data = await clientsApi.getClient(currentOrg.id, clientId);
      setClient(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar cliente");
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg, clientId]);

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  const startEditing = () => {
    if (!client) return;
    setFormName(client.name);
    setFormCompany(client.company || "");
    setFormEmail(client.email || "");
    setFormPhone(client.phone || "");
    setFormNotes(client.notes || "");
    setFormError("");
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!currentOrg || !client || !formName.trim()) return;
    setFormError("");
    setIsSaving(true);
    try {
      const updated = await clientsApi.updateClient(currentOrg.id, client.id, {
        name: formName.trim(),
        company: formCompany.trim() || undefined,
        email: formEmail.trim() || undefined,
        phone: formPhone.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });
      setClient(updated);
      setIsEditing(false);
      showToast("Cliente actualizado", "success");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentOrg || !client) return;
    setIsDeleting(true);
    try {
      await clientsApi.deleteClient(currentOrg.id, client.id);
      router.push("/dashboard/clients");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Error al eliminar",
        "error"
      );
      setIsDeleting(false);
    }
  };

  if (!currentOrg) {
    return <p className="text-default-500">Seleccioná una organización.</p>;
  }

  if (isLoading) {
    return <SkeletonDetail />;
  }

  if (error || !client) {
    return (
      <div>
        <p className="text-danger">{error || "Cliente no encontrado"}</p>
        <Link href="/dashboard/clients" className="text-primary text-sm hover:underline mt-2 inline-block">
          Volver a clientes
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link
          href="/dashboard/clients"
          className="text-sm text-primary hover:underline"
        >
          Clientes
        </Link>
        <span className="text-sm text-default-400 mx-2">/</span>
        <span className="text-sm text-default-600">{client.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">{client.name}</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={startEditing}
            className="rounded-md border border-default-300 px-4 py-2 text-sm hover:bg-default-100"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-md border border-danger text-danger px-4 py-2 text-sm hover:bg-danger-50"
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Detail card */}
      <div className="rounded-lg border border-default-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-default-400 uppercase tracking-wide">Empresa</p>
            <p className="text-sm mt-1">{client.company || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-default-400 uppercase tracking-wide">Email</p>
            <p className="text-sm mt-1">{client.email || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-default-400 uppercase tracking-wide">Teléfono</p>
            <p className="text-sm mt-1">{client.phone || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-default-400 uppercase tracking-wide">Facturas</p>
            <p className="text-sm mt-1">{client._count?.invoices ?? 0}</p>
          </div>
        </div>
        {client.notes && (
          <div className="mt-4 pt-4 border-t border-default-100">
            <p className="text-xs text-default-400 uppercase tracking-wide">Notas</p>
            <p className="text-sm mt-1 whitespace-pre-wrap">{client.notes}</p>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-default-100 text-xs text-default-400">
          Creado: {new Date(client.createdAt).toLocaleDateString("es-AR")}
          {" · "}
          Actualizado: {new Date(client.updatedAt).toLocaleDateString("es-AR")}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Editar cliente</h2>
            {formError && (
              <div className="mb-3 rounded-lg bg-danger-50 p-3 text-sm text-danger">
                {formError}
              </div>
            )}
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nombre <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-md border border-default-300 px-3 py-2 text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Empresa</label>
                <input
                  type="text"
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  className="w-full rounded-md border border-default-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full rounded-md border border-default-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full rounded-md border border-default-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
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
                disabled={isSaving || !formName.trim()}
                className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-2">Eliminar cliente</h2>
            <p className="text-sm text-default-500 mb-4">
              ¿Estás seguro de que querés eliminar a{" "}
              <strong>{client.name}</strong>? Esta acción no se puede deshacer.
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
