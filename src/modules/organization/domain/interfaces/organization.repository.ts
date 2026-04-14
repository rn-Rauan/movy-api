import { Organization } from '../entities';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';
export abstract class OrganizationRepository {
  abstract save(organization: Organization): Promise<Organization | null>;
  abstract findById(id: string): Promise<Organization | null>;
  abstract findByCnpj(cnpj: string): Promise<Organization | null>;
  abstract findBySlug(slug: string): Promise<Organization | null>;
  abstract findByEmail(email: string): Promise<Organization | null>;
  abstract update(organization: Organization): Promise<Organization | null>;
  abstract findAll(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Organization>>;
  abstract findAllActive(
    options: PaginationOptions,
  ): Promise<PaginatedResponse<Organization>>;
  abstract delete(id: string): Promise<void>;
}
