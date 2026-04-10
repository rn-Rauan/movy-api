import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../../../user/domain/interfaces/user.repository';
import { MembershipRepository } from 'src/modules/membership/domain/interfaces/membership.repository';
import { JwtPayload } from 'src/shared/infrastructure/types/jwt-payload.interface';

/**
 * SERVICE: JWT PAYLOAD ENRICHMENT
 *
 * Responsável por enriquecer o payload do JWT com:
 * - organizationId (do primeiro membership ativo)
 * - role (role naquela organização)
 * - isDev (detectado da whitelist DEV_EMAILS)
 * - userStatus
 *
 * Usado pelos use-cases de Login e Register
 */
@Injectable()
export class JwtPayloadService {
  private readonly logger = new Logger(JwtPayloadService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly membershipRepository: MembershipRepository,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Enriquece payload do JWT com contexto multi-tenant e RBAC
   *
   * @param userId ID do usuário
   * @returns JwtPayload enriquecido pronto para assinar
   *
   * @throws Error se usuário não existir ou estiver inativo
   */
  async enrichPayload(userId: string): Promise<JwtPayload> {
    this.logger.debug(`[Enriching JWT Payload] userId=${userId}`);

    // Step 1: Buscar usuário
    const user = await this.userRepository.findById(userId);
    if (!user || user.status === 'INACTIVE') {
      this.logger.warn(
        `[Enriching JWT Payload] User not found or inactive: ${userId}`,
      );
      throw new Error('User not found or inactive');
    }

    // Step 2: Detectar se é developer
    const devEmailsEnv = this.configService.get<string>('DEV_EMAILS') || '';
    const devEmails = devEmailsEnv
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0);
    const isDev = devEmails.includes(user.email);

    this.logger.debug(
      `[Enriching JWT Payload] isDev=${isDev}, email=${user.email}`,
    );

    // Step 3: Determinar organizationId e role
    let organizationId: string | undefined;
    let role: 'ADMIN' | 'DRIVER' | null = null;

    if (!isDev) {
      // Buscar primeira membership ativa
      const membership =
        await this.membershipRepository.findFirstActiveByUserId(userId);
      if (membership) {
        organizationId = membership.organizationId;
        role = membership.role.name;
        this.logger.debug(
          `[Enriching JWT Payload] membership found: org=${organizationId}, role=${role}`,
        );
      } else {
        this.logger.debug(
          `[Enriching JWT Payload] No active membership found (B2C user)`,
        );
      }
    } else {
      this.logger.debug(
        `[Enriching JWT Payload] Skipping membership lookup for dev user`,
      );
    }

    // Step 4: Validar coerência
    if (!isDev && role && !organizationId) {
      this.logger.warn(
        `[Enriching JWT Payload] INVALID STATE - role without organizationId`,
      );
      throw new Error(
        'Invalid user context: role requires organizationId or isDev flag',
      );
    }

    // Step 5: Criar payload enriquecido
    const jwtPayload: JwtPayload = {
      sub: user.id,
      id: user.id,
      email: user.email,
      organizationId,
      role,
      isDev,
      userStatus: user.status,
    };

    this.logger.log(
      `[Enriching JWT Payload] SUCCESS: sub=${jwtPayload.sub}, org=${organizationId || 'B2C'}, role=${role || 'none'}, isDev=${isDev}`,
    );

    return jwtPayload;
  }
}
