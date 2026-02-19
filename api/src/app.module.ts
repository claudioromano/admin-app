import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ClientsModule } from './modules/clients/clients.module';
import { PaymentAccountsModule } from './modules/payment-accounts/payment-accounts.module';
import { FilesModule } from './modules/files/files.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    ClientsModule,
    PaymentAccountsModule,
    FilesModule,
    InvoicesModule,
    ExpensesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
