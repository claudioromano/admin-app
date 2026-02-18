import { Provider } from '@nestjs/common';
import * as Minio from 'minio';

export const MINIO_CLIENT = 'MINIO_CLIENT';

export const MinioProvider: Provider = {
  provide: MINIO_CLIENT,
  useFactory: () => {
    return new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || '',
      secretKey: process.env.MINIO_SECRET_KEY || '',
    });
  },
};
