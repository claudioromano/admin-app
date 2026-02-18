import {
  PaymentAccount,
  CreatePaymentAccountData,
  UpdatePaymentAccountData,
} from '@/types/payment-account';

interface ApiResponse<T> {
  data?: T;
  message?: string;
}

// ── Cuentas del usuario ──────────────────────────────────────────────────────

export async function listPaymentAccounts(): Promise<PaymentAccount[]> {
  const res = await fetch('/api/payment-accounts');
  const json: ApiResponse<PaymentAccount[]> = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al cargar cuentas');
  return json.data!;
}

export async function createPaymentAccount(
  data: CreatePaymentAccountData,
): Promise<PaymentAccount> {
  const res = await fetch('/api/payment-accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json: ApiResponse<PaymentAccount> = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al crear cuenta');
  return json.data!;
}

export async function updatePaymentAccount(
  id: string,
  data: UpdatePaymentAccountData,
): Promise<PaymentAccount> {
  const res = await fetch('/api/payment-accounts', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...data }),
  });
  const json: ApiResponse<PaymentAccount> = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al actualizar cuenta');
  return json.data!;
}

export async function deletePaymentAccount(id: string): Promise<void> {
  const res = await fetch(`/api/payment-accounts?id=${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.message || 'Error al eliminar cuenta');
  }
}

// ── Vinculación a organizaciones ─────────────────────────────────────────────

export async function listOrgPaymentAccounts(
  orgId: string,
): Promise<PaymentAccount[]> {
  const res = await fetch(`/api/organizations/payment-accounts?orgId=${orgId}`);
  const json: ApiResponse<PaymentAccount[]> = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al cargar cuentas de la organización');
  return json.data!;
}

export async function linkPaymentAccountToOrg(
  orgId: string,
  paymentAccountId: string,
): Promise<void> {
  const res = await fetch('/api/organizations/payment-accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId, paymentAccountId }),
  });
  const json: ApiResponse<unknown> = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al vincular cuenta');
}

export async function unlinkPaymentAccountFromOrg(
  orgId: string,
  paymentAccountId: string,
): Promise<void> {
  const res = await fetch(
    `/api/organizations/payment-accounts?orgId=${orgId}&paymentAccountId=${paymentAccountId}`,
    { method: 'DELETE' },
  );
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.message || 'Error al desvincular cuenta');
  }
}
