import { CreateTripTemplateDto } from 'src/modules/trip/application/dtos';
import { Shift } from 'src/modules/trip/domain/interfaces/enums/shift.enum';

type CreateTripTemplateDtoOverrides = Partial<CreateTripTemplateDto>;

export function makeCreateTripTemplateDto(
  overrides: CreateTripTemplateDtoOverrides = {},
): CreateTripTemplateDto {
  return {
    departurePoint: 'Terminal Rodoviário',
    destination: 'Universidade Federal',
    stops: ['Terminal Rodoviário', 'Praça Central', 'Universidade Federal'],
    shift: Shift.MORNING,
    departureTimeOfDay: '07:30',
    arrivalTimeOfDay: '08:30',
    defaultCapacity: 20,
    priceOneWay: 12.5,
    ...overrides,
  };
}
