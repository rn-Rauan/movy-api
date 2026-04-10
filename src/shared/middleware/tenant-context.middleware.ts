import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'src/shared/infrastructure/types/jwt-payload.interface';

/**
 * Interface que representa o contexto de tenancy de uma requisição
 * Extraído do JWT e injetado em req.context
 */
export interface TenantContext {
  userId: string;
  email: string;
  organizationId?: string;  // undefined para B2C users ou devs
  role?: 'ADMIN' | 'DRIVER' | null;
  isDev: boolean;
}

/**
 * Estender Express Request para incluir tipo context
 */
declare global {
  namespace Express {
    interface Request {
      context?: TenantContext;
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware que injeta TenantContext em todas as requisições autenticadas
 *
 * Executa APÓS JwtAuthGuard ter validado o token
 * Extrai organizationId, role, isDev do JWT
 * Valida coerência (role sem organizationId é inválido para non-dev)
 * Injeta em req.context para uso nos controllers
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Step 1: Se não há user (rota pública), skip
    if (!req.user) {
      return next();
    }

    // Step 2: Extrair contexto do JWT validado
    // req.user podem vir de JWTs antigos (sem enriquecimento) ou novos (com enriquecimento)
    const jwtPayload = req.user as JwtPayload;
    
    // Step 3: Criar context com valores seguros (todos são optional)
    const context: TenantContext = {
      userId: jwtPayload.sub || jwtPayload.id, // Fallback para compatibilidade
      email: jwtPayload.email || 'unknown@unknown.com',
      organizationId: jwtPayload.organizationId,
      role: jwtPayload.role,
      isDev: jwtPayload.isDev || false, // Default para false se não existir
    };

    // Step 4: Validar coerência (role requires organizationId or isDev)
    if (!context.isDev && context.role && !context.organizationId) {
      throw new BadRequestException(
        'Invalid tenant context: role requires organizationId or isDev flag'
      );
    }

    // Step 5: Injetar no request
    req.context = context;

    // Step 6: Logging para diagnóstico
    console.log(
      `[TenantContext] userId=${context.userId}, org=${context.organizationId || 'B2C'}, role=${context.role || 'none'}, isDev=${context.isDev}`
    );

    next();
  }
}
