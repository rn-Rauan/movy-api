import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContext } from '../types/tenant-context.interface';

/**
 * Decorator to get the current user context from the request.
 * The context is injected by the TenantContextMiddleware.
 *
 * Usage: @GetUser() user: TenantContext
 */
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TenantContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.context;
  },
);
