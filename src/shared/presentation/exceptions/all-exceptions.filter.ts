import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainError } from '../../domain/errors/domain.error';

/**
 * Global exception filter that normalises all thrown errors into a consistent
 * JSON response shape: `{ statusCode, timestamp, path, message, error? }`.
 *
 * @remarks
 * HTTP status is derived from:
 * - `HttpException` → uses the exception's own status code
 * - `DomainError` → inferred from `code` suffix (see {@link DomainError} for mapping)
 * - Everything else → 500 Internal Server Error
 *
 * Registered globally in `SharedModule` via `APP_FILTER`.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as {
          message?: string | string[];
          error?: string;
        };
        const raw = resp.message;
        message = (Array.isArray(raw) ? raw[0] : raw) ?? exception.message;
        error = resp.error;
      } else {
        message = exceptionResponse;
      }
    } else if (exception instanceof DomainError) {
      message = exception.message;
      error = exception.code;
      const code = exception.code;

      if (code.endsWith('_NOT_FOUND')) {
        status = HttpStatus.NOT_FOUND;
      } else if (code.endsWith('_ALREADY_EXISTS')) {
        status = HttpStatus.CONFLICT;
      } else if (code.startsWith('INVALID_') || code.endsWith('_BAD_REQUEST')) {
        status = HttpStatus.BAD_REQUEST;
      } else if (code.endsWith('_FORBIDDEN')) {
        status = HttpStatus.FORBIDDEN;
      } else if (code.endsWith('_UNAUTHORIZED')) {
        status = HttpStatus.UNAUTHORIZED;
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      ...(error && { error }),
    });
  }
}
