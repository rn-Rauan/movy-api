/**
 * Request-scoped tenant context built from the decoded {@link JwtPayload}.
 *
 * @remarks
 * Populated by `JwtAuthGuard` immediately after token validation and stored
 * in `req.context`. All downstream guards (`RolesGuard`, `TenantFilterGuard`,
 * `DevGuard`) and controllers read from this interface — never from `req.user`.
 * This is the single source of truth for per-request identity.
 */
export interface TenantContext {
  userId: string;
  email: string;
  organizationId?: string; // undefined para B2C users ou devs
  role?: 'ADMIN' | 'DRIVER' | null;
  isDev: boolean;
}

/**
 * Augments the global Express `Request` type to include the typed
 * `context` property set by `JwtAuthGuard`.
 * This declaration must not be duplicated in other files.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      context?: TenantContext;
    }
  }
}
