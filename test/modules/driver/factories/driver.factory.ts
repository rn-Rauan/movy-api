import { DriverEntity } from 'src/modules/driver/domain/entities/driver.entity';
import {
  Cnh,
  CnhCategories,
} from 'src/modules/driver/domain/entities/value-objects';
import { DriverStatus } from 'src/modules/driver/domain/interfaces/enums/driver-status.enum';

type DriverOverrides = Partial<{
  id: string;
  userId: string;
  cnh: string;
  cnhCategories: string[];
  cnhExpiresAt: Date;
  driverStatus: DriverStatus;
}>;

export function makeDriver(overrides: DriverOverrides = {}): DriverEntity {
  const baseProps = {
    id: overrides.id ?? 'driver-id-stub',
    userId: overrides.userId ?? 'user-id-stub',
    cnh: Cnh.create(overrides.cnh ?? '123456789'),
    cnhCategories: CnhCategories.create(overrides.cnhCategories ?? ['B']),
    cnhExpiresAt: overrides.cnhExpiresAt ?? new Date('2030-12-31'),
  };

  if (overrides.driverStatus !== undefined) {
    return DriverEntity.restore({
      ...baseProps,
      driverStatus: overrides.driverStatus,
    });
  }

  return DriverEntity.create(baseProps);
}
