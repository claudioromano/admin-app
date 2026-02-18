import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentAccountsService } from './payment-accounts.service';
import { LinkPaymentAccountDto } from './dto/link-payment-account.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrganizationRoleGuard } from '../../common/guards/organization-role.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('organizations/:orgId/payment-accounts')
@UseGuards(JwtAuthGuard, OrganizationRoleGuard)
export class OrgPaymentAccountsController {
  constructor(private paymentAccountsService: PaymentAccountsService) {}

  @Get()
  findAll(@Param('orgId') orgId: string) {
    return this.paymentAccountsService.findByOrganization(orgId);
  }

  @Post()
  link(
    @Param('orgId') orgId: string,
    @Body() dto: LinkPaymentAccountDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.paymentAccountsService.linkToOrganization(
      orgId,
      dto.paymentAccountId,
      user.id,
    );
  }

  @Delete(':paymentAccountId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlink(
    @Param('orgId') orgId: string,
    @Param('paymentAccountId') paymentAccountId: string,
  ) {
    await this.paymentAccountsService.unlinkFromOrganization(
      orgId,
      paymentAccountId,
    );
  }
}
