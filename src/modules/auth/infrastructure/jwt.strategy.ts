import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from 'src/shared/infrastructure/types/jwt-payload.interface';

/**
 * Passport JWT strategy for validating bearer tokens on every protected request.
 *
 * @remarks
 * Responsibility: **validate only** — no database queries.
 * The payload was enriched with `organizationId`, `role`, `isDev`, and `userStatus`
 * at login/refresh time by {@link JwtPayloadService}. `validate()` simply returns
 * the decoded payload as `req.user` (`TenantContext`).
 *
 * This design avoids N+1 DB queries on every authenticated request and keeps
 * enrichment logic in a single place.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Called automatically by Passport after verifying the token signature.
   * Returns the decoded payload verbatim as `req.user`.
   *
   * @param payload - The decoded and verified {@link JwtPayload}
   * @returns The same payload, cast to `TenantContext` by `GetUser` decorator
   */
  validate(payload: JwtPayload): JwtPayload {
    // Trust the JWT payload to avoid DB query on every request.
    // The payload was enriched during login/refresh.
    return {
      sub: payload.sub,
      id: payload.id,
      email: payload.email,
      organizationId: payload.organizationId,
      role: payload.role,
      isDev: payload.isDev,
      userStatus: payload.userStatus,
    };
  }
}
