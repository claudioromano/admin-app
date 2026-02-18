import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async findAllByUser(userId: string) {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((m) => ({
      ...m.organization,
      role: m.role,
      memberCount: m.organization._count.members,
    }));
  }

  async findById(id: string, userId: string) {
    const membership = await this.prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: id } },
      include: {
        organization: {
          include: {
            _count: { select: { members: true, clients: true } },
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Organización no encontrada');
    }

    return {
      ...membership.organization,
      role: membership.role,
      memberCount: membership.organization._count.members,
      clientCount: membership.organization._count.clients,
    };
  }

  async create(userId: string, dto: CreateOrganizationDto) {
    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        members: {
          create: { userId, role: 'OWNER' },
        },
      },
      include: {
        _count: { select: { members: true } },
      },
    });

    return { ...org, role: 'OWNER' as const, memberCount: org._count.members };
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    return this.prisma.organization.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, userId: string) {
    const membership = await this.prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: id } },
    });

    if (!membership || membership.role !== 'OWNER') {
      throw new ForbiddenException(
        'Solo el propietario puede eliminar la organización',
      );
    }

    await this.prisma.organization.delete({ where: { id } });
  }
}
