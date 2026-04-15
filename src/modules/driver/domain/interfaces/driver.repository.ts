import { DriverEntity } from '../entities/driver.entity';
import {
  PaginationOptions,
  PaginatedResponse,
} from 'src/shared/domain/interfaces';

export abstract class DriverRepository {
  abstract save(driver: DriverEntity): Promise<DriverEntity | null>;
  abstract findById(id: string): Promise<DriverEntity | null>;
  abstract findByUserId(userId: string): Promise<DriverEntity | null>;
  abstract findByCnh(cnh: string): Promise<DriverEntity | null>;
  abstract findByOrganizationId(
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<DriverEntity>>;
  abstract update(driver: DriverEntity): Promise<DriverEntity | null>;
  abstract delete(id: string): Promise<void>;
}
