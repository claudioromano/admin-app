export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  PENDING: 'Pendiente',
  PAID: 'Cobrada',
  OVERDUE: 'Vencida',
  CANCELLED: 'Anulada',
};

export interface InvoiceFile {
  id: string;
  invoiceId: string;
  fileName: string;
  fileKey: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  organizationId: string;
  clientId: string;
  paymentAccountId: string | null;
  number: string | null;
  description: string | null;
  /** Decimal serializado como string por Prisma */
  amount: string;
  date: string;
  dueDate: string | null;
  status: InvoiceStatus;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  client?: { id: string; name: string; company: string | null };
  paymentAccount?: { id: string; name: string; type: string; alias: string | null } | null;
  files?: InvoiceFile[];
  _count?: { files: number };
}

export interface InvoicesPage {
  items: Invoice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateInvoiceData {
  clientId: string;
  paymentAccountId?: string;
  number?: string;
  description?: string;
  amount: number;
  date: string;
  dueDate?: string;
}

export interface UpdateInvoiceData {
  clientId?: string;
  paymentAccountId?: string | null;
  number?: string;
  description?: string;
  amount?: number;
  date?: string;
  dueDate?: string | null;
}

export interface UpdateInvoiceStatusData {
  status: InvoiceStatus;
  paidAt?: string;
}
