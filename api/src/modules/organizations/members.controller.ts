import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  OrganizationRoleGuard,
  Roles,
} from '../../common/guards/organization-role.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('organizations/:id/members')
@UseGuards(JwtAuthGuard, OrganizationRoleGuard)
export class MembersController {
  constructor(private membersService: MembersService) {}

  @Get()
  findAll(@Param('id') orgId: string) {
    return this.membersService.findAll(orgId);
  }

  @Post()
  @Roles('ADMIN' as any)
  invite(@Param('id') orgId: string, @Body() dto: InviteMemberDto) {
    return this.membersService.invite(orgId, dto);
  }

  @Patch(':memberId')
  @Roles('ADMIN' as any)
  updateRole(
    @Param('id') orgId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.membersService.updateRole(orgId, memberId, dto, user.id);
  }

  @Delete(':memberId')
  @Roles('ADMIN' as any)
  remove(
    @Param('id') orgId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.membersService.remove(orgId, memberId, user.id);
  }
}
