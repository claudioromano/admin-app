import {
  Invoice,
  InvoicesPage,
  InvoiceFile,
  CreateInvoiceData,
  UpdateInvoiceData,
  UpdateInvoiceStatusData,
} from '@/types/invoice';

interface ApiResponse<T> {
  data?: T;
  message?: string;
}

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function listInvoices(
  orgId: string,
  params?: {
    page?: number;
    limit?: number;
    status?: string;
    clientId?: string;
    dateFrom?: string;
    dateTo?: string;
  },
): Promise<InvoicesPage> {
  const qs = new URLSearchParams({ orgId });
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.status) qs.set('status', params.status);
  if (params?.clientId) qs.set('clientId', params.clientId);
  if (params?.dateFrom) qs.set('dateFrom', params.dateFrom);
  if (params?.dateTo) qs.set('dateTo', params.dateTo);

  const res = await fetch(`/api/invoices?${qs.toString()}`);
  const json: ApiResponse<InvoicesPage> = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al cargar facturas');
  return json.data!;
}

export async function getInvoice(orgId: string, id: string): Promise<Invoice> {
  const res = await fetch(`/api/invoices?orgId=${orgId}&id=${id}`);
  const json: ApiResponse<Invoice> = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al cargar factura');
  return json.data!;
}

export async function createInvoice(
  orgId: string,
  data: CreateInvoiceData,
): Promise<Invoice> {
  const res = await fetch('/api/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId, ...data }),
  });
  const json: ApiResponse<Invoice> = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al crear factura');
  return json.data!;
}

export async function updateInvoice(
  orgId: string,
  id: string,
  data: UpdateInvoiceData,
): Promise<Invoice> {
  const res = await fetch('/api/invoices', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId, id, ...data }),
  });
  const json: ApiResponse<Invoice> = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al actualizar factura');
  return json.data!;
}

export async function deleteInvoice(orgId: string, id: string): Promise<void> {
  const res = await fetch(`/api/invoices?orgId=${orgId}&id=${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.message || 'Error al eliminar factura');
  }
}

// ── Estado ───────────────────────────────────────────────────────────────────

export async function updateInvoiceStatus(
  orgId: string,
  id: string,
  data: UpdateInvoiceStatusData,
): Promise<Invoice> {
  const res = await fetch('/api/invoices/status', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId, id, ...data }),
  });
  const json: ApiResponse<Invoice> = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al cambiar estado');
  return json.data!;
}

// ── Archivos adjuntos ────────────────────────────────────────────────────────

export async function uploadInvoiceFile(
  orgId: string,
  invoiceId: string,
  file: File,
): Promise<InvoiceFile> {
  const formData = new FormData();
  formData.append('orgId', orgId);
  formData.append('invoiceId', invoiceId);
  formData.append('file', file);

  const res = await fetch('/api/invoices/files', {
    method: 'POST',
    body: formData,
  });
  const json: ApiResponse<InvoiceFile> = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al subir archivo');
  return json.data!;
}

export async function deleteInvoiceFile(
  orgId: string,
  invoiceId: string,
  fileId: string,
): Promise<void> {
  const res = await fetch(
    `/api/invoices/files?orgId=${orgId}&invoiceId=${invoiceId}&fileId=${fileId}`,
    { method: 'DELETE' },
  );
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.message || 'Error al eliminar archivo');
  }
}

export async function getFileUrl(key: string): Promise<string> {
  const res = await fetch(`/api/files?key=${encodeURIComponent(key)}`);
  const json: ApiResponse<{ url: string }> = await res.json();
  if (!res.ok) throw new Error('Error al obtener URL del archivo');
  return json.data!.url;
}
