import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { StorageService } from './storage.service';

export const S3 = Symbol('S3');

@Global()
@Module({
  providers: [
    {
      provide: S3,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new S3Client({
          region: config.get('TIGRIS_REGION', 'auto'),
          endpoint: config.getOrThrow('TIGRIS_ENDPOINT'),
          credentials: {
            accessKeyId: config.getOrThrow('TIGRIS_ACCESS_KEY_ID'),
            secretAccessKey: config.getOrThrow('TIGRIS_SECRET_ACCESS_KEY'),
          },
        }),
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
