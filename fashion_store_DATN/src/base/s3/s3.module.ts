import { Module, Global } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { config } from '@config';
import { UploadController } from '@base/s3/s3.controller';
import { UploadService } from '@base/s3/s3.service';

@Global()
@Module({
  providers: [
    {
      provide: 'S3_CLIENT',
      useFactory: () => {
        return new S3Client({
          region: config.S3.REGION,
          endpoint: config.S3.ENDPOINT,
          credentials: {
            accessKeyId: config.S3.ACCESS_KEY,
            secretAccessKey: config.S3.SECRET_KEY,
          },
          forcePathStyle: true,
        });
      },
    },
    UploadService,
  ],
  controllers: [UploadController],
  exports: ['S3_CLIENT', UploadService],
})
export class S3Module {}
