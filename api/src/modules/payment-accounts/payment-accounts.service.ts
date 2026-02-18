import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentAccountDto } from './dto/create-payment-account.dto';
import { UpdatePaymentAccountDto } from './dto/update-payment-account.dto';

@Injectable()
export class PaymentAccountsService {
  constructor(private prisma: PrismaService) {}

  // ── Cuentas del usuario ──────────────────────────────────────────────────

  async findAllByUser(userId: string) {
    return this.prisma.paymentAccount.findMany({
      where: { userId },
      include: {
        organizations: {
          include: {
            organization: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, userId: string) {
    const account = await this.prisma.paymentAccount.findFirst({
      where: { id, userId },
      include: {
        organizations: {
          include: {
            organization: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!account) {
      throw new NotFoundException('Cuenta no encontrada');
    }
    return account;
  }

  async create(userId: string, dto: CreatePaymentAccountDto) {
    return this.prisma.paymentAccount.create({
      data: { ...dto, userId },
    });
  }

  async update(id: string, userId: string, dto: UpdatePaymentAccountDto) {
    const account = await this.prisma.paymentAccount.findFirst({
      where: { id, userId },
    });
    if (!account) {
      throw new NotFoundException('Cuenta no encontrada');
    }
    return this.prisma.paymentAccount.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, userId: string) {
    const account = await this.prisma.paymentAccount.findFirst({
      where: { id, userId },
    });
    if (!account) {
      throw new NotFoundException('Cuenta no encontrada');
    }
    await this.prisma.paymentAccount.delete({ where: { id } });
  }

  // ── Vinculación a organizaciones ────────────────────────────────────────

  async findByOrganization(organizationId: string) {
    const links = await this.prisma.organizationPaymentAccount.findMany({
      where: { organizationId },
      include: {
        paymentAccount: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return links.map((l) => ({ ...l.paymentAccount, linkId: l.id }));
  }

  async linkToOrganization(
    organizationId: string,
    paymentAccountId: string,
    userId: string,
  ) {
    // Verify the account belongs to the requesting user
    const account = await this.prisma.paymentAccount.findFirst({
      where: { id: paymentAccountId, userId },
    });
    if (!account) {
      throw new ForbiddenException(
        'La cuenta no existe o no te pertenece',
      );
    }

    // Check if already linked
    const existing = await this.prisma.organizationPaymentAccount.findUnique({
      where: {
        organizationId_paymentAccountId: { organizationId, paymentAccountId },
      },
    });
    if (existing) {
      throw new ConflictException('La cuenta ya está vinculada a esta organización');
    }

    return this.prisma.organizationPaymentAccount.create({
      data: { organizationId, paymentAccountId },
      include: { paymentAccount: true },
    });
  }

  async unlinkFromOrganization(
    organizationId: string,
    paymentAccountId: string,
  ) {
    const link = await this.prisma.organizationPaymentAccount.findUnique({
      where: {
        organizationId_paymentAccountId: { organizationId, paymentAccountId },
      },
    });
    if (!link) {
      throw new NotFoundException('La cuenta no está vinculada a esta organización');
    }
    await this.prisma.organizationPaymentAccount.delete({
      where: { id: link.id },
    });
  }
}
