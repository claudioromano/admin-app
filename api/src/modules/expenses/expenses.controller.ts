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
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseFiltersDto } from './dto/expense-filters.dto';
import { UpdateExpenseStatusDto } from './dto/update-expense-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrganizationRoleGuard } from '../../common/guards/organization-role.guard';
import { ExpenseFileType } from '@prisma/client';

// 20 MB máx por archivo adjunto
const MAX_FILE_SIZE = 20 * 1024 * 1024;

@Controller('organizations/:orgId/expenses')
@UseGuards(JwtAuthGuard, OrganizationRoleGuard)
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Get()
  findAll(
    @Param('orgId') orgId: string,
    @Query() filters: ExpenseFiltersDto,
  ) {
    return this.expensesService.findAll(orgId, filters);
  }

  @Get(':id')
  findOne(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.expensesService.findById(id, orgId);
  }

  @Post()
  create(
    @Param('orgId') orgId: string,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expensesService.create(orgId, dto);
  }

  @Patch(':id')
  update(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(id, orgId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('orgId') orgId: string, @Param('id') id: string) {
    await this.expensesService.delete(id, orgId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseStatusDto,
  ) {
    return this.expensesService.updateStatus(id, orgId, dto);
  }

  @Post(':id/files')
  @UseInterceptors(FileInterceptor('file', { storage: undefined }))
  uploadFile(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body('fileType') fileTypeRaw: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE })],
      }),
    )
    file: Express.Multer.File,
  ) {
    const fileType = fileTypeRaw as ExpenseFileType;
    if (!Object.values(ExpenseFileType).includes(fileType)) {
      throw new BadRequestException(
        `fileType debe ser uno de: ${Object.values(ExpenseFileType).join(', ')}`,
      );
    }
    return this.expensesService.addFile(id, orgId, file, fileType);
  }

  @Delete(':id/files/:fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFile(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Param('fileId') fileId: string,
  ) {
    await this.expensesService.removeFile(id, fileId, orgId);
  }
}
