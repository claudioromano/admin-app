import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsNumber,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvoiceDto {
  @IsUUID()
  clientId: string;

  @IsOptional()
  @IsUUID()
  paymentAccountId?: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
