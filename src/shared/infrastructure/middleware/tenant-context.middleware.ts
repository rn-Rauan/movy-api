import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'src/shared/infrastructure/types/jwt-payload.interface';
import { TenantContext } from 'src/shared/infrastructure/types/tenant-context.interface';

// Re-export para manter compatibilidade de imports existentes
export type { TenantContext } from 'src/shared/infrastructure/types/tenant-context.interface';

/**
 * Middleware que injeta TenantContext em todas as requisições autenticadas.
 *
 * Pipeline NestJS: Middleware → Guards → Interceptors → Controller
 *
 * Este middleware executa ANTES dos guards, garantindo que req.context
 * esteja disponível para RolesGuard, TenantFilterGuard e DevGuard.
 *
 * Extrai organizationId, role, isDev do JWT já validado pelo Passport.
 * Valida coerência (role sem organizationId é inválido para non-dev).
 * Injeta em req.context para uso em guards, interceptors e controllers.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantContextMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Step 1: Se não há user (rota pública), skip
    if (!req.user) {
      return next();
    }

    // Step 2: Extrair contexto do JWT validado
    const jwtPayload = req.user as JwtPayload;

    // Step 3: Criar context com valores seguros
    const context: TenantContext = {
      userId: jwtPayload.sub || jwtPayload.id,
      email: jwtPayload.email || 'unknown@unknown.com',
      organizationId: jwtPayload.organizationId,
      role: jwtPayload.role,
      isDev: jwtPayload.isDev || false,
    };

    // Step 4: Validar coerência (role requires organizationId or isDev)
    if (!context.isDev && context.role && !context.organizationId) {
      throw new BadRequestException(
        'Invalid tenant context: role requires organizationId or isDev flag',
      );
    }

    // Step 5: Injetar no request
    req.context = context;

    // Step 6: Logging para diagnóstico
    this.logger.debug(
      `[TenantContext] userId=${context.userId}, org=${context.organizationId || 'B2C'}, role=${context.role || 'none'}, isDev=${context.isDev}`,
    );

    next();
  }
}
