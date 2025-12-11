import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Req,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UploadsService } from './uploads.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('kyc')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload KYC document to S3' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'KYC document (PDF, JPG, PNG, max 10MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', example: 's3://minegnk-kyc-documents/kyc/user123_1234567890_abc12345_document.pdf' },
        key: { type: 'string', example: 'kyc/user123_1234567890_abc12345_document.pdf' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(new BadRequestException('Only PDF, JPG, and PNG files are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadKycDocument(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({ fileType: /(pdf|jpeg|jpg|png)$/i }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ url: string; key: string }> {
    const userId = req.user.id;
    const filename = this.uploadsService.generateFilename(userId, file.originalname);

    try {
      const result = await this.uploadsService.uploadFile(
        file.buffer,
        filename,
        file.mimetype,
        'kyc',
      );

      return {
        url: result.url,
        key: result.key,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Get('kyc/*key')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get presigned URL for KYC document (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Presigned URL for document download',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Presigned URL valid for download' },
        expiresIn: { type: 'number', example: 3600, description: 'URL expiration in seconds' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getKycDocumentUrl(
    @Param('key') key: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ url: string; expiresIn: number }> {
    // Ensure key has kyc/ prefix
    const fullKey = key.startsWith('kyc/') ? key : `kyc/${key}`;

    const exists = await this.uploadsService.fileExists(fullKey);
    if (!exists) {
      throw new NotFoundException('File not found');
    }

    // Audit log for compliance
    this.uploadsService.logDocumentAccess(req.user.id, fullKey);

    const url = await this.uploadsService.getPresignedUrl(fullKey);
    const expiresIn = this.uploadsService.getPresignedUrlExpiration();

    return { url, expiresIn };
  }

  @Get('kyc-url')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get presigned URL from stored S3 URL (admin only)' })
  @ApiQuery({ name: 'path', description: 'Stored S3 URL (s3://bucket/key)' })
  @ApiResponse({
    status: 200,
    description: 'Presigned URL for document download',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Presigned URL valid for download' },
        expiresIn: { type: 'number', example: 3600, description: 'URL expiration in seconds' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getPresignedUrlFromPath(
    @Query('path') storedPath: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ url: string; expiresIn: number }> {
    if (!storedPath) {
      throw new BadRequestException('Path is required');
    }

    const key = this.uploadsService.extractKeyFromUrl(storedPath);
    if (!key) {
      throw new BadRequestException('Invalid file path format');
    }

    const exists = await this.uploadsService.fileExists(key);
    if (!exists) {
      throw new NotFoundException('File not found');
    }

    // Audit log for compliance
    this.uploadsService.logDocumentAccess(req.user.id, key);

    const url = await this.uploadsService.getPresignedUrl(key);
    const expiresIn = this.uploadsService.getPresignedUrlExpiration();

    return { url, expiresIn };
  }
}
