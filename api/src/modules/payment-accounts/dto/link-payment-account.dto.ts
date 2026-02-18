import { IsString, IsUUID } from 'class-validator';

export class LinkPaymentAccountDto {
  @IsString()
  @IsUUID()
  paymentAccountId: string;
}
