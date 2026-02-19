import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExpenseType } from '@prisma/client';

export class CreateExpenseDto {
  @IsString()
  @MinLength(1)
  description: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsEnum(ExpenseType)
  type: ExpenseType;

  @IsOptional()
  @IsString()
  notes?: string;
}
