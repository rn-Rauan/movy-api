import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import type { TenantContext } from '../types/tenant-context.interface';

/**
 * Decorator to get the current user context from the request.
 * The context is injected by JwtAuthGuard.
 *
 * Usage: @GetUser() user: TenantContext
 */
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TenantContext => {
    const request = ctx.switchToHttp().getRequest<Request>();

    if (!request.context) {
      throw new BadRequestException(
        'TenantContext not found in request. Ensure JwtAuthGuard is applied.',
      );
    }

    return request.context;
  },
);
