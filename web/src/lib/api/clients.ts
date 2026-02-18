import { Client, ClientsPage, CreateClientData, UpdateClientData } from '@/types/client';

interface ApiResponse<T> {
  data?: T;
  message?: string;
}

export async function listClients(
  orgId: string,
  params?: { page?: number; limit?: number; search?: string },
): Promise<ClientsPage> {
  const qs = new URLSearchParams({ orgId });
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.search) qs.set('search', params.search);

  const res = await fetch(`/api/clients?${qs.toString()}`);
  const json: ApiResponse<ClientsPage> = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al cargar clientes');
  return json.data!;
}

export async function getClient(orgId: string, id: string): Promise<Client> {
  const res = await fetch(`/api/clients?orgId=${orgId}&id=${id}`);
  const json: ApiResponse<Client> = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al cargar cliente');
  return json.data!;
}

export async function createClient(orgId: string, data: CreateClientData): Promise<Client> {
  const res = await fetch('/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId, ...data }),
  });
  const json: ApiResponse<Client> = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al crear cliente');
  return json.data!;
}

export async function updateClient(
  orgId: string,
  id: string,
  data: UpdateClientData,
): Promise<Client> {
  const res = await fetch('/api/clients', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId, id, ...data }),
  });
  const json: ApiResponse<Client> = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al actualizar cliente');
  return json.data!;
}

export async function deleteClient(orgId: string, id: string): Promise<void> {
  const res = await fetch(`/api/clients?orgId=${orgId}&id=${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.message || 'Error al eliminar cliente');
  }
}
