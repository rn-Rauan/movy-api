import { VehicleEntity } from 'src/modules/vehicle/domain/entities/vehicle.entity';
import { Plate } from 'src/modules/vehicle/domain/entities/value-objects/plate.value-object';
import { VehicleType } from 'src/modules/vehicle/domain/interfaces/enums/vehicle-type.enum';
import { VehicleStatus } from 'src/modules/vehicle/domain/interfaces/enums/vehicle-status.enum';

type VehicleOverrides = Partial<{
  id: string;
  organizationId: string;
  plate: string;
  model: string;
  type: VehicleType;
  maxCapacity: number;
  status: VehicleStatus;
}>;

export function makeVehicle(overrides: VehicleOverrides = {}): VehicleEntity {
  return VehicleEntity.restore({
    id: overrides.id ?? 'vehicle-id-stub',
    organizationId: overrides.organizationId ?? 'org-id-stub',
    plate: Plate.create(overrides.plate ?? 'ABC1234'),
    model: overrides.model ?? 'Van Modelo Stub',
    type: overrides.type ?? VehicleType.VAN,
    maxCapacity: overrides.maxCapacity ?? 20,
    status: overrides.status ?? VehicleStatus.ACTIVE,
  });
}
