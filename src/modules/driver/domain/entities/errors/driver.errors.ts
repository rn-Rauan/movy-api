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
  code = 'DRIVER_NOT_FOUND';

  constructor(driverId?: string, userId?: string) {
    const identifier = driverId || userId;
    super(
      `Driver${identifier ? ` with identifier "${identifier}"` : ''} not found`,
    );
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

export class PartialCnhUpdateError extends DriverValidationError {
  code = 'INVALID_PARTIAL_CNH_UPDATE_BAD_REQUEST';

  constructor() {
    super(
      'To update CNH, all fields must be provided: cnh, cnhCategory, cnhExpiresAt',
    );
  }
}
