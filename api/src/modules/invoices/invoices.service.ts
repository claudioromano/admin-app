import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceFiltersDto } from './dto/invoice-filters.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
  ) {}

  // ── CRUD ────────────────────────────────────────────────────────────────

  async findAll(organizationId: string, filters: InvoiceFiltersDto) {
    const { page = 1, limit = 20, status, clientId, dateFrom, dateTo } =
      filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { organizationId };

    if (status) {
      where.status = status;
    }
    if (clientId) {
      where.clientId = clientId;
    }
    if (dateFrom || dateTo) {
      where.date = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          client: { select: { id: true, name: true, company: true } },
          paymentAccount: { select: { id: true, name: true, type: true } },
          _count: { select: { files: true } },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, organizationId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, organizationId },
      include: {
        client: { select: { id: true, name: true, company: true } },
        paymentAccount: { select: { id: true, name: true, type: true, alias: true } },
        files: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }
    return invoice;
  }

  async create(organizationId: string, dto: CreateInvoiceDto) {
    // Verify client belongs to the organization
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, organizationId },
    });
    if (!client) {
      throw new BadRequestException('El cliente no pertenece a esta organización');
    }

    // Verify payment account belongs to the organization (if provided)
    if (dto.paymentAccountId) {
      const linked = await this.prisma.organizationPaymentAccount.findFirst({
        where: {
          organizationId,
          paymentAccountId: dto.paymentAccountId,
        },
      });
      if (!linked) {
        throw new BadRequestException(
          'La cuenta de cobro no está disponible en esta organización',
        );
      }
    }

    return this.prisma.invoice.create({
      data: {
        organizationId,
        clientId: dto.clientId,
        paymentAccountId: dto.paymentAccountId ?? null,
        number: dto.number ?? null,
        description: dto.description ?? null,
        amount: dto.amount,
        date: new Date(dto.date),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
        paymentAccount: { select: { id: true, name: true, type: true } },
      },
    });
  }

  async update(id: string, organizationId: string, dto: UpdateInvoiceDto) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, organizationId },
    });
    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    // Validate new clientId if provided
    if (dto.clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: dto.clientId, organizationId },
      });
      if (!client) {
        throw new BadRequestException('El cliente no pertenece a esta organización');
      }
    }

    // Validate new paymentAccountId if provided
    if (dto.paymentAccountId !== undefined && dto.paymentAccountId !== null) {
      const linked = await this.prisma.organizationPaymentAccount.findFirst({
        where: { organizationId, paymentAccountId: dto.paymentAccountId },
      });
      if (!linked) {
        throw new BadRequestException(
          'La cuenta de cobro no está disponible en esta organización',
        );
      }
    }

    const data: Record<string, unknown> = {};
    if (dto.clientId !== undefined) data.clientId = dto.clientId;
    if (dto.paymentAccountId !== undefined)
      data.paymentAccountId = dto.paymentAccountId;
    if (dto.number !== undefined) data.number = dto.number;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.dueDate !== undefined)
      data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;

    return this.prisma.invoice.update({
      where: { id },
      data,
      include: {
        client: { select: { id: true, name: true, company: true } },
        paymentAccount: { select: { id: true, name: true, type: true } },
      },
    });
  }

  async delete(id: string, organizationId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, organizationId },
      include: { files: true },
    });
    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    // Delete all associated files from MinIO
    await Promise.all(
      invoice.files.map((f) => this.filesService.deleteFile(f.fileKey)),
    );

    await this.prisma.invoice.delete({ where: { id } });
  }

  // ── Estado ──────────────────────────────────────────────────────────────

  async updateStatus(
    id: string,
    organizationId: string,
    dto: UpdateInvoiceStatusDto,
  ) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, organizationId },
    });
    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    const data: Record<string, unknown> = { status: dto.status };

    if (dto.status === InvoiceStatus.PAID) {
      data.paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();
    } else {
      data.paidAt = null;
    }

    return this.prisma.invoice.update({
      where: { id },
      data,
    });
  }

  // ── Archivos adjuntos ────────────────────────────────────────────────────

  async addFile(
    invoiceId: string,
    organizationId: string,
    file: Express.Multer.File,
  ) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId },
    });
    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    // Sanitize original filename
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const fileKey = `invoices/${invoiceId}/${randomUUID()}-${safeName}`;

    await this.filesService.uploadFile(
      fileKey,
      file.buffer,
      file.mimetype,
      file.size,
    );

    return this.prisma.invoiceFile.create({
      data: {
        invoiceId,
        fileName: file.originalname,
        fileKey,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });
  }

  async removeFile(
    invoiceId: string,
    fileId: string,
    organizationId: string,
  ) {
    // Verify invoice belongs to org
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId },
    });
    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    const invoiceFile = await this.prisma.invoiceFile.findFirst({
      where: { id: fileId, invoiceId },
    });
    if (!invoiceFile) {
      throw new NotFoundException('Archivo no encontrado');
    }

    await this.filesService.deleteFile(invoiceFile.fileKey);
    await this.prisma.invoiceFile.delete({ where: { id: fileId } });
  }
}
