import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

/**
 * Decorator para injetar TenantContext em métodos de controller
 * Uso: @GetTenantContext() context: TenantContext
 *
 * Extrai o contexto já validado pelo middleware
 * Lança BadRequestException se o middleware não tiver sido executado
 */
export const GetTenantContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    if (!request.context) {
      throw new BadRequestException(
        'TenantContext not found in request. Ensure TenantContextMiddleware is registered and request is authenticated.',
      );
    }

    return request.context;
  },
);
