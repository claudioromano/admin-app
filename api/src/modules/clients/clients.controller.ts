import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrganizationRoleGuard } from '../../common/guards/organization-role.guard';

@Controller('organizations/:orgId/clients')
@UseGuards(JwtAuthGuard, OrganizationRoleGuard)
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  findAll(@Param('orgId') orgId: string, @Query() query: PaginationDto) {
    return this.clientsService.findAll(orgId, query);
  }

  @Get(':id')
  findOne(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.clientsService.findById(id, orgId);
  }

  @Post()
  create(@Param('orgId') orgId: string, @Body() dto: CreateClientDto) {
    return this.clientsService.create(orgId, dto);
  }

  @Patch(':id')
  update(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.update(id, orgId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('orgId') orgId: string, @Param('id') id: string) {
    await this.clientsService.delete(id, orgId);
  }
}
