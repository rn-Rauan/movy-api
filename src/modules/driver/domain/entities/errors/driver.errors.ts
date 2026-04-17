import { DomainError } from 'src/shared/domain/errors/domain.error';

/**
 * Erro genérico de validação do Driver
 */
export abstract class DriverValidationError extends DomainError {
  abstract code: string;
}

/**
 * Erro de CNH inválida
 */
export class InvalidCnhError extends DriverValidationError {
  code = 'INVALID_CNH';

  constructor(cnh: string, reason?: string) {
    const message = reason
      ? `Invalid CNH "${cnh}": ${reason}`
      : `Invalid CNH "${cnh}". Expected format: 9-12 alphanumeric characters`;
    super(message);
  }
}

/**
 * Erro de categoria de CNH inválida
 */
export class InvalidCnhCategoryError extends DriverValidationError {
  code = 'INVALID_CNH_CATEGORY';

  constructor(category: string) {
    super(
      `Invalid CNH category "${category}". Valid categories are: A, B, C, D, E`,
    );
  }
}

/**
 * Erro de data de expiração da CNH inválida
 */
export class InvalidCnhExpirationError extends DriverValidationError {
  code = 'INVALID_CNH_EXPIRATION';

  constructor(expirationDate: Date) {
    super(
      `Invalid CNH expiration date: ${expirationDate.toISOString()}. Date must be in the future`,
    );
  }
}

/**
 * Erro de CNH expirada
 */
export class ExpiredCnhError extends DriverValidationError {
  code = 'EXPIRED_CNH';

  constructor(expirationDate: Date) {
    super(
      `Driver license (CNH) has expired on ${expirationDate.toISOString()}`,
    );
  }
}

/**
 * Erro de status inválido
 */
export class InvalidDriverStatusError extends DriverValidationError {
  code = 'INVALID_DRIVER_STATUS';

  constructor(status: string) {
    super(
      `Invalid driver status "${status}". Valid statuses are: ACTIVE, INACTIVE, SUSPENDED`,
    );
  }
}

/**
 * Erro de driver não encontrado
 */
export class DriverNotFoundError extends DriverValidationError {
  code = 'DRIVER_NOT_FOUND_BAD_REQUEST';

  constructor(driverId?: string, userId?: string, cnh?: string) {
    const identifier = driverId ?? userId ?? (cnh ? `CNH ${cnh}` : undefined);
    super(
      `Driver${identifier ? ` with identifier "${identifier}"` : ''} not found`,
    );
  }
}

/**
 * Erro: nenhum perfil de motorista associado ao e-mail informado
 */
export class DriverProfileNotFoundByEmailError extends DriverValidationError {
  code = 'DRIVER_PROFILE_NOT_FOUND_BAD_REQUEST';

  constructor(email: string) {
    super(`No user found with email "${email}". Cannot perform driver lookup.`);
  }
}

/**
 * Erro de falha ao criar driver
 */
export class DriverCreationFailedError extends DomainError {
  code = 'DRIVER_CREATION_FAILED';

  constructor(message: string = 'Failed to create driver') {
    super(message);
  }
}

/**
 * Erro de falha ao atualizar driver
 */
export class DriverUpdateFailedError extends DomainError {
  code = 'DRIVER_UPDATE_FAILED';

  constructor(message: string = 'Failed to update driver') {
    super(message);
  }
}

/**
 * Erro: usuário já possui perfil de motorista
 */
export class DriverAlreadyExistsError extends DriverValidationError {
  code = 'DRIVER_ALREADY_EXISTS_CONFLICT';

  constructor(userId: string) {
    super(`User "${userId}" already has a driver profile`);
  }
}

export class PartialCnhUpdateError extends DriverValidationError {
  code = 'INVALID_PARTIAL_CNH_UPDATE_BAD_REQUEST';

  constructor() {
    super(
      'To update CNH, all fields must be provided: cnh, cnhCategory, cnhExpiresAt',
    );
  }
}

/** Thrown when the requester does not own the driver profile */
export class DriverAccessForbiddenError extends DomainError {
  code = 'DRIVER_ACCESS_FORBIDDEN';

  constructor(id: string) {
    super(`Access to driver "${id}" is forbidden`);
  }
}
