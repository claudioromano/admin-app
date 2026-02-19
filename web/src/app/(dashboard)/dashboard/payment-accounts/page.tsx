"use client";

import { useState, useEffect, useCallback } from "react";
import { useOrganization } from "@/lib/context/OrganizationContext";
import {
  PaymentAccount,
  PaymentAccountType,
  PAYMENT_ACCOUNT_TYPE_LABELS,
  CreatePaymentAccountData,
} from "@/types/payment-account";
import * as api from "@/lib/api/payment-accounts";
import { useToast } from "@/lib/context/ToastContext";

const ACCOUNT_TYPES: PaymentAccountType[] = [
  "BANK",
  "VIRTUAL_WALLET",
  "CRYPTO",
  "OTHER",
];

const EMPTY_FORM = {
  name: "",
  holder: "",
  type: "BANK" as PaymentAccountType,
  description: "",
  alias: "",
};

export default function PaymentAccountsPage() {
  const { currentOrg } = useOrganization();
  const { showToast } = useToast();

  // ── Mis cuentas ───────────────────────────────────────────────────────────
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [accountsError, setAccountsError] = useState("");

  // ── Cuentas vinculadas a la org ───────────────────────────────────────────
  const [orgAccounts, setOrgAccounts] = useState<PaymentAccount[]>([]);
  const [isLoadingOrgAccounts, setIsLoadingOrgAccounts] = useState(false);

  // ── Modal crear/editar ────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(
    null
  );
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // ── Modal eliminar ────────────────────────────────────────────────────────
  const [deletingAccount, setDeletingAccount] =
    useState<PaymentAccount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Vinculación ───────────────────────────────────────────────────────────
  const [isLinking, setIsLinking] = useState<string | null>(null);
  const [isUnlinking, setIsUnlinking] = useState<string | null>(null);
  const [linkError, setLinkError] = useState("");

  const loadAccounts = useCallback(async () => {
    setIsLoadingAccounts(true);
    setAccountsError("");
    try {
      const data = await api.listPaymentAccounts();
      setAccounts(data);
    } catch (err) {
      setAccountsError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setIsLoadingAccounts(false);
    }
  }, []);

  const loadOrgAccounts = useCallback(async () => {
    if (!currentOrg) return;
    setIsLoadingOrgAccounts(true);
    try {
      const data = await api.listOrgPaymentAccounts(currentOrg.id);
      setOrgAccounts(data);
    } catch {
      setOrgAccounts([]);
    } finally {
      setIsLoadingOrgAccounts(false);
    }
  }, [currentOrg]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    loadOrgAccounts();
  }, [loadOrgAccounts]);

  // ── Form handlers ─────────────────────────────────────────────────────────

  const openCreateForm = () => {
    setEditingAccount(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (account: PaymentAccount) => {
    setEditingAccount(account);
    setForm({
      name: account.name,
      holder: account.holder,
      type: account.type,
      description: account.description || "",
      alias: account.alias || "",
    });
    setFormError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.holder.trim()) return;
    setFormError("");
    setIsSaving(true);
    try {
      const payload: CreatePaymentAccountData = {
        name: form.name.trim(),
        holder: form.holder.trim(),
        type: form.type,
        description: form.description.trim() || undefined,
        alias: form.alias.trim() || undefined,
      };
      if (editingAccount) {
        await api.updatePaymentAccount(editingAccount.id, payload);
      } else {
        await api.createPaymentAccount(payload);
      }
      setShowForm(false);
      await loadAccounts();
      // If linked to current org, refresh that list too
      if (currentOrg) await loadOrgAccounts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAccount) return;
    setIsDeleting(true);
    try {
      await api.deletePaymentAccount(deletingAccount.id);
      setDeletingAccount(null);
      await loadAccounts();
      if (currentOrg) await loadOrgAccounts();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Error al eliminar",
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Vinculación ───────────────────────────────────────────────────────────

  const isLinkedToCurrentOrg = (accountId: string) =>
    orgAccounts.some((a) => a.id === accountId);

  const handleLink = async (accountId: string) => {
    if (!currentOrg) return;
    setIsLinking(accountId);
    setLinkError("");
    try {
      await api.linkPaymentAccountToOrg(currentOrg.id, accountId);
      await loadOrgAccounts();
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : "Error al vincular");
    } finally {
      setIsLinking(null);
    }
  };

  const handleUnlink = async (accountId: string) => {
    if (!currentOrg) return;
    setIsUnlinking(accountId);
    setLinkError("");
    try {
      await api.unlinkPaymentAccountFromOrg(currentOrg.id, accountId);
      await loadOrgAccounts();
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : "Error al desvincular");
    } finally {
      setIsUnlinking(null);
    }
  };

  return (
    <div>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Cuentas de cobro</h1>
          <p className="text-sm text-default-500 mt-1">
            Administrá tus cuentas y vinculalas a tus organizaciones.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90"
        >
          + Nueva cuenta
        </button>
      </div>

      {/* ── Error general ─────────────────────────────────────────────────── */}
      {accountsError && (
        <div className="mb-4 rounded-lg bg-danger-50 p-3 text-sm text-danger">
          {accountsError}
        </div>
      )}

      {/* ── Mis cuentas ───────────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Mis cuentas</h2>

        {isLoadingAccounts ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-default-200 animate-pulse" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <p className="text-default-500 text-sm">
            No tenés cuentas aún. Creá la primera.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => {
              const linked = currentOrg && isLinkedToCurrentOrg(account.id);
              const linking = isLinking === account.id;
              const unlinking = isUnlinking === account.id;

              return (
                <div
                  key={account.id}
                  className="rounded-lg border border-default-200 bg-white p-4"
                >
                  {/* Tipo + nombre */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-default-100 text-default-600">
                        {PAYMENT_ACCOUNT_TYPE_LABELS[account.type]}
                      </span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditForm(account)}
                        className="text-xs text-primary hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingAccount(account)}
                        className="text-xs text-danger hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <p className="font-semibold text-sm mt-2">{account.name}</p>
                  <p className="text-xs text-default-500">
                    Titular: {account.holder}
                  </p>
                  {account.alias && (
                    <p className="text-xs text-default-500">
                      Alias/CBU: {account.alias}
                    </p>
                  )}
                  {account.description && (
                    <p className="text-xs text-default-400 mt-1">
                      {account.description}
                    </p>
                  )}

                  {/* Vinculación a org activa */}
                  {currentOrg && (
                    <div className="mt-3 pt-3 border-t border-default-100">
                      {linked ? (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-success font-medium">
                            ✓ Vinculada a {currentOrg.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUnlink(account.id)}
                            disabled={!!unlinking}
                            className="text-xs text-default-500 hover:text-danger disabled:opacity-50"
                          >
                            {unlinking ? "..." : "Desvincular"}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleLink(account.id)}
                          disabled={!!linking}
                          className="text-xs text-primary hover:underline disabled:opacity-50"
                        >
                          {linking
                            ? "Vinculando..."
                            : `+ Vincular a ${currentOrg.name}`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {linkError && (
          <p className="mt-2 text-sm text-danger">{linkError}</p>
        )}
      </section>

      {/* ── Cuentas disponibles en la org ─────────────────────────────────── */}
      {currentOrg && (
        <section>
          <h2 className="text-lg font-semibold mb-1">
            Cuentas en {currentOrg.name}
          </h2>
          <p className="text-sm text-default-500 mb-3">
            Estas cuentas estarán disponibles para asignar a facturas dentro de
            esta organización.
          </p>

          {isLoadingOrgAccounts ? (
            <div className="h-12 rounded-lg bg-default-200 animate-pulse" />
          ) : orgAccounts.length === 0 ? (
            <p className="text-default-500 text-sm">
              Ninguna cuenta vinculada. Vinculá una desde la lista de arriba.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-default-200 text-left">
                    <th className="pb-2 pr-4 font-medium text-default-600">
                      Nombre
                    </th>
                    <th className="pb-2 pr-4 font-medium text-default-600">
                      Tipo
                    </th>
                    <th className="pb-2 pr-4 font-medium text-default-600">
                      Titular
                    </th>
                    <th className="pb-2 font-medium text-default-600">
                      Alias/CBU
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orgAccounts.map((account) => (
                    <tr
                      key={account.id}
                      className="border-b border-default-100 hover:bg-default-50"
                    >
                      <td className="py-3 pr-4 font-medium">{account.name}</td>
                      <td className="py-3 pr-4 text-default-500">
                        {PAYMENT_ACCOUNT_TYPE_LABELS[account.type]}
                      </td>
                      <td className="py-3 pr-4 text-default-500">
                        {account.holder}
                      </td>
                      <td className="py-3 text-default-500">
                        {account.alias || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ── Modal crear/editar ────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-4">
              {editingAccount ? "Editar cuenta" : "Nueva cuenta de cobro"}
            </h2>

            {formError && (
              <div className="mb-3 rounded-lg bg-danger-50 p-3 text-sm text-danger">
                {formError}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nombre de la cuenta <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder='Ej: Banco Galicia - Cuenta Corriente'
                  className="w-full rounded-md border border-default-300 px-3 py-2 text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Titular <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.holder}
                  onChange={(e) => setForm({ ...form, holder: e.target.value })}
                  placeholder="Nombre del titular"
                  className="w-full rounded-md border border-default-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tipo <span className="text-danger">*</span>
                </label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as PaymentAccountType })
                  }
                  className="w-full rounded-md border border-default-300 px-3 py-2 text-sm"
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {PAYMENT_ACCOUNT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Alias / CBU / Dirección
                </label>
                <input
                  type="text"
                  value={form.alias}
                  onChange={(e) => setForm({ ...form, alias: e.target.value })}
                  placeholder="Alias, CBU, wallet address, etc."
                  className="w-full rounded-md border border-default-300 px-3 py-2 text-sm"
                />
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
                  placeholder="Información adicional..."
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
                disabled={isSaving || !form.name.trim() || !form.holder.trim()}
                className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving
                  ? "Guardando..."
                  : editingAccount
                  ? "Guardar"
                  : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal eliminar ────────────────────────────────────────────────── */}
      {deletingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-2">Eliminar cuenta</h2>
            <p className="text-sm text-default-500 mb-4">
              ¿Estás seguro de que querés eliminar{" "}
              <strong>{deletingAccount.name}</strong>? Esta acción no se puede
              deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingAccount(null)}
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
