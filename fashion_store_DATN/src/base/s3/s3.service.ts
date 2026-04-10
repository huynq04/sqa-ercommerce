import { Inject, Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadService {
  constructor(@Inject('S3_CLIENT') private readonly s3Client: S3Client) {}

  async uploadFile(file: Express.Multer.File) {
    const bucket = 'datn'; // nhớ tạo bucket này trong MinIO trước
    const key = `uploads/${randomUUID()}-${file.originalname}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const fileUrl = `http://localhost:9000/${bucket}/${key}`;
    return { message: 'Upload success', fileUrl };
  }
}
