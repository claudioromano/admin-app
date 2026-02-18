export interface Organization {
  id: string;
  name: string;
  role: MemberRole;
  memberCount: number;
  clientCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface OrganizationMember {
  id: string;
  role: MemberRole;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}
