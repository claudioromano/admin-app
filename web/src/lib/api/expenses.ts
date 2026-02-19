import {
  Expense,
  ExpensesPage,
  ExpenseFile,
  CreateExpenseData,
  UpdateExpenseData,
  UpdateExpenseStatusData,
  ExpenseFileType,
} from '@/types/expense';

interface ApiResponse<T> {
  data?: T;
  message?: string;
}

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function listExpenses(
  orgId: string,
  params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  },
): Promise<ExpensesPage> {
  const qs = new URLSearchParams({ orgId });
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.status) qs.set('status', params.status);
  if (params?.type) qs.set('type', params.type);
  if (params?.dateFrom) qs.set('dateFrom', params.dateFrom);
  if (params?.dateTo) qs.set('dateTo', params.dateTo);

  const res = await fetch(`/api/expenses?${qs.toString()}`);
  const json: ApiResponse<ExpensesPage> = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al cargar gastos');
  return json.data!;
}

export async function getExpense(orgId: string, id: string): Promise<Expense> {
  const res = await fetch(`/api/expenses?orgId=${orgId}&id=${id}`);
  const json: ApiResponse<Expense> = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al cargar gasto');
  return json.data!;
}

export async function createExpense(
  orgId: string,
  data: CreateExpenseData,
): Promise<Expense> {
  const res = await fetch('/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId, ...data }),
  });
  const json: ApiResponse<Expense> = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al crear gasto');
  return json.data!;
}

export async function updateExpense(
  orgId: string,
  id: string,
  data: UpdateExpenseData,
): Promise<Expense> {
  const res = await fetch('/api/expenses', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId, id, ...data }),
  });
  const json: ApiResponse<Expense> = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al actualizar gasto');
  return json.data!;
}

export async function deleteExpense(orgId: string, id: string): Promise<void> {
  const res = await fetch(`/api/expenses?orgId=${orgId}&id=${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.message || 'Error al eliminar gasto');
  }
}

// ── Estado ───────────────────────────────────────────────────────────────────

export async function updateExpenseStatus(
  orgId: string,
  id: string,
  data: UpdateExpenseStatusData,
): Promise<Expense> {
  const res = await fetch('/api/expenses/status', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId, id, ...data }),
  });
  const json: ApiResponse<Expense> = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al cambiar estado');
  return json.data!;
}

// ── Archivos adjuntos ────────────────────────────────────────────────────────

export async function uploadExpenseFile(
  orgId: string,
  expenseId: string,
  file: File,
  fileType: ExpenseFileType,
): Promise<ExpenseFile> {
  const formData = new FormData();
  formData.append('orgId', orgId);
  formData.append('expenseId', expenseId);
  formData.append('file', file);
  formData.append('fileType', fileType);

  const res = await fetch('/api/expenses/files', {
    method: 'POST',
    body: formData,
  });
  const json: ApiResponse<ExpenseFile> = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al subir archivo');
  return json.data!;
}

export async function deleteExpenseFile(
  orgId: string,
  expenseId: string,
  fileId: string,
): Promise<void> {
  const res = await fetch(
    `/api/expenses/files?orgId=${orgId}&expenseId=${expenseId}&fileId=${fileId}`,
    { method: 'DELETE' },
  );
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.message || 'Error al eliminar archivo');
  }
}
