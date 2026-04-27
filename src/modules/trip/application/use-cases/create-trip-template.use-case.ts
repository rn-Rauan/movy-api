import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Money } from 'src/shared/domain/entities/value-objects';
import { TripTemplate } from '../../domain/entities';
import { TripTemplateCreationFailedError } from '../../domain/entities/errors/trip-template.errors';
import { TripTemplateRepository } from '../../domain/interfaces';
import { CreateTripTemplateDto } from '../dtos';

/**
 * Creates and persists a new {@link TripTemplate} for the requesting organisation.
 *
 * All domain invariants (route, stops, pricing, recurrence, auto-cancel) are
 * validated by {@link TripTemplate.create} before the repository is called.
 */
@Injectable()
export class CreateTripTemplateUseCase {
  constructor(
    private readonly tripTemplateRepository: TripTemplateRepository,
  ) {}

  /**
   * Creates a new trip template for the given organisation.
   *
   * Domain entity validates route, stops, pricing, recurrence, and auto-cancel invariants.
   *
   * @param input - Trip template creation data
   * @param organizationId - UUID of the owning organisation (from JWT)
   * @returns The newly created and persisted {@link TripTemplate}
   * @throws {@link InvalidTripRoutePointsError} if route is invalid
   * @throws {@link InvalidTripStopsError} if stops are invalid
   * @throws {@link InvalidTripPriceConfigurationError} if no price is provided
   * @throws {@link InvalidTripFrequencyError} if recurring with no days
   * @throws {@link InvalidTripAutoCancelConfigurationError} if auto-cancel config is incomplete
   * @throws {@link TripTemplateCreationFailedError} if persistence fails
   */
  async execute(
    input: CreateTripTemplateDto,
    organizationId: string,
  ): Promise<TripTemplate> {
    const tripTemplate = TripTemplate.create({
      id: randomUUID(),
      organizationId,
      departurePoint: input.departurePoint,
      destination: input.destination,
      stops: input.stops,
      shift: input.shift,
      frequency: input.frequency ?? [],
      priceOneWay:
        input.priceOneWay == null ? null : Money.create(input.priceOneWay),
      priceReturn:
        input.priceReturn == null ? null : Money.create(input.priceReturn),
      priceRoundTrip:
        input.priceRoundTrip == null
          ? null
          : Money.create(input.priceRoundTrip),
      isPublic: input.isPublic,
      isRecurring: input.isRecurring,
      autoCancelEnabled: input.autoCancelEnabled,
      minRevenue:
        input.minRevenue == null ? null : Money.create(input.minRevenue),
      autoCancelOffset: input.autoCancelOffset ?? null,
    });

    const saved = await this.tripTemplateRepository.save(tripTemplate);

    if (!saved) {
      throw new TripTemplateCreationFailedError();
    }

    return saved;
  }
}
