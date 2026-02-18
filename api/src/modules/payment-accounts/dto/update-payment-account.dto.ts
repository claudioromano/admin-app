import { IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { PaymentAccountType } from './create-payment-account.dto';

export class UpdatePaymentAccountDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  holder?: string;

  @IsOptional()
  @IsEnum(PaymentAccountType)
  type?: PaymentAccountType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  alias?: string;
}
