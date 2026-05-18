import { Injectable } from '@nestjs/common';
import {
  DriverAccessForbiddenError,
  DriverNotFoundError,
} from 'src/modules/driver/domain/entities';
import { DriverRepository } from 'src/modules/driver/domain/interfaces';
import {
  VehicleAccessForbiddenError,
  VehicleNotFoundError,
} from 'src/modules/vehicle/domain/entities';
import { VehicleRepository } from 'src/modules/vehicle/domain/interfaces';
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
    private readonly driverRepository: DriverRepository,
    private readonly vehicleRepository: VehicleRepository,
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
   * @throws {@link DriverNotFoundError} if `defaultDriverId` does not exist
   * @throws {@link DriverAccessForbiddenError} if `defaultDriverId` belongs to a different org
   * @throws {@link VehicleNotFoundError} if `defaultVehicleId` does not exist
   * @throws {@link VehicleAccessForbiddenError} if `defaultVehicleId` belongs to a different org
   */
  async execute(
    id: string,
    input: UpdateTripTemplateDto,
    organizationId: string,
  ): Promise<TripTemplate> {
    const tripTemplate = await this.findActiveTripTemplate(id, organizationId);

    await this.applyUpdates(tripTemplate, input, organizationId);

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

  private async applyUpdates(
    tripTemplate: TripTemplate,
    input: UpdateTripTemplateDto,
    organizationId: string,
  ): Promise<void> {
    this.updateRouteIfProvided(tripTemplate, input);
    this.updateStopsIfProvided(tripTemplate, input);
    this.updateScheduleIfProvided(tripTemplate, input);
    this.updateDefaultCapacityIfProvided(tripTemplate, input);
    await this.updateDefaultsIfProvided(tripTemplate, input, organizationId);
    this.updatePricingIfProvided(tripTemplate, input);
    this.updateRecurrenceIfProvided(tripTemplate, input);
    this.updateAutoCancelIfProvided(tripTemplate, input);
  }

  private async updateDefaultsIfProvided(
    tripTemplate: TripTemplate,
    input: UpdateTripTemplateDto,
    organizationId: string,
  ): Promise<void> {
    const driverProvided = input.defaultDriverId !== undefined;
    const vehicleProvided = input.defaultVehicleId !== undefined;

    if (!driverProvided && !vehicleProvided) {
      return;
    }

    const nextDriverId = driverProvided
      ? input.defaultDriverId!
      : tripTemplate.defaultDriverId;
    const nextVehicleId = vehicleProvided
      ? input.defaultVehicleId!
      : tripTemplate.defaultVehicleId;

    if (driverProvided && nextDriverId !== null) {
      await this.assertDriverBelongsToOrg(nextDriverId, organizationId);
    }
    if (vehicleProvided && nextVehicleId !== null) {
      await this.assertVehicleBelongsToOrg(nextVehicleId, organizationId);
    }

    tripTemplate.updateDefaults(nextDriverId, nextVehicleId);
  }

  private async assertDriverBelongsToOrg(
    driverId: string,
    organizationId: string,
  ): Promise<void> {
    const driver = await this.driverRepository.findById(driverId);
    if (!driver) {
      throw new DriverNotFoundError(driverId);
    }
    const belongs = await this.driverRepository.belongsToOrganization(
      driverId,
      organizationId,
    );
    if (!belongs) {
      throw new DriverAccessForbiddenError(driverId);
    }
  }

  private async assertVehicleBelongsToOrg(
    vehicleId: string,
    organizationId: string,
  ): Promise<void> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) {
      throw new VehicleNotFoundError(vehicleId);
    }
    if (vehicle.organizationId !== organizationId) {
      throw new VehicleAccessForbiddenError(vehicleId);
    }
  }

  private updateDefaultCapacityIfProvided(
    tripTemplate: TripTemplate,
    input: UpdateTripTemplateDto,
  ): void {
    if (input.defaultCapacity !== undefined) {
      tripTemplate.updateDefaultCapacity(input.defaultCapacity);
    }
  }

  private updateScheduleIfProvided(
    tripTemplate: TripTemplate,
    input: UpdateTripTemplateDto,
  ): void {
    const shouldUpdateSchedule =
      input.departureTimeOfDay !== undefined ||
      input.arrivalTimeOfDay !== undefined;

    if (shouldUpdateSchedule) {
      tripTemplate.updateSchedule(
        input.departureTimeOfDay ?? tripTemplate.departureTimeOfDay!,
        input.arrivalTimeOfDay ?? tripTemplate.arrivalTimeOfDay!,
      );
    }
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
