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
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  OrganizationRoleGuard,
  Roles,
} from '../../common/guards/organization-role.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.organizationsService.findAllByUser(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateOrganizationDto,
  ) {
    return this.organizationsService.create(user.id, dto);
  }

  @Get(':id')
  @UseGuards(OrganizationRoleGuard)
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.organizationsService.findById(id, user.id);
  }

  @Patch(':id')
  @UseGuards(OrganizationRoleGuard)
  @Roles('ADMIN' as any)
  update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.organizationsService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.organizationsService.delete(id, user.id);
  }
}
