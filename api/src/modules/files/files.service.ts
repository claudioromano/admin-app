import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import * as Minio from 'minio';
import { Readable } from 'stream';
import { MINIO_CLIENT } from './minio.provider';

@Injectable()
export class FilesService implements OnModuleInit {
  private readonly logger = new Logger(FilesService.name);
  private readonly bucket = process.env.MINIO_BUCKET || 'adminapp';

  constructor(@Inject(MINIO_CLIENT) private minioClient: Minio.Client) {}

  async onModuleInit() {
    await this.ensureBucket();
  }

  private async ensureBucket() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucket);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucket);
        this.logger.log(`Bucket '${this.bucket}' creado`);
      }
    } catch (err) {
      this.logger.warn(`No se pudo verificar/crear el bucket: ${(err as Error).message}`);
    }
  }

  async uploadFile(
    key: string,
    buffer: Buffer,
    mimeType: string,
    size: number,
  ): Promise<void> {
    await this.minioClient.putObject(this.bucket, key, buffer, size, {
      'Content-Type': mimeType,
    });
  }

  async getFileStream(key: string): Promise<{ stream: Readable; contentType: string; size: number }> {
    const stat = await this.minioClient.statObject(this.bucket, key);
    const stream = await this.minioClient.getObject(this.bucket, key);
    const contentType =
      (stat.metaData?.['content-type'] as string | undefined) ||
      'application/octet-stream';
    return { stream, contentType, size: stat.size };
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucket, key);
    } catch (err) {
      // Si el objeto no existe, no lanzar error
      this.logger.warn(`No se pudo eliminar el objeto '${key}': ${(err as Error).message}`);
    }
  }
}
