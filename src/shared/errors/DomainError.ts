/**
 * Classe base para erros de domínio
 * Todos os erros de negócio devem herdar desta classe
 */
export abstract class DomainError extends Error {
  abstract code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
    };
  }
}
