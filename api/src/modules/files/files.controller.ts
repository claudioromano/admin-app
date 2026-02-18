import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private filesService: FilesService) {}

  /**
   * Devuelve una URL firmada (presigned) de MinIO para descargar o
   * previsualizar el archivo. El cliente puede redirigir a esta URL
   * directamente.
   *
   * GET /files/:key
   * La key puede contener "/" (path completo en MinIO), por lo que
   * usamos el wildcard "*" del decorador.
   */
  @Get('*')
  async getFileUrl(@Param('*') key: string) {
    const url = await this.filesService.getSignedUrl(key);
    return { url };
  }
}
