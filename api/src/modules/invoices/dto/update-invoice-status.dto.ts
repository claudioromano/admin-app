import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { InvoiceStatus } from '@prisma/client';

export class UpdateInvoiceStatusDto {
  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;

  /**
   * Fecha real de cobro. Requerida cuando status = PAID.
   * Si se pasa PAID sin paidAt, se usa la fecha actual.
   */
  @IsOptional()
  @IsDateString()
  paidAt?: string;
}
