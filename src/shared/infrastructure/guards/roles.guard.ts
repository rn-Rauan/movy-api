import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Request } from 'express';

/**
 * Guard that enforces role-based access control via the {@link Roles} decorator.
 *
 * @remarks
 * Reads `@Roles(...)` metadata from the route handler and compares it against
 * `req.context.role`. Developer accounts (`isDev = true`) bypass all role checks.
 * Routes without `@Roles()` are allowed unconditionally.
 *
 * Must be applied after `JwtAuthGuard` so that `req.context` is already populated.
 *
 * ```typescript
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(RoleName.ADMIN)
 * async adminOnlyRoute() { ... }
 * ```
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Step 1: Obter roles requeridas da metadata @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Step 2: Se não há @Roles(), permitir (rota sem restrição de role)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Step 3: Extrair contexto do request
    const request = context.switchToHttp().getRequest<Request>();
    const ctx = request.context;

    // Step 4: Validar que middleware injetou contexto
    if (!ctx) {
      throw new BadRequestException(
        'TenantContext required for role validation. Ensure TenantContextMiddleware is registered.',
      );
    }

    // Step 5: Developers sempre passam (bypass implícito)
    if (ctx.isDev) {
      return true;
    }

    // Step 6: Validar se user tem um dos roles requeridos
    if (!ctx.role || !requiredRoles.includes(ctx.role)) {
      throw new ForbiddenException(
        `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
