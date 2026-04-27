import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../../../user/domain/interfaces/user.repository';
import { MembershipRepository } from 'src/modules/membership/domain/interfaces/membership.repository';
import { JwtPayload } from 'src/shared/infrastructure/types/jwt-payload.interface';

/**
 * Builds the enriched {@link JwtPayload} that is embedded in every access and refresh token.
 *
 * @remarks
 * Resolution order:
 * 1. Loads the user by UUID — throws if absent or `INACTIVE`.
 * 2. Checks `DEV_EMAILS` env var to set `isDev = true` for developer accounts
 *    (bypasses membership lookup).
 * 3. For non-dev users, queries `MembershipRepository.findFirstActiveByUserId`
 *    to obtain `organizationId` and `role` (B2C users get `null` for both).
 * 4. Validates that a `role` is never set without an `organizationId`.
 *
 * This service is the single source of truth for JWT payload enrichment.
 * `JwtStrategy.validate()` trusts the signed payload and performs no DB queries.
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
   * Produces a {@link JwtPayload} enriched with multi-tenant and RBAC context.
   *
   * @param userId - UUID of the authenticated user
   * @returns A fully populated {@link JwtPayload} ready to be signed by `JwtService`
   * @throws `Error('User not found or inactive')` if the user does not exist or is `INACTIVE`
   * @throws `Error('Invalid user context: ...')` if a role is present without an `organizationId`
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
