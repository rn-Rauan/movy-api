import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { DomainError } from "../errors/domain.error";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let error = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "object") {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error;
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof DomainError) {
      message = exception.message;
      switch (exception.code) {
        case "USER_NOT_FOUND":
          status = HttpStatus.NOT_FOUND;
          break;
        case "USER_EMAIL_ALREADY_EXISTS":
          status = HttpStatus.CONFLICT;
          break;
        case "INVALID_USER_NAME":
        case "INVALID_USER_TELEPHONE":
        case "INVALID_PASSWORD":
          status = HttpStatus.BAD_REQUEST;
          break;
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined
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