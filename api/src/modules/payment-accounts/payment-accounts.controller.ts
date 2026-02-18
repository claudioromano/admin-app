import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentAccountsService } from './payment-accounts.service';
import { CreatePaymentAccountDto } from './dto/create-payment-account.dto';
import { UpdatePaymentAccountDto } from './dto/update-payment-account.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('payment-accounts')
@UseGuards(JwtAuthGuard)
export class PaymentAccountsController {
  constructor(private paymentAccountsService: PaymentAccountsService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.paymentAccountsService.findAllByUser(user.id);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.paymentAccountsService.findById(id, user.id);
  }

  @Post()
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreatePaymentAccountDto,
  ) {
    return this.paymentAccountsService.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdatePaymentAccountDto,
  ) {
    return this.paymentAccountsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    await this.paymentAccountsService.delete(id, user.id);
  }
}
