import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { TenantContext } from 'src/shared/infrastructure/types/tenant-context.interface';

/**
 * Guard que valida permissões de role via @Roles() decorator.
 *
 * Lê a metadata @Roles() e compara com req.context.role.
 * Developers (isDev=true) sempre passam (bypass via @Dev() ou implícito).
 *
 * Requer que TenantContextMiddleware tenha injetado req.context.
 *
 * Uso:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles(RoleName.ADMIN, RoleName.DRIVER)
 *   async someMethod() { ... }
 *
 * Combinado com @Dev() (devs também passam mesmo sem role):
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles(RoleName.ADMIN)
 *   async someMethod() { ... }  // devs passam via isDev bypass
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
    const request = context.switchToHttp().getRequest();
    const ctx = request.context as TenantContext;

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
