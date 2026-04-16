import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DEV_ONLY_KEY } from '../decorators/dev.decorator';
import { Request } from 'express';

/**
 * Guard que restringe acesso apenas a desenvolvedores (isDev=true).
 *
 * Usado com o decorator @Dev() para marcar rotas exclusivas de dev.
 * Requer que TenantContextMiddleware tenha injetado req.context.
 *
 * Uso:
 *   @UseGuards(JwtAuthGuard, DevGuard)
 *   @Dev()
 *   @Get('/debug/info')
 *   async debugInfo() { ... }
 *
 * Se @Dev() NÃO estiver presente na rota, o guard permite acesso (não bloqueia).
 * Se @Dev() ESTIVER presente, apenas usuários com isDev=true passam.
 */
@Injectable()
export class DevGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Step 1: Verificar se @Dev() está presente nesta rota
    const isDevOnly = this.reflector.getAllAndOverride<boolean>(DEV_ONLY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Step 2: Se não tem @Dev(), permite (não é rota exclusiva de dev)
    if (!isDevOnly) {
      return true;
    }

    // Step 3: Extrair contexto do request
    const request = context.switchToHttp().getRequest<Request>();
    const ctx = request.context;

    // Step 4: Validar que middleware injetou contexto
    if (!ctx) {
      throw new BadRequestException(
        'TenantContext required for dev validation. Ensure TenantContextMiddleware is registered.',
      );
    }

    // Step 5: Verificar se é dev
    if (!ctx.isDev) {
      throw new ForbiddenException('Access restricted to developers only.');
    }

    return true;
  }
}
