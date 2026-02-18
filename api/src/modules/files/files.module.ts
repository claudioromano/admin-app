import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { MinioProvider } from './minio.provider';

@Module({
  controllers: [FilesController],
  providers: [MinioProvider, FilesService],
  exports: [FilesService],
})
export class FilesModule {}
