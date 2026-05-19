import { CreateDriverDto } from 'src/modules/driver/application/dtos';

type CreateDriverDtoOverrides = Partial<CreateDriverDto>;

export function makeCreateDriverDto(
  overrides: CreateDriverDtoOverrides = {},
): CreateDriverDto {
  return {
    cnh: overrides.cnh ?? '123456789',
    cnhCategories: overrides.cnhCategories ?? ['B'],
    cnhExpiresAt: overrides.cnhExpiresAt ?? '2030-12-31',
  };
}
