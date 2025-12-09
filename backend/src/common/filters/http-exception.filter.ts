import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, message, error } = this.getErrorDetails(exception);

    const errorResponse: ErrorResponse = {
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logError(exception, request, statusCode);

    response.status(statusCode).json(errorResponse);
  }

  private getErrorDetails(exception: unknown): {
    statusCode: number;
    message: string;
    error: string;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'object' && response !== null) {
        const responseObj = response as Record<string, unknown>;
        return {
          statusCode: status,
          message: this.getUserFriendlyMessage(
            status,
            responseObj['message'] as string | string[],
          ),
          error: (responseObj['error'] as string) || exception.name,
        };
      }

      return {
        statusCode: status,
        message: this.getUserFriendlyMessage(status, String(response)),
        error: exception.name,
      };
    }

    // Unknown errors
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred. Please try again later.',
      error: 'Internal Server Error',
    };
  }

  private getUserFriendlyMessage(
    status: number,
    originalMessage: string | string[],
  ): string {
    const message = Array.isArray(originalMessage)
      ? originalMessage[0]
      : originalMessage;

    const friendlyMessages: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: message || 'Invalid request. Please check your input.',
      [HttpStatus.UNAUTHORIZED]: 'Please log in to access this resource.',
      [HttpStatus.FORBIDDEN]: 'You do not have permission to access this resource.',
      [HttpStatus.NOT_FOUND]: message || 'The requested resource was not found.',
      [HttpStatus.CONFLICT]: message || 'This resource already exists.',
      [HttpStatus.TOO_MANY_REQUESTS]:
        'Too many requests. Please wait a moment and try again.',
      [HttpStatus.INTERNAL_SERVER_ERROR]:
        'An unexpected error occurred. Please try again later.',
      [HttpStatus.SERVICE_UNAVAILABLE]:
        'Service temporarily unavailable. Please try again later.',
      [HttpStatus.GATEWAY_TIMEOUT]:
        'The request timed out. Please try again later.',
    };

    return friendlyMessages[status] || message || 'An error occurred.';
  }

  private logError(
    exception: unknown,
    request: Request,
    statusCode: number,
  ): void {
    const logMessage = `[${request.method}] ${request.url} - ${statusCode}`;

    if (statusCode >= 500) {
      this.logger.error(logMessage, exception instanceof Error ? exception.stack : '');
    } else if (statusCode >= 400) {
      this.logger.warn(logMessage);
    }
  }
}
