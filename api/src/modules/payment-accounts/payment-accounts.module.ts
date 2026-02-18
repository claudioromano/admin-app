import { Module } from '@nestjs/common';
import { PaymentAccountsService } from './payment-accounts.service';
import { PaymentAccountsController } from './payment-accounts.controller';
import { OrgPaymentAccountsController } from './org-payment-accounts.controller';

@Module({
  controllers: [PaymentAccountsController, OrgPaymentAccountsController],
  providers: [PaymentAccountsService],
  exports: [PaymentAccountsService],
})
export class PaymentAccountsModule {}
