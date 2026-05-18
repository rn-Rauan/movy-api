import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DriverRepository } from 'src/modules/driver/domain/interfaces';
import {
  DriverAccessForbiddenError,
  DriverNotFoundError,
} from 'src/modules/driver/domain/entities';
import { VehicleRepository } from 'src/modules/vehicle/domain/interfaces';
import {
  VehicleAccessForbiddenError,
  VehicleNotFoundError,
} from 'src/modules/vehicle/domain/entities';
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
 * When `defaultDriverId` and/or `defaultVehicleId` are provided, this use case
 * validates both existence and cross-tenant ownership before persisting.
 */
@Injectable()
export class CreateTripTemplateUseCase {
  constructor(
    private readonly tripTemplateRepository: TripTemplateRepository,
    private readonly driverRepository: DriverRepository,
    private readonly vehicleRepository: VehicleRepository,
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
   * @throws {@link DriverNotFoundError} if `defaultDriverId` does not exist
   * @throws {@link DriverAccessForbiddenError} if `defaultDriverId` belongs to a different org
   * @throws {@link VehicleNotFoundError} if `defaultVehicleId` does not exist
   * @throws {@link VehicleAccessForbiddenError} if `defaultVehicleId` belongs to a different org
   * @throws {@link TripTemplateCreationFailedError} if persistence fails
   */
  async execute(
    input: CreateTripTemplateDto,
    organizationId: string,
  ): Promise<TripTemplate> {
    if (input.defaultDriverId) {
      await this.assertDriverBelongsToOrg(
        input.defaultDriverId,
        organizationId,
      );
    }

    if (input.defaultVehicleId) {
      await this.assertVehicleBelongsToOrg(
        input.defaultVehicleId,
        organizationId,
      );
    }

    const tripTemplate = TripTemplate.create({
      id: randomUUID(),
      organizationId,
      departurePoint: input.departurePoint,
      destination: input.destination,
      stops: input.stops,
      shift: input.shift,
      departureTimeOfDay: input.departureTimeOfDay,
      arrivalTimeOfDay: input.arrivalTimeOfDay,
      defaultCapacity: input.defaultCapacity,
      defaultDriverId: input.defaultDriverId ?? null,
      defaultVehicleId: input.defaultVehicleId ?? null,
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
}
