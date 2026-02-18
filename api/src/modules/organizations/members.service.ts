import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MemberRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      role: m.role,
      createdAt: m.createdAt,
      user: m.user,
    }));
  }

  async invite(organizationId: string, dto: InviteMemberDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException(
        'No se encontró un usuario con ese email',
      );
    }

    const existing = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('El usuario ya es miembro de esta organización');
    }

    const membership = await this.prisma.organizationMember.create({
      data: {
        userId: user.id,
        organizationId,
        role: dto.role || MemberRole.MEMBER,
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    return {
      id: membership.id,
      role: membership.role,
      createdAt: membership.createdAt,
      user: membership.user,
    };
  }

  async updateRole(
    organizationId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
    currentUserId: string,
  ) {
    const member = await this.prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId },
    });

    if (!member) {
      throw new NotFoundException('Miembro no encontrado');
    }

    if (member.role === 'OWNER') {
      throw new ForbiddenException('No se puede cambiar el rol del propietario');
    }

    if (member.userId === currentUserId) {
      throw new ForbiddenException('No podés cambiar tu propio rol');
    }

    return this.prisma.organizationMember.update({
      where: { id: memberId },
      data: { role: dto.role },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async remove(
    organizationId: string,
    memberId: string,
    currentUserId: string,
  ) {
    const member = await this.prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId },
    });

    if (!member) {
      throw new NotFoundException('Miembro no encontrado');
    }

    if (member.role === 'OWNER') {
      throw new ForbiddenException('No se puede remover al propietario');
    }

    if (member.userId === currentUserId) {
      throw new ForbiddenException('No podés removerte a vos mismo');
    }

    await this.prisma.organizationMember.delete({ where: { id: memberId } });
  }
}
