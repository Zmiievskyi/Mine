import {
  Injectable,
  Logger,
  OnModuleInit,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as path from 'path';
import { Readable } from 'stream';
import * as crypto from 'crypto';

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
}

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const MAX_FILENAME_LENGTH = 50;

@Injectable()
export class UploadsService implements OnModuleInit {
  private readonly logger = new Logger(UploadsService.name);
  private s3Client: S3Client | null = null;
  private bucket: string;
  private presignedUrlExpiration: number;

  constructor(private readonly configService: ConfigService) {}

  public onModuleInit(): void {
    const endpoint = this.configService.get<string>('s3.endpoint');
    const accessKeyId = this.configService.get<string>('s3.accessKeyId');
    const secretAccessKey = this.configService.get<string>('s3.secretAccessKey');
    this.bucket = this.configService.get<string>('s3.bucket') ?? 'minegnk-kyc-documents';
    this.presignedUrlExpiration =
      this.configService.get<number>('s3.presignedUrlExpiration') ?? 3600;

    if (!accessKeyId || !secretAccessKey) {
      this.logger.warn(
        'S3 credentials not configured. File uploads will fail. Set S3_ACCESS_KEY and S3_SECRET_KEY.',
      );
      return;
    }

    this.s3Client = new S3Client({
      endpoint,
      region: this.configService.get<string>('s3.region') ?? 'eu-central-1',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Required for Gcore S3-compatible storage
    });

    this.logger.debug('S3 client initialized');
  }

  public getPresignedUrlExpiration(): number {
    return this.presignedUrlExpiration;
  }

  private ensureS3Client(): S3Client {
    if (!this.s3Client) {
      throw new InternalServerErrorException(
        'S3 client not initialized. Check S3_ACCESS_KEY and S3_SECRET_KEY environment variables.',
      );
    }
    return this.s3Client;
  }

  private handleS3Error(error: unknown, operation: string): never {
    if (error instanceof S3ServiceException) {
      const errorName = error.name;
      this.logger.error(`S3 ${operation} failed: ${errorName} - ${error.message}`);

      switch (errorName) {
        case 'NoSuchBucket':
          throw new InternalServerErrorException('Storage bucket not configured correctly');
        case 'InvalidAccessKeyId':
        case 'SignatureDoesNotMatch':
          throw new InternalServerErrorException('Storage credentials invalid');
        case 'AccessDenied':
          throw new InternalServerErrorException('Storage access denied');
        case 'NoSuchKey':
          throw new InternalServerErrorException('File not found in storage');
        default:
          throw new InternalServerErrorException(`Storage error: ${error.message}`);
      }
    }

    if (error instanceof Error) {
      this.logger.error(`S3 ${operation} failed: ${error.message}`);
      throw new InternalServerErrorException(`Storage error: ${error.message}`);
    }

    throw new InternalServerErrorException('Unknown storage error');
  }

  public async uploadFile(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    folder: string = 'kyc',
  ): Promise<UploadResult> {
    const client = this.ensureS3Client();
    const key = `${folder}/${filename}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    });

    try {
      await client.send(command);
      this.logger.log(`File uploaded to S3: ${key}`);

      return {
        key,
        url: `s3://${this.bucket}/${key}`,
        bucket: this.bucket,
      };
    } catch (error) {
      this.handleS3Error(error, 'upload');
    }
  }

  public async getPresignedUrl(key: string): Promise<string> {
    const client = this.ensureS3Client();

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      return await getSignedUrl(client, command, {
        expiresIn: this.presignedUrlExpiration,
      });
    } catch (error) {
      this.handleS3Error(error, 'presign');
    }
  }

  public async getPresignedUploadUrl(
    filename: string,
    mimeType: string,
    folder: string = 'kyc',
  ): Promise<{ uploadUrl: string; key: string }> {
    const client = this.ensureS3Client();
    const key = `${folder}/${filename}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    });

    try {
      const uploadUrl = await getSignedUrl(client, command, {
        expiresIn: this.presignedUrlExpiration,
      });

      return { uploadUrl, key };
    } catch (error) {
      this.handleS3Error(error, 'presign upload');
    }
  }

  public async fileExists(key: string): Promise<boolean> {
    const client = this.ensureS3Client();

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await client.send(command);
      return true;
    } catch (error) {
      if (error instanceof S3ServiceException && error.name === 'NotFound') {
        return false;
      }
      // For other errors, also return false but log it
      this.logger.warn(`Error checking file existence: ${key}`, error);
      return false;
    }
  }

  public async getFileStream(key: string): Promise<Readable> {
    const client = this.ensureS3Client();

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      const response = await client.send(command);
      return response.Body as Readable;
    } catch (error) {
      this.handleS3Error(error, 'download');
    }
  }

  public async deleteFile(key: string): Promise<void> {
    const client = this.ensureS3Client();

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      await client.send(command);
      this.logger.log(`File deleted from S3: ${key}`);
    } catch (error) {
      this.handleS3Error(error, 'delete');
    }
  }

  public generateFilename(userId: string, originalName: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex'); // 8 char random string

    // Extract and validate extension
    const ext = path.extname(originalName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(
        `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
      );
    }

    // Sanitize basename: remove extension, clean characters, limit length
    const basename = path
      .basename(originalName, ext)
      .replace(/[^a-zA-Z0-9-]/g, '_')
      .replace(/_{2,}/g, '_') // Collapse multiple underscores
      .substring(0, MAX_FILENAME_LENGTH);

    return `${userId}_${timestamp}_${random}_${basename}${ext}`;
  }

  public extractKeyFromUrl(url: string): string | null {
    // Handle s3:// URLs
    if (url.startsWith('s3://')) {
      const parts = url.replace('s3://', '').split('/');
      return parts.slice(1).join('/');
    }
    // Handle /api/uploads/kyc/filename format (legacy)
    const match = url.match(/\/api\/uploads\/kyc\/(.+)/);
    if (match) {
      return `kyc/${match[1]}`;
    }
    return null;
  }

  public logDocumentAccess(adminId: string, key: string): void {
    this.logger.log(`[AUDIT] Admin ${adminId} accessed KYC document: ${key}`);
  }
}
