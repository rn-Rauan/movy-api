import {
  Injectable,
  ExecutionContext,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayload } from 'src/shared/infrastructure/types/jwt-payload.interface';
import { TenantContext } from 'src/shared/infrastructure/types/tenant-context.interface';

/**
 * Guard de autenticação JWT que também popula req.context (TenantContext).
 *
 * Pipeline NestJS: Middleware → Guards → Interceptors → Controller
 *
 * Como o middleware roda ANTES dos guards, não tem acesso a req.user
 * (que só é populado pelo Passport dentro deste guard).
 * Por isso a população de req.context é feita aqui, imediatamente
 * após a validação do JWT.
 *
 * Todos os guards subsequentes (RolesGuard, TenantFilterGuard, DevGuard)
 * podem ler req.context com segurança.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Step 1: Passport valida JWT e popula req.user
    const result = (await super.canActivate(context)) as boolean;
    if (!result) return false;

    // Step 2: Extrair request e payload já validado
    const request = context.switchToHttp().getRequest();
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
