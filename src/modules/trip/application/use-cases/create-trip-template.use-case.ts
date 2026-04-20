import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Money } from 'src/shared';
import { TripTemplate } from '../../domain/entities';
import { TripTemplateCreationFailedError } from '../../domain/entities/errors/trip-template.errors';
import { TripTemplateRepository } from '../../domain/interfaces';
import { CreateTripTemplateDto } from '../dtos';

@Injectable()
export class CreateTripTemplateUseCase {
  constructor(
    private readonly tripTemplateRepository: TripTemplateRepository,
  ) {}

  /**
   * Creates a new trip template for the given organization.
   * Domain entity validates route, stops, pricing, recurrence, and auto-cancel invariants.
   * @param input - Trip template creation data
   * @param organizationId - UUID of the owning organization (from JWT context)
   * @returns TripTemplate created and persisted
   * @throws InvalidTripRoutePointsError if route is invalid
   * @throws InvalidTripStopsError if stops are invalid
   * @throws InvalidTripPriceConfigurationError if no price is provided
   * @throws InvalidTripFrequencyError if recurring with no days
   * @throws InvalidTripAutoCancelConfigurationError if auto-cancel config is incomplete
   * @throws TripTemplateCreationFailedError if persistence fails
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
