import { DomainError } from 'src/shared/domain/errors/domain.error';

/**
 * Base class for all Organization domain validation errors.
 * Maps to HTTP 400 Bad Request unless a subclass specifies otherwise.
 */
export abstract class OrganizationValidationError extends DomainError {
  abstract code: string;
}

/**
 * Thrown when an organization name is empty or exceeds the allowed length (2–255 chars).
 * HTTP 400 — code: `INVALID_ORGANIZATION_NAME`
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
 * Thrown when a CNPJ string does not match the expected Brazilian format or fails digit validation.
 * HTTP 400 — code: `INVALID_CNPJ`
 */
export class InvalidCnpjError extends OrganizationValidationError {
  code = 'INVALID_CNPJ';

  constructor(cnpj: string) {
    super(`Invalid CNPJ format "${cnpj}". Expected format: XX.XXX.XXX/XXXX-XX`);
  }
}

/**
 * Thrown when a slug string does not match the required format (lowercase, digits, hyphens).
 * HTTP 400 — code: `INVALID_SLUG`
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
 * Thrown when no organization is found for the given identifier, or when it is inactive.
 * HTTP 404 — code: `ORGANIZATION_NOT_FOUND`
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
 * Thrown when an address string is empty or exceeds 255 characters.
 * HTTP 400 — code: `INVALID_ADDRESS`
 */
export class InvalidAddressError extends OrganizationValidationError {
  code = 'INVALID_ADDRESS';

  constructor(address: string) {
    super(`Invalid address format "${address}". Address cannot be empty.`);
  }
}

/**
 * Thrown when attempting to create an organization with a CNPJ that already exists.
 * HTTP 409 — code: `ORGANIZATION_ALREADY_EXISTS`
 */
export class OrganizationAlreadyExistsError extends DomainError {
  code = 'ORGANIZATION_ALREADY_EXISTS';

  constructor(cnpj: string) {
    super(`Organization with CNPJ "${cnpj}" already exists.`);
  }
}

/**
 * Thrown when attempting to use an email address already registered to another organization.
 * HTTP 409 — code: `ORGANIZATION_EMAIL_ALREADY_EXISTS`
 */
/**
 * Thrown when attempting to use an email address already registered to another organization.
 * HTTP 409 — code: `ORGANIZATION_EMAIL_ALREADY_EXISTS`
 */
export class OrganizationEmailAlreadyExistsError extends DomainError {
  code = 'ORGANIZATION_EMAIL_ALREADY_EXISTS';

  constructor(email: string) {
    super(`Organization with email "${email}" already exists.`);
  }
}

/**
 * Thrown when attempting to use a slug already registered to another organization.
 * HTTP 409 — code: `ORGANIZATION_SLUG_ALREADY_EXISTS`
 */
/**
 * Thrown when attempting to use a slug already registered to another organization.
 * HTTP 409 — code: `ORGANIZATION_SLUG_ALREADY_EXISTS`
 */
export class OrganizationSlugAlreadyExistsError extends DomainError {
  code = 'ORGANIZATION_SLUG_ALREADY_EXISTS';

  constructor(slug: string) {
    super(`Organization with slug "${slug}" already exists.`);
  }
}

/**
 * Thrown when attempting to mutate an organization that is already `INACTIVE`.
 * HTTP 400 — code: `INACTIVE_ORGANIZATION`
 */
export class InactiveOrganizationError extends DomainError {
  code = 'INACTIVE_ORGANIZATION';

  constructor(id: string) {
    super(`Organization with id "${id}" is inactive`);
  }
}

/**
 * Thrown when the requesting tenant does not have access to the target organization.
 * HTTP 403 — code: `ORGANIZATION_ACCESS_FORBIDDEN`
 */
/**
 * Thrown when the requesting tenant does not have access to the target organization.
 * HTTP 403 — code: `ORGANIZATION_ACCESS_FORBIDDEN`
 */
export class OrganizationForbiddenError extends DomainError {
  code = 'ORGANIZATION_ACCESS_FORBIDDEN';

  constructor(id: string) {
    super(`You do not have access to organization "${id}"`);
  }
}
