import { UpdateTripTemplateDto } from 'src/modules/trip/application/dtos';

type UpdateTripTemplateDtoOverrides = Partial<UpdateTripTemplateDto>;

export function makeUpdateTripTemplateDto(
  overrides: UpdateTripTemplateDtoOverrides = {},
): UpdateTripTemplateDto {
  return { ...overrides };
}
