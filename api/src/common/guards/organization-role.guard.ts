import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { MemberRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

import { SetMetadata } from '@nestjs/common';
export const Roles = (...roles: MemberRole[]) => SetMetadata(ROLES_KEY, roles);

const ROLE_HIERARCHY: Record<MemberRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

@Injectable()
export class OrganizationRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No autenticado');
    }

    const orgId = request.params.orgId || request.params.id;
    if (!orgId) {
      throw new ForbiddenException('Organización no especificada');
    }

    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: orgId,
        },
      },
      include: { organization: true },
    });

    if (!membership) {
      throw new NotFoundException('Organización no encontrada');
    }

    const requiredRoles = this.reflector.getAllAndOverride<MemberRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRoles && requiredRoles.length > 0) {
      const userLevel = ROLE_HIERARCHY[membership.role];
      const minRequired = Math.min(
        ...requiredRoles.map((r) => ROLE_HIERARCHY[r]),
      );
      if (userLevel < minRequired) {
        throw new ForbiddenException('No tenés permisos suficientes');
      }
    }

    request.organization = membership.organization;
    request.membership = membership;

    return true;
  }
}
