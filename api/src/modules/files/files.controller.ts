import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  private readonly logger = new Logger(FilesController.name);

  constructor(private filesService: FilesService) {}

  /**
   * Descarga un archivo de MinIO y lo sirve directamente al browser como
   * proxy, con los headers Content-Type y Content-Disposition correctos.
   * El browser nunca interactúa con MinIO directamente.
   *
   * GET /files?key=invoices/uuid/filename.pdf&filename=nombre-original.pdf
   */
  @Get()
  async streamFile(
    @Query('key') key: string,
    @Query('filename') filename: string | undefined,
    @Res() res: Response,
  ) {
    if (!key) {
      res.status(400).json({ message: 'key requerido' });
      return;
    }

    try {
      const { stream, contentType, size } = await this.filesService.getFileStream(key);

      const safeFilename = (filename || 'file').replace(/["\\\r\n]/g, '_');

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
      if (size) res.setHeader('Content-Length', size);

      stream.pipe(res);
    } catch (err) {
      this.logger.error(`Error al obtener archivo '${key}': ${(err as Error).message}`);
      if (!res.headersSent) {
        res.status(404).json({ message: 'Archivo no encontrado' });
      }
    }
  }
}
