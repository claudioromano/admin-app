import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, query: PaginationDto) {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { company: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.count({ where }),
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
    const client = await this.prisma.client.findFirst({
      where: { id, organizationId },
      include: {
        _count: { select: { invoices: true } },
      },
    });
    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }
    return client;
  }

  async create(organizationId: string, dto: CreateClientDto) {
    return this.prisma.client.create({
      data: { ...dto, organizationId },
    });
  }

  async update(id: string, organizationId: string, dto: UpdateClientDto) {
    const client = await this.prisma.client.findFirst({
      where: { id, organizationId },
    });
    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }
    return this.prisma.client.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, organizationId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, organizationId },
    });
    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }
    await this.prisma.client.delete({ where: { id } });
  }
}
