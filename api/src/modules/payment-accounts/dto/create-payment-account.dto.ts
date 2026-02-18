import {
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
} from 'class-validator';

export enum PaymentAccountType {
  BANK = 'BANK',
  VIRTUAL_WALLET = 'VIRTUAL_WALLET',
  CRYPTO = 'CRYPTO',
  OTHER = 'OTHER',
}

export class CreatePaymentAccountDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(2)
  holder: string;

  @IsEnum(PaymentAccountType)
  type: PaymentAccountType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  alias?: string;
}
