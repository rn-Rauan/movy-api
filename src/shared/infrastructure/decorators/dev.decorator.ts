import { SetMetadata } from '@nestjs/common';

/** Metadata key read by {@link DevGuard} to detect dev-only routes. */
export const DEV_ONLY_KEY = 'devOnly';

/**
 * Marks a route as accessible only to developer accounts (`isDev = true` in JWT).
 *
 * @remarks
 * Developers are identified by the `DEV_EMAILS` env-var whitelist, set at login time.
 * Apply alongside `JwtAuthGuard` and `DevGuard`:
 *
 * ```typescript
 * @UseGuards(JwtAuthGuard, DevGuard)
 * @Dev()
 * @Get('/admin/debug')
 * async debugInfo() { ... }
 * ```
 *
 * Can also be combined with `@Roles()` — dev users bypass role checks implicitly.
 */
export const Dev = () => SetMetadata(DEV_ONLY_KEY, true);
