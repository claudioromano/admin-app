export interface Client {
  id: string;
  organizationId: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    invoices: number;
  };
}

export interface ClientsPage {
  items: Client[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateClientData {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface UpdateClientData {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
}
