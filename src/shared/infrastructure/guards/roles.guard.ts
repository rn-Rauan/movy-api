import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { TenantContext } from '../middleware/tenant-context.middleware';

/**
 * Guard que valida permissões de role via @Roles() decorator
 *
 * Lê a metadata @Roles() e compara com req.context.role
 * Developers (isDev=true) sempre passam
 *
 * Uso:
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles('ADMIN', 'DRIVER')
 * async someMethod() { ... }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Step 1: Obter roles requeridas da metadata @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Step 2: Se não há @Roles(), permitir (rota pública)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Step 3: Extrair contexto do request
    const request = context.switchToHttp().getRequest();
    const ctx = request.context as TenantContext;

    // Step 4: Validar que middleware injetou contexto
    if (!ctx) {
      throw new BadRequestException(
        'TenantContext required for role validation'
      );
    }

    // Step 5: Developers sempre passam
    if (ctx.isDev) {
      return true;
    }

    // Step 6: Validar se user tem um dos roles requeridos
    if (!ctx.role || !requiredRoles.includes(ctx.role)) {
      throw new ForbiddenException(
        `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`
      );
    }

    return true;
  }
}
