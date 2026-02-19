"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useOrganization } from "@/lib/context/OrganizationContext";
import { useToast } from "@/lib/context/ToastContext";
import { Client, ClientsPage } from "@/types/client";
import * as clientsApi from "@/lib/api/clients";
import { SkeletonTable } from "@/components/ui/Skeleton";

export default function ClientsListPage() {
  const { currentOrg } = useOrganization();
  const { showToast } = useToast();
  const [data, setData] = useState<ClientsPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formName, setFormName] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirm
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadClients = useCallback(async () => {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const result = await clientsApi.listClients(currentOrg.id, {
        page,
        search: search || undefined,
      });
      setData(result);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Error al cargar clientes",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg, page, search, showToast]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Debounce search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const openCreateForm = () => {
    setEditingClient(null);
    setFormName("");
    setFormCompany("");
    setFormEmail("");
    setFormPhone("");
    setFormNotes("");
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (client: Client) => {
    setEditingClient(client);
    setFormName(client.name);
    setFormCompany(client.company || "");
    setFormEmail(client.email || "");
    setFormPhone(client.phone || "");
    setFormNotes(client.notes || "");
    setFormError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!currentOrg || !formName.trim()) return;
    setFormError("");
    setIsSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        company: formCompany.trim() || undefined,
        email: formEmail.trim() || undefined,
        phone: formPhone.trim() || undefined,
        notes: formNotes.trim() || undefined,
      };
      if (editingClient) {
        await clientsApi.updateClient(currentOrg.id, editingClient.id, payload);
        showToast("Cliente actualizado correctamente", "success");
      } else {
        await clientsApi.createClient(currentOrg.id, payload);
        showToast("Cliente creado correctamente", "success");
      }
      setShowForm(false);
      await loadClients();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentOrg || !deletingClient) return;
    setIsDeleting(true);
    try {
      await clientsApi.deleteClient(currentOrg.id, deletingClient.id);
      showToast("Cliente eliminado", "success");
      setDeletingClient(null);
      await loadClients();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Error al eliminar",
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (!currentOrg) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="mt-2 text-default-500">Seleccioná una organización.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90"
        >
          + Nuevo cliente
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, empresa o email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full max-w-md rounded-md border border-default-300 px-3 py-2 text-sm"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : data && data.items.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-default-200 text-left">
                  <th className="pb-2 pr-4 font-medium text-default-600">Nombre</th>
                  <th className="pb-2 pr-4 font-medium text-default-600 hidden sm:table-cell">Empresa</th>
                  <th className="pb-2 pr-4 font-medium text-default-600 hidden md:table-cell">Email</th>
                  <th className="pb-2 pr-4 font-medium text-default-600 hidden lg:table-cell">Teléfono</th>
                  <th className="pb-2 font-medium text-default-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b border-default-100 hover:bg-default-50"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/dashboard/clients/${client.id}`}
                        className="text-primary hover:underline"
                      >
                        {client.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-default-500 hidden sm:table-cell">
                      {client.company || "-"}
                    </td>
                    <td className="py-3 pr-4 text-default-500 hidden md:table-cell">
                      {client.email || "-"}
                    </td>
                    <td className="py-3 pr-4 text-default-500 hidden lg:table-cell">
                      {client.phone || "-"}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(client)}
                          className="text-xs text-primary hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingClient(client)}
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
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded border border-default-300 px-3 py-1 text-sm disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm text-default-500">
                Página {data.page} de {data.totalPages} ({data.total} clientes)
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
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-4">👥</div>
          <h3 className="text-lg font-semibold mb-1">
            {search ? "Sin resultados" : "Todavía no hay clientes"}
          </h3>
          <p className="text-sm text-default-500 mb-4">
            {search
              ? "No se encontraron clientes con ese criterio de búsqueda."
              : "Empezá agregando tu primer cliente."}
          </p>
          {!search && (
            <button
              type="button"
              onClick={openCreateForm}
              className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90"
            >
              + Nuevo cliente
            </button>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-4">
              {editingClient ? "Editar cliente" : "Nuevo cliente"}
            </h2>
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
                  placeholder="Nombre del cliente"
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
                  placeholder="Nombre de la empresa"
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
                    placeholder="email@ejemplo.com"
                    className="w-full rounded-md border border-default-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+54 11 1234-5678"
                    className="w-full rounded-md border border-default-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Notas adicionales..."
                  rows={3}
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
                disabled={isSaving || !formName.trim()}
                className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving ? "Guardando..." : editingClient ? "Guardar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deletingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-2">Eliminar cliente</h2>
            <p className="text-sm text-default-500 mb-4">
              ¿Estás seguro de que querés eliminar a{" "}
              <strong>{deletingClient.name}</strong>? Esta acción no se puede
              deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingClient(null)}
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
