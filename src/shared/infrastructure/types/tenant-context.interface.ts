/**
 * Interface centralizada do contexto de tenancy de uma requisição.
 * Extraído do JWT e injetado em req.context pelo TenantContextMiddleware.
 *
 * Fonte única de verdade — importar sempre deste arquivo.
 */
export interface TenantContext {
  userId: string;
  email: string;
  organizationId?: string; // undefined para B2C users ou devs
  role?: 'ADMIN' | 'DRIVER' | null;
  isDev: boolean;
}

/**
 * Estender Express Request para incluir tipo context.
 * Declaração global única — NÃO duplicar em outros arquivos.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      context?: TenantContext;
    }
  }
}
