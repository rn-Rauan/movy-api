import { createParamDecorator, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * Decorator para injetar apenas o tenantId do contexto
 * Uso: @GetTenantId() tenantId: string
 *
 * Útil em rotas onde você quer apenas o organizationId
 * Lança ForbiddenException se user é B2C (sem organizationId)
 */
export const GetTenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();

    if (!request.context?.organizationId) {
      throw new ForbiddenException(
        'Only organization members can access this resource'
      );
    }

    return request.context.organizationId;
  }
);
