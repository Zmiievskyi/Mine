import { registerAs } from '@nestjs/config';

export default registerAs('s3', () => ({
  endpoint: process.env.S3_ENDPOINT || 'https://s-ed1.cloud.gcore.lu',
  accessKeyId: process.env.S3_ACCESS_KEY || '',
  secretAccessKey: process.env.S3_SECRET_KEY || '',
  bucket: process.env.S3_BUCKET || 'minegnk-kyc-documents',
  region: process.env.S3_REGION || 'eu-central-1',
  // Presigned URL expiration in seconds (default: 1 hour)
  presignedUrlExpiration: parseInt(
    process.env.S3_PRESIGNED_URL_EXPIRATION || '3600',
    10,
  ),
}));
