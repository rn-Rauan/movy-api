// Domain exports
export * from './domain/errors';
export * from './domain/interfaces';
export * from './domain/types';

// Entities and Value Objects
export * from './domain/entities/role.entity';
export * from './domain/entities/value-objects';

// Infrastructure
export * from './infrastructure/database/mappers/role.mapper';
export * from './infrastructure/database/repositories/prisma-role.repository';

// Presentation
export * from './presentation/dtos/paginated.dto';

// Guards
export * from './guards/jwt.guard';

// Interceptors
export * from './presentation/interceptors/logging.interceptor';

// Exceptions
export * from './presentation/exceptions/all-exceptions.filter';

// Providers
export * from './providers/hash/bcrypt-hash.provider';
export * from './providers/interfaces/hash.interface';

// Module
export { SharedModule } from './shared.module';
