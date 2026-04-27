import { Injectable } from '@nestjs/common';
import { Money } from 'src/shared/domain/entities/value-objects';
import { TripTemplate } from '../../domain/entities';
import {
  TripTemplateAccessForbiddenError,
  TripTemplateInactiveError,
  TripTemplateNotFoundError,
} from '../../domain/entities/errors/trip-template.errors';
import { TripTemplateRepository } from '../../domain/interfaces';
import { UpdateTripTemplateDto } from '../dtos';

/**
 * Applies a partial update to an existing {@link TripTemplate}.
 *
 * Validates ownership and active status before applying field-level changes.
 * Each update category (route, stops, pricing, recurrence, auto-cancel) delegates
 * validation to the domain entity methods, so all invariants are re-enforced.
 */
@Injectable()
export class UpdateTripTemplateUseCase {
  constructor(
    private readonly tripTemplateRepository: TripTemplateRepository,
  ) {}

  /**
   * Partially updates a trip template, scoped to the requesting organisation.
   *
   * @param id - UUID of the trip template to update
   * @param input - Optional fields to update
   * @param organizationId - UUID of the organisation (from JWT)
   * @returns The updated {@link TripTemplate}
   * @throws {@link TripTemplateNotFoundError} if the template does not exist
   * @throws {@link TripTemplateAccessForbiddenError} if the template belongs to a different org
   * @throws {@link TripTemplateInactiveError} if the template is inactive
   */
  async execute(
    id: string,
    input: UpdateTripTemplateDto,
    organizationId: string,
  ): Promise<TripTemplate> {
    const tripTemplate = await this.findActiveTripTemplate(id, organizationId);

    this.applyUpdates(tripTemplate, input);

    const updated = await this.tripTemplateRepository.update(tripTemplate);

    if (updated === null) {
      throw new TripTemplateNotFoundError(id);
    }

    return updated;
  }

  private async findActiveTripTemplate(
    id: string,
    organizationId: string,
  ): Promise<TripTemplate> {
    const tripTemplate = await this.tripTemplateRepository.findById(id);

    if (tripTemplate === null) {
      throw new TripTemplateNotFoundError(id);
    }

    if (tripTemplate.organizationId !== organizationId) {
      throw new TripTemplateAccessForbiddenError(id);
    }

    if (tripTemplate.isActive() === false) {
      throw new TripTemplateInactiveError(id);
    }

    return tripTemplate;
  }

  private applyUpdates(
    tripTemplate: TripTemplate,
    input: UpdateTripTemplateDto,
  ): void {
    this.updateRouteIfProvided(tripTemplate, input);
    this.updateStopsIfProvided(tripTemplate, input);
    this.updatePricingIfProvided(tripTemplate, input);
    this.updateRecurrenceIfProvided(tripTemplate, input);
    this.updateAutoCancelIfProvided(tripTemplate, input);
  }

  private updateRouteIfProvided(
    tripTemplate: TripTemplate,
    input: UpdateTripTemplateDto,
  ): void {
    const shouldUpdateRoute =
      input.departurePoint !== undefined || input.destination !== undefined;

    if (shouldUpdateRoute) {
      tripTemplate.updateRoute(
        input.departurePoint ?? tripTemplate.departurePoint,
        input.destination ?? tripTemplate.destination,
      );
    }
  }

  private updateStopsIfProvided(
    tripTemplate: TripTemplate,
    input: UpdateTripTemplateDto,
  ): void {
    if (input.stops !== undefined) {
      tripTemplate.updateStops(input.stops);
    }
  }

  private updatePricingIfProvided(
    tripTemplate: TripTemplate,
    input: UpdateTripTemplateDto,
  ): void {
    const shouldUpdatePricing =
      input.priceOneWay !== undefined ||
      input.priceReturn !== undefined ||
      input.priceRoundTrip !== undefined;

    if (shouldUpdatePricing) {
      tripTemplate.updatePricing({
        priceOneWay: this.toOptionalMoney(input.priceOneWay),
        priceReturn: this.toOptionalMoney(input.priceReturn),
        priceRoundTrip: this.toOptionalMoney(input.priceRoundTrip),
      });
    }
  }

  private updateRecurrenceIfProvided(
    tripTemplate: TripTemplate,
    input: UpdateTripTemplateDto,
  ): void {
    const shouldUpdateRecurrence =
      input.isRecurring !== undefined || input.frequency !== undefined;

    if (shouldUpdateRecurrence) {
      tripTemplate.setRecurrence(
        input.isRecurring ?? tripTemplate.isRecurring,
        input.frequency ?? tripTemplate.frequency,
      );
    }
  }

  private updateAutoCancelIfProvided(
    tripTemplate: TripTemplate,
    input: UpdateTripTemplateDto,
  ): void {
    const shouldUpdateAutoCancel =
      input.autoCancelEnabled !== undefined ||
      input.minRevenue !== undefined ||
      input.autoCancelOffset !== undefined;

    if (shouldUpdateAutoCancel) {
      const minRevenue = this.resolveMinRevenue(input, tripTemplate);

      tripTemplate.setAutoCancel(
        input.autoCancelEnabled ?? tripTemplate.autoCancelEnabled,
        minRevenue,
        input.autoCancelOffset ?? tripTemplate.autoCancelOffset,
      );
    }
  }

  private resolveMinRevenue(
    input: UpdateTripTemplateDto,
    tripTemplate: TripTemplate,
  ): Money | null {
    if (input.minRevenue === undefined) {
      return tripTemplate.minRevenue;
    }

    return this.toNullableMoney(input.minRevenue);
  }

  private toOptionalMoney(
    value: number | null | undefined,
  ): Money | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    return this.toNullableMoney(value);
  }

  private toNullableMoney(value: number | null): Money | null {
    if (value === null) {
      return null;
    }

    return Money.create(value);
  }
}
