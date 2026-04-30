import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from '../../domain/interfaces/organization.repository';
import { OrganizationNotFoundError } from '../../domain/entities/errors/organization.errors';
import { Organization } from '../../domain/entities';

/**
 * Retrieves an active organisation by its URL-friendly slug.
 *
 * @remarks
 * This use case requires **no authentication** and is the canonical way for the
 * frontend to resolve an organisation from a human-readable URL segment
 * (e.g. `/transport-xpto` → `GET /public/organizations/transport-xpto`).
 *
 * Treats `INACTIVE` organisations as non-existent — callers receive
 * {@link OrganizationNotFoundError} regardless of whether the slug matched a
 * record that was soft-deleted or never existed, preventing information leakage.
 */
@Injectable()
export class FindOrganizationBySlugUseCase {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  /**
   * Find an active organisation by its slug.
   *
   * @param slug - URL-friendly identifier (e.g. `transport-xpto`)
   * @returns The matching {@link Organization} entity
   * @throws {@link OrganizationNotFoundError} if the slug does not match any
   *   active organisation (`INACTIVE` orgs are treated as non-existent)
   */
  async execute(slug: string): Promise<Organization> {
    const organization = await this.organizationRepository.findBySlug(slug);
    if (!organization || organization.status === 'INACTIVE') {
      throw new OrganizationNotFoundError(slug);
    }
    return organization;
  }
}
