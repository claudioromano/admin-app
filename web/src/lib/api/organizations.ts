import { Organization, OrganizationMember, MemberRole } from '@/types/organization';

interface ApiResponse<T> {
  data?: T;
  message?: string;
}

export async function listOrganizations(): Promise<Organization[]> {
  const res = await fetch('/api/organizations/list');
  const json: ApiResponse<Organization[]> = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al cargar organizaciones');
  return json.data || [];
}

export async function createOrganization(name: string): Promise<Organization> {
  const res = await fetch('/api/organizations/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const json: ApiResponse<Organization> = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al crear organización');
  return json.data!;
}

export async function listMembers(orgId: string): Promise<OrganizationMember[]> {
  const res = await fetch(`/api/organizations/members?orgId=${orgId}`);
  const json: ApiResponse<OrganizationMember[]> = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al cargar miembros');
  return json.data || [];
}

export async function inviteMember(
  orgId: string,
  email: string,
  role?: MemberRole,
): Promise<OrganizationMember> {
  const res = await fetch('/api/organizations/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId, email, role }),
  });
  const json: ApiResponse<OrganizationMember> = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al invitar miembro');
  return json.data!;
}

export async function updateMemberRole(
  orgId: string,
  memberId: string,
  role: MemberRole,
): Promise<OrganizationMember> {
  const res = await fetch('/api/organizations/members', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orgId, memberId, role }),
  });
  const json: ApiResponse<OrganizationMember> = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al actualizar rol');
  return json.data!;
}

export async function removeMember(orgId: string, memberId: string): Promise<void> {
  const res = await fetch(
    `/api/organizations/members?orgId=${orgId}&memberId=${memberId}`,
    { method: 'DELETE' },
  );
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.message || 'Error al remover miembro');
  }
}
