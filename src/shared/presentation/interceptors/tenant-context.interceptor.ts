import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
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
 * TENANT CONTEXT INTERCEPTOR
 *
 * ✅ Executa APÓS JwtAuthGuard (diferente de Middleware que executa antes)
 * Extrai organizationId, role, isDev do JWT já validado
 * Injeta em req.context para uso nos controllers
 *
 * Vantagem sobre Middleware:
 * - Executa DEPOIS que req.user foi populado pelo JwtAuthGuard
 * - Pode ser seletivamente aplicado a rotas específicas
 * - Melhor ordem de execução no pipeline do NestJS
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    // Step 1: Se não há user (rota pública), skip
    if (!request.user) {
      return next.handle();
    }

    // Step 2: Extrair contexto do JWT validado
    // req.user foi populado pelo JwtAuthGuard com JwtPayload
    const jwtPayload = request.user as JwtPayload;

    // Step 3: Criar context com valores seguros (todos são optional)
    const tenantContext: TenantContext = {
      userId: jwtPayload.sub || jwtPayload.id, // Fallback para compatibilidade
      email: jwtPayload.email || 'unknown@unknown.com',
      organizationId: jwtPayload.organizationId,
      role: jwtPayload.role,
      isDev: jwtPayload.isDev || false, // Default para false se não existir
    };

    // Step 4: Validar coerência (role requires organizationId or isDev)
    if (!tenantContext.isDev && tenantContext.role && !tenantContext.organizationId) {
      throw new BadRequestException(
        'Invalid tenant context: role requires organizationId or isDev flag'
      );
    }

    // Step 5: Injetar no request
    request.context = tenantContext;

    // Step 6: Logging para diagnóstico
    console.log(
      `[TenantContext] userId=${tenantContext.userId}, org=${tenantContext.organizationId || 'B2C'}, role=${tenantContext.role || 'none'}, isDev=${tenantContext.isDev}`
    );

    return next.handle();
  }
}
