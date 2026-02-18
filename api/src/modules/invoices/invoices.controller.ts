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
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceFiltersDto } from './dto/invoice-filters.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrganizationRoleGuard } from '../../common/guards/organization-role.guard';

// 20 MB máx por archivo adjunto
const MAX_FILE_SIZE = 20 * 1024 * 1024;

@Controller('organizations/:orgId/invoices')
@UseGuards(JwtAuthGuard, OrganizationRoleGuard)
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Get()
  findAll(
    @Param('orgId') orgId: string,
    @Query() filters: InvoiceFiltersDto,
  ) {
    return this.invoicesService.findAll(orgId, filters);
  }

  @Get(':id')
  findOne(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.invoicesService.findById(id, orgId);
  }

  @Post()
  create(
    @Param('orgId') orgId: string,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoicesService.create(orgId, dto);
  }

  @Patch(':id')
  update(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(id, orgId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('orgId') orgId: string, @Param('id') id: string) {
    await this.invoicesService.delete(id, orgId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceStatusDto,
  ) {
    return this.invoicesService.updateStatus(id, orgId, dto);
  }

  @Post(':id/files')
  @UseInterceptors(FileInterceptor('file', { storage: undefined }))
  uploadFile(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE })],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.invoicesService.addFile(id, orgId, file);
  }

  @Delete(':id/files/:fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFile(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Param('fileId') fileId: string,
  ) {
    await this.invoicesService.removeFile(id, fileId, orgId);
  }
}
