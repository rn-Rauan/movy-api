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
 * Guard that enforces tenant isolation by validating the `:organizationId`
 * route parameter against the organization in the user's JWT.
 *
 * @remarks
 * Validation steps:
 * 1. Checks that `req.context` is populated (requires `JwtAuthGuard` to run first).
 * 2. Developer accounts (`isDev = true`) bypass all checks.
 * 3. If `:organizationId` (or `:orgId`) is present in route params, it must match
 *    `req.context.organizationId` — otherwise `ForbiddenException` is thrown.
 * 4. B2C users (no `organizationId` in JWT) cannot access organization-scoped routes.
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
