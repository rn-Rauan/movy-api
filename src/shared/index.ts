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
export * from './infrastructure/database/transaction-manager';

// Presentation
export * from './presentation/dtos/paginated.dto';

// Guards
export * from './infrastructure/guards/jwt.guard';
export * from './infrastructure/guards/roles.guard';
export * from './infrastructure/guards/tenant-filter.guard';
export * from './infrastructure/guards/dev.guard';

// Decorators
export * from './infrastructure/decorators/roles.decorator';
export * from './infrastructure/decorators/dev.decorator';
export * from './infrastructure/decorators/get-user.decorator';
export * from './infrastructure/decorators/get-tenant-id.decorator';

// Types
export * from './infrastructure/types/tenant-context.interface';
export * from './infrastructure/types/jwt-payload.interface';

// Interceptors
export * from './presentation/interceptors/logging.interceptor';

// Exceptions
export * from './presentation/exceptions/all-exceptions.filter';

// Providers
export * from './providers/hash/bcrypt-hash.provider';
export * from './providers/interfaces/hash.interface';

// Module
export { SharedModule } from './shared.module';
