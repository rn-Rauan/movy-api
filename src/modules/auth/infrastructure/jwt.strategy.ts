import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRepository } from '../../user/domain/interfaces/user.repository';
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
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {
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
    // Step 1: Validar que usuário existe e está ativo
    const user = await this.userRepository.findById(payload.sub);
    if (!user || user.status === 'INACTIVE') {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Step 2: Retornar payload enriquecido (já foi enriquecido em LoginUseCase/RefreshTokenUseCase)
    const jwtPayload: JwtPayload = {
      sub: user.id,
      id: user.id,
      email: user.email,
      organizationId: payload.organizationId,
      role: payload.role,
      isDev: payload.isDev,
      userStatus: user.status,
    };
    return jwtPayload;
  }
}
