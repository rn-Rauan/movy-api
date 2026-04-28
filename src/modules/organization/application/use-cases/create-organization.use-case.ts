import { OrganizationRepository } from '../../domain/interfaces/organization.repository';
import { Injectable } from '@nestjs/common';
import { CreateOrganizationDto } from '../dtos';
import {
  OrganizationName,
  Cnpj,
  Slug,
  Address,
  Organization,
  OrganizationAlreadyExistsError,
  OrganizationEmailAlreadyExistsError,
} from '../../domain/entities';
import { Telephone, Email } from 'src/shared/domain/entities/value-objects';

/**
 * Creates a new organization in the system.
 *
 * @remarks
 * Enforces uniqueness on `cnpj` and `slug` before persisting.
 * Throws {@link OrganizationAlreadyExistsError} on either conflict.
 */
@Injectable()
export class CreateOrganizationUseCase {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  /**
   * Creates a new organization in the system.
   * @param organizationDto - Data for organization creation
   * @returns Organization entity created and persisted
   * @throws OrganizationAlreadyExistsError if the CNPJ already already exists or if the slug already exists
   */
  async execute(organizationDto: CreateOrganizationDto): Promise<Organization> {
    const organizationExists = await this.organizationRepository.findByCnpj(
      organizationDto.cnpj,
    );
    if (organizationExists) {
      throw new OrganizationAlreadyExistsError(organizationDto.cnpj);
    }

    const slugExists = await this.organizationRepository.findBySlug(
      organizationDto.slug,
    );
    if (slugExists) {
      throw new OrganizationAlreadyExistsError(
        `Slug '${organizationDto.slug}' already exists`,
      );
    }

    const id = crypto.randomUUID();

    const organization = Organization.create({
      id: id,
      name: OrganizationName.create(organizationDto.name),
      cnpj: Cnpj.create(organizationDto.cnpj),
      address: Address.create(organizationDto.address),
      email: Email.create(organizationDto.email),
      telephone: Telephone.create(organizationDto.telephone),
      slug: Slug.create(organizationDto.slug),
    });

    try {
      await this.organizationRepository.save(organization);
    } catch (error: unknown) {
      if (this.isUniqueConstraintViolation(error)) {
        const targets = this.getUniqueTargets(error);

        if (targets.includes('cnpj')) {
          throw new OrganizationAlreadyExistsError(organizationDto.cnpj);
        }
        if (targets.includes('slug')) {
          throw new OrganizationAlreadyExistsError(
            `Slug '${organizationDto.slug}' already exists`,
          );
        }
        if (targets.includes('email')) {
          throw new OrganizationEmailAlreadyExistsError(organizationDto.email);
        }

        throw new OrganizationAlreadyExistsError(organizationDto.cnpj);
      }
      throw error;
    }

    return organization;
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    if (!('code' in error)) return false;
    return (error as { code?: unknown }).code === 'P2002';
  }

  private getUniqueTargets(error: unknown): string[] {
    if (!error || typeof error !== 'object') return [];
    if (!('meta' in error)) return [];

    const meta = (error as { meta?: unknown }).meta;
    if (!meta || typeof meta !== 'object') return [];
    if (!('target' in meta)) return [];

    const target = (meta as { target?: unknown }).target;
    return Array.isArray(target)
      ? target.filter((t) => typeof t === 'string')
      : [];
  }
}
