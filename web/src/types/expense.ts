export type ExpenseType = 'FIXED' | 'VARIABLE';
export type ExpenseStatus = 'PENDING' | 'PAID' | 'OVERDUE';
export type ExpenseFileType = 'INVOICE' | 'RECEIPT' | 'OTHER';

export interface ExpenseFile {
  id: string;
  expenseId: string;
  fileName: string;
  fileKey: string;
  fileSize: number;
  mimeType: string;
  type: ExpenseFileType;
  createdAt: string;
}

export interface Expense {
  id: string;
  organizationId: string;
  description: string;
  amount: string; // Decimal serialized as string by Prisma
  date: string;
  dueDate: string | null;
  type: ExpenseType;
  status: ExpenseStatus;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  files?: ExpenseFile[];
  _count?: { files: number };
}

export interface ExpensesPage {
  items: Expense[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateExpenseData {
  description: string;
  amount: number;
  date: string;
  dueDate?: string | null;
  type: ExpenseType;
  notes?: string;
}

export interface UpdateExpenseData {
  description?: string;
  amount?: number;
  date?: string;
  dueDate?: string | null;
  type?: ExpenseType;
  notes?: string;
}

export interface UpdateExpenseStatusData {
  status: ExpenseStatus;
  paidAt?: string;
}

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  FIXED: 'Fijo',
  VARIABLE: 'Variable',
};

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  OVERDUE: 'Vencido',
};

export const EXPENSE_FILE_TYPE_LABELS: Record<ExpenseFileType, string> = {
  INVOICE: 'Factura proveedor',
  RECEIPT: 'Comprobante de pago',
  OTHER: 'Otro',
};
