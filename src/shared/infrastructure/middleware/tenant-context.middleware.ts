/**
 * @deprecated TenantContextMiddleware is dead code.
 *
 * Middleware runs BEFORE guards in the NestJS pipeline, so req.user
 * does not exist yet (Passport populates it inside JwtAuthGuard).
 * As a result, the middleware always hits `if (!req.user) return next()`
 * and never creates TenantContext.
 *
 * TenantContext is created by JwtAuthGuard instead.
 * This file is kept only for backward-compatible re-exports.
 */

export type { TenantContext } from 'src/shared/infrastructure/types/tenant-context.interface';
