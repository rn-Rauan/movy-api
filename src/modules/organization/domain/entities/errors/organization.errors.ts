import { DomainError } from 'src/shared/domain/errors/domain.error';

/**
 * Erro genérico de validação da Organization
 */
export abstract class OrganizationValidationError extends DomainError {
  abstract code: string;
}

/**
 * Erro de nome inválido
 */
export class InvalidOrganizationNameError extends OrganizationValidationError {
  code = 'INVALID_ORGANIZATION_NAME';

  constructor(name: string, reason?: string) {
    const message = reason
      ? `Invalid organization name "${name}": ${reason}`
      : `Invalid organization name "${name}"`;
    super(message);
  }
}

/**
 * Erro de CNPJ inválido
 */
export class InvalidCnpjError extends OrganizationValidationError {
  code = 'INVALID_CNPJ';

  constructor(cnpj: string) {
    super(`Invalid CNPJ format "${cnpj}". Expected format: XX.XXX.XXX/XXXX-XX`);
  }
}

/**
 * Erro de Slug inválido
 */
export class InvalidSlugError extends OrganizationValidationError {
  code = 'INVALID_SLUG';

  constructor(slug: string) {
    super(
      `Invalid slug format "${slug}". Slugs must be lowercase, numbers or hyphens.`,
    );
  }
}

/**
 * Erro de Organização não encontrada
 */
export class OrganizationNotFoundError extends DomainError {
  code = 'ORGANIZATION_NOT_FOUND';

  constructor(id?: string) {
    const message = id
      ? `Organization with id "${id}" not found`
      : 'Organization not found';
    super(message);
  }
}

/**
 * Erro de endereço inválido
 */
export class InvalidAddressError extends OrganizationValidationError {
  code = 'INVALID_ADDRESS';

  constructor(address: string) {
    super(`Invalid address format "${address}". Address cannot be empty.`);
  }
}

/**
 *
 */
export class OrganizationAlreadyExistsError extends DomainError {
  code = 'ORGANIZATION_ALREADY_EXISTS';

  constructor(cnpj: string) {
    super(`Organization with CNPJ "${cnpj}" already exists.`);
  }
}

/**
 * Erro de Organização inativa
 */
export class InactiveOrganizationError extends DomainError {
  code = 'INACTIVE_ORGANIZATION';

  constructor(id: string) {
    super(`Organization with id "${id}" is inactive`);
  }
}
