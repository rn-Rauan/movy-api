import { DriverEntity } from 'src/modules/driver/domain/entities/driver.entity';
import { Cnh, CnhCategory } from 'src/modules/driver/domain/entities/value-objects';

type DriverOverrides = Partial<{
  id: string;
  userId: string;
  cnh: string;
  cnhCategory: string;
  cnhExpiresAt: Date;
}>;

export function makeDriver(overrides: DriverOverrides = {}): DriverEntity {
  return DriverEntity.create({
    id: overrides.id ?? 'driver-id-stub',
    userId: overrides.userId ?? 'user-id-stub',
    cnh: Cnh.create(overrides.cnh ?? '123456789'),
    cnhCategory: CnhCategory.create(overrides.cnhCategory ?? 'B'),
    cnhExpiresAt: overrides.cnhExpiresAt ?? new Date('2030-12-31'),
  });
}
