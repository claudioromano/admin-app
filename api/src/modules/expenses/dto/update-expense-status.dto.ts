import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ExpenseStatus } from '@prisma/client';

export class UpdateExpenseStatusDto {
  @IsEnum(ExpenseStatus)
  status: ExpenseStatus;

  @IsOptional()
  @IsDateString()
  paidAt?: string;
}
