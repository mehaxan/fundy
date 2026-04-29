import { Injectable, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3 } from "./storage.module";

@Injectable()
export class StorageService {
  private readonly bucket: string;

  constructor(
    @Inject(S3) private readonly s3: S3Client,
    private readonly config: ConfigService,
  ) {
    this.bucket = config.getOrThrow("TIGRIS_BUCKET");
  }

  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 300,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  async getPresignedDownloadUrl(
    key: string,
    expiresIn = 3600,
  ): Promise<string> {
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  receiptKey(transactionId: string, filename: string): string {
    return `receipts/${transactionId}/${filename}`;
  }

  avatarKey(userId: string, filename: string): string {
    return `avatars/${userId}/${filename}`;
  }

  documentKey(fundId: string, filename: string): string {
    return `documents/${fundId}/${filename}`;
  }
}
