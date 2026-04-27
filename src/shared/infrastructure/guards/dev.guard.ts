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
 * Guard that restricts route access to developer accounts (`isDev = true`).
 *
 * @remarks
 * Works in tandem with the {@link Dev} decorator. If `@Dev()` is not present on
 * the route, the guard allows the request through unconditionally.
 * If `@Dev()` is present, only users whose JWT carries `isDev = true` pass.
 *
 * Must be applied after `JwtAuthGuard` so that `req.context` is already populated.
 *
 * ```typescript
 * @UseGuards(JwtAuthGuard, DevGuard)
 * @Dev()
 * @Get('/admin/debug')
 * async debugInfo() { ... }
 * ```
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
