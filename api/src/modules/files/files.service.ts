import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import * as Minio from 'minio';
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

  async getSignedUrl(key: string, expirySeconds = 3600): Promise<string> {
    return this.minioClient.presignedGetObject(
      this.bucket,
      key,
      expirySeconds,
    );
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
