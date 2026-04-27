import {
  Injectable,
  ExecutionContext,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import type { JwtPayload } from 'src/shared/infrastructure/types/jwt-payload.interface';
import type { TenantContext } from 'src/shared/infrastructure/types/tenant-context.interface';

/**
 * JWT authentication guard that validates the bearer token and populates
 * `req.context` ({@link TenantContext}) for all downstream guards.
 *
 * @remarks
 * NestJS pipeline order: Middleware → **Guards** → Interceptors → Controller
 *
 * Because middleware runs before guards, `req.user` (set by Passport) is not
 * yet available there. `JwtAuthGuard` is therefore the correct place to build
 * `TenantContext`, immediately after token validation.
 *
 * `RolesGuard`, `TenantFilterGuard`, and `DevGuard` all read `req.context`
 * and must therefore be applied after this guard.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Step 1: Passport valida JWT e popula req.user
    const result = (await super.canActivate(context)) as boolean;
    if (!result) return false;

    // Step 2: Extrair request e payload já validado
    const request = context.switchToHttp().getRequest<Request>();
    const jwtPayload = request.user as JwtPayload;

    if (!jwtPayload) return true; // Rota pública (não deveria chegar aqui)

    // Step 3: Criar TenantContext a partir do JWT
    const tenantContext: TenantContext = {
      userId: jwtPayload.sub || jwtPayload.id,
      email: jwtPayload.email || 'unknown@unknown.com',
      organizationId: jwtPayload.organizationId,
      role: jwtPayload.role,
      isDev: jwtPayload.isDev || false,
    };

    // Step 4: Validar coerência (role requires organizationId or isDev)
    if (
      !tenantContext.isDev &&
      tenantContext.role &&
      !tenantContext.organizationId
    ) {
      throw new BadRequestException(
        'Invalid tenant context: role requires organizationId or isDev flag',
      );
    }

    // Step 5: Injetar no request
    request.context = tenantContext;

    this.logger.debug(
      `[TenantContext] userId=${tenantContext.userId}, org=${tenantContext.organizationId || 'B2C'}, role=${tenantContext.role || 'none'}, isDev=${tenantContext.isDev}`,
    );

    return true;
  }
}
