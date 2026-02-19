import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseFiltersDto } from './dto/expense-filters.dto';
import { UpdateExpenseStatusDto } from './dto/update-expense-status.dto';
import { ExpenseStatus, ExpenseFileType } from '@prisma/client';

@Injectable()
export class ExpensesService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
  ) {}

  // ── CRUD ────────────────────────────────────────────────────────────────

  async findAll(organizationId: string, filters: ExpenseFiltersDto) {
    const { page = 1, limit = 20, status, type, dateFrom, dateTo } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { organizationId };

    if (status) where.status = status;
    if (type) where.type = type;
    if (dateFrom || dateTo) {
      where.date = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          _count: { select: { files: true } },
        },
      }),
      this.prisma.expense.count({ where }),
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
    const expense = await this.prisma.expense.findFirst({
      where: { id, organizationId },
      include: {
        files: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!expense) {
      throw new NotFoundException('Gasto no encontrado');
    }
    return expense;
  }

  async create(organizationId: string, dto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: {
        organizationId,
        description: dto.description,
        amount: dto.amount,
        date: new Date(dto.date),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        type: dto.type,
        notes: dto.notes ?? null,
      },
    });
  }

  async update(id: string, organizationId: string, dto: UpdateExpenseDto) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, organizationId },
    });
    if (!expense) {
      throw new NotFoundException('Gasto no encontrado');
    }

    const data: Record<string, unknown> = {};
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.dueDate !== undefined)
      data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.notes !== undefined) data.notes = dto.notes;

    return this.prisma.expense.update({ where: { id }, data });
  }

  async delete(id: string, organizationId: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, organizationId },
      include: { files: true },
    });
    if (!expense) {
      throw new NotFoundException('Gasto no encontrado');
    }

    await Promise.all(
      expense.files.map((f) => this.filesService.deleteFile(f.fileKey)),
    );

    await this.prisma.expense.delete({ where: { id } });
  }

  // ── Estado ──────────────────────────────────────────────────────────────

  async updateStatus(
    id: string,
    organizationId: string,
    dto: UpdateExpenseStatusDto,
  ) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, organizationId },
    });
    if (!expense) {
      throw new NotFoundException('Gasto no encontrado');
    }

    const data: Record<string, unknown> = { status: dto.status };

    if (dto.status === ExpenseStatus.PAID) {
      data.paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();
    } else {
      data.paidAt = null;
    }

    return this.prisma.expense.update({ where: { id }, data });
  }

  // ── Archivos adjuntos ────────────────────────────────────────────────────

  async addFile(
    expenseId: string,
    organizationId: string,
    file: Express.Multer.File,
    fileType: ExpenseFileType,
  ) {
    const expense = await this.prisma.expense.findFirst({
      where: { id: expenseId, organizationId },
    });
    if (!expense) {
      throw new NotFoundException('Gasto no encontrado');
    }

    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const fileKey = `expenses/${expenseId}/${randomUUID()}-${safeName}`;

    await this.filesService.uploadFile(
      fileKey,
      file.buffer,
      file.mimetype,
      file.size,
    );

    return this.prisma.expenseFile.create({
      data: {
        expenseId,
        fileName: file.originalname,
        fileKey,
        fileSize: file.size,
        mimeType: file.mimetype,
        type: fileType,
      },
    });
  }

  async removeFile(
    expenseId: string,
    fileId: string,
    organizationId: string,
  ) {
    const expense = await this.prisma.expense.findFirst({
      where: { id: expenseId, organizationId },
    });
    if (!expense) {
      throw new NotFoundException('Gasto no encontrado');
    }

    const expenseFile = await this.prisma.expenseFile.findFirst({
      where: { id: fileId, expenseId },
    });
    if (!expenseFile) {
      throw new NotFoundException('Archivo no encontrado');
    }

    await this.filesService.deleteFile(expenseFile.fileKey);
    await this.prisma.expenseFile.delete({ where: { id: fileId } });
  }
}
