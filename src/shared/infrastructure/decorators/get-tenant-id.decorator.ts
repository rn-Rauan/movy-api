import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Parameter decorator that extracts `organizationId` from the request's
 * {@link TenantContext} (`req.context`).
 *
 * @remarks
 * Use this when a controller action only needs the tenant ID and not the full
 * user context. Throws `BadRequestException` for B2C users (no `organizationId`).
 *
 * Usage: `@GetTenantId() tenantId: string`
 */
export const GetTenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();

    if (!request.context?.organizationId) {
      throw new BadRequestException(
        'Only organization members can access this resource. No organizationId in context.',
      );
    }

    return request.context.organizationId;
  },
);
