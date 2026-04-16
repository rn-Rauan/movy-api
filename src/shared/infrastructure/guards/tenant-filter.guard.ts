import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Guard que valida que recursos pertencem ao tenant do usuário
 *
 * Valida:
 * 1. :organizationId param bate com JWT organizationId
 * 2. Impede que B2C users acessem recursos de organizações
 * 3. Developers (isDev=true) fazem bypass
 *
 * Uso: @UseGuards(TenantFilterGuard)
 *      @Get('/organizations/:organizationId/vehicles')
 */
@Injectable()
export class TenantFilterGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const ctx = request.context;
    Logger.log(ctx, 'TenantFilterGuard - TenantContext');

    // Step 1: Validar que middleware injetou contexto
    if (!ctx) {
      throw new BadRequestException(
        'TenantContext not found. Ensure TenantContextMiddleware is registered.',
      );
    }

    // Step 2: Developers (isDev=true) bypass tudo
    if (ctx.isDev) {
      return true;
    }

    // Step 3: Procurar por organizationId no request
    const organizationIdParam =
      request.params.organizationId ||
      request.params.orgId ||
      request.query.organizationId;

    // Step 4: Se rota especifica organização, validar match
    if (organizationIdParam) {
      if (organizationIdParam !== ctx.organizationId) {
        throw new ForbiddenException('You do not have access to this resource');
      }
    } else if (!ctx.organizationId) {
      // Step 5: Usuário B2C (sem org) não pode acessar rotas protegidas por tenant
      throw new ForbiddenException(
        'Organization members only. B2C users cannot access this resource.',
      );
    }

    return true;
  }
}
