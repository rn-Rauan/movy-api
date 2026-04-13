import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from 'src/shared/infrastructure/types/jwt-payload.interface';

/**
 * JWT Strategy usando Passport
 *
 * ✅ RESPONSABILIDADE: Apenas VALIDAR o JWT já enriquecido
 *
 * ✅ O enriquecimento do JWT (organizationId, role, isDev) é feito:
 * - Login: JwtPayloadService.enrichPayload() -> LoginUseCase gera JWT enriquecido
 * - Refresh: JwtPayloadService.enrichPayload() -> RefreshTokenUseCase gera JWT enriquecido
 * - Validação: JwtStrategy apenas retorna o payload já enriquecido
 *
 * Este padrão garante:
 * - Separação de responsabilidades (enrich vs validate)
 * - Sem N+1 queries (porque validação não busca no BD)
 * - Zero duplication (enrich logic em um só lugar)
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret',
    });
  }

  /**
   * Valida o JWT já enriquecido
   * Chamado automaticamente pelo Passport quando um JWT é recebido
   *
   * ✅ Retorna JwtPayload (tipado para req.user via Express.User)
   *
   * O payload já contém:
   * - sub, id, email (identificação)
   * - organizationId (multi-tenant context)
   * - role (authorization level)
   * - isDev (developer bypass)
   * - userStatus (conta ativa/inativa)
   */
  async validate(payload: any): Promise<JwtPayload> {
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
