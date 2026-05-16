import { TripSchedulingConfig } from 'src/modules/scheduling/domain/entities/trip-scheduling-config.entity';

type Overrides = Partial<{
  id: string;
  organizationId: string;
  daysAhead: number;
  generationCron: string;
  autoCancelCron: string;
  enabled: boolean;
}>;

export function makeTripSchedulingConfig(
  overrides: Overrides = {},
): TripSchedulingConfig {
  return TripSchedulingConfig.create({
    id: overrides.id ?? 'scheduling-config-id-stub',
    organizationId: overrides.organizationId ?? 'org-id-stub',
    daysAhead: overrides.daysAhead,
    generationCron: overrides.generationCron,
    autoCancelCron: overrides.autoCancelCron,
    enabled: overrides.enabled,
  });
}
