/**
 * Shape of the JWT payload after signature verification by `JwtStrategy`.
 *
 * @remarks
 * Returned by `JwtStrategy.validate()` and injected into `req.user` by Passport.
 * The payload is enriched at sign time by `JwtPayloadService` with multi-tenant
 * and RBAC fields — `JwtStrategy` performs no DB queries.
 *
 * | Field | Notes |
 * |---|---|
 * | `sub` | User UUID (standard JWT subject) |
 * | `id` | Alias for `sub` — convenience for downstream code |
 * | `email` | User email |
 * | `organizationId` | First active membership org; `undefined` for B2C users |
 * | `role` | Role in `organizationId`; `null` for B2C/dev users |
 * | `isDev` | `true` when email is in `DEV_EMAILS` env var |
 * | `userStatus` | `'ACTIVE' \| 'INACTIVE'` |
 */
export interface JwtPayload {
  sub: string;
  id: string;
  email: string;
  organizationId?: string;
  role?: 'ADMIN' | 'DRIVER' | null;
  isDev: boolean;
  userStatus: string;
}

/**
 * Augments the global Express `User` type so that `req.user`
 * is correctly typed as {@link JwtPayload} after Passport validation.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends JwtPayload {}
  }
}
