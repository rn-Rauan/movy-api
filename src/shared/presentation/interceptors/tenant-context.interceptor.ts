/**
 * @deprecated Use TenantContextMiddleware em vez deste interceptor.
 *
 * O middleware executa ANTES dos guards no pipeline do NestJS,
 * garantindo que req.context esteja disponível para RolesGuard,
 * TenantFilterGuard e DevGuard.
 *
 * Registrado em AppModule.configure() via:
 *   consumer.apply(TenantContextMiddleware).forRoutes('*');
 *
 * Este arquivo é mantido apenas para referência e compatibilidade.
 * NÃO registrar como APP_INTERCEPTOR.
 */

// Re-exports para compatibilidade de imports antigos
export type { TenantContext } from 'src/shared/infrastructure/types/tenant-context.interface';
export { TenantContextMiddleware } from 'src/shared/infrastructure/middleware/tenant-context.middleware';
