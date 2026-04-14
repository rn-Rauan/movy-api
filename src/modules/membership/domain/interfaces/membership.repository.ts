import { Membership } from '../entities/membership.entity';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';

/**
 * DTO para response de FirstMembership (usado em JWT enrichment)
 */
export interface FirstMembershipDTO {
  userId: string;
  organizationId: string;
  role: {
    name: 'ADMIN' | 'DRIVER';
  };
}

export abstract class MembershipRepository {
  abstract save(membership: Membership): Promise<Membership>;
  abstract findByCompositeKey(
    userId: string,
    roleId: number,
    organizationId: string,
  ): Promise<Membership | null>;
  abstract findByUserId(
    userId: string,
    options: PaginationOptions,
    organizationId?: string,
  ): Promise<PaginatedResponse<Membership>>;
  abstract findByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Membership>>;
  abstract update(membership: Membership): Promise<Membership>;
  abstract findByUserIdAndOrganizationId(
    userId: string,
    organizationId: string,
  ): Promise<Membership | null>;
  abstract delete(
    userId: string,
    roleId: number,
    organizationId: string,
  ): Promise<void>;

  /**
   * Encontra a primeira membership ativa de um usuário
   * Usado para popular role + organizationId no JWT
   *
   * @param userId - ID do usuário
   * @returns Primeira membership ativa ou null
   */
  abstract findFirstActiveByUserId(
    userId: string,
  ): Promise<FirstMembershipDTO | null>;

  /**
   * Encontra todas as memberships ativas de um usuário
   * Útil para operações futuras de multi-org switching
   *
   * @param userId - ID do usuário
   * @returns Array de memberships
   */
  abstract findAllActiveByUserId(userId: string): Promise<FirstMembershipDTO[]>;

  /**
   * Valida se um usuário tem membership em uma organização específica
   *
   * @param userId - ID do usuário
   * @param organizationId - ID da organização
   * @returns true se tem membership ativa, false senão
   */
  abstract hasActiveMembership(
    userId: string,
    organizationId: string,
  ): Promise<boolean>;
}
