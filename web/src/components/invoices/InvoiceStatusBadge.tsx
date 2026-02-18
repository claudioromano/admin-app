import { InvoiceStatus, INVOICE_STATUS_LABELS } from '@/types/invoice';

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  PENDING: 'bg-warning-100 text-warning-700 border border-warning-200',
  PAID: 'bg-success-100 text-success-700 border border-success-200',
  OVERDUE: 'bg-danger-100 text-danger-700 border border-danger-200',
  CANCELLED: 'bg-default-100 text-default-500 border border-default-200',
};

interface Props {
  status: InvoiceStatus;
  className?: string;
}

export function InvoiceStatusBadge({ status, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]} ${className}`}
    >
      {INVOICE_STATUS_LABELS[status]}
    </span>
  );
}
