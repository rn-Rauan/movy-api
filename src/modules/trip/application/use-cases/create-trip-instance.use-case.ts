import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Money } from 'src/shared/domain/entities/value-objects';
import { TripInstance } from '../../domain/entities';
import { TripInstanceCreationFailedError } from '../../domain/entities/errors/trip-instance.errors';
import {
  TripTemplateAccessForbiddenError,
  TripTemplateInactiveError,
  TripTemplateNotFoundError,
} from '../../domain/entities/errors/trip-template.errors';
import {
  TripInstanceRepository,
  TripTemplateRepository,
} from '../../domain/interfaces';
import { CreateTripInstanceDto } from '../dtos';

@Injectable()
export class CreateTripInstanceUseCase {
  constructor(
    private readonly tripInstanceRepository: TripInstanceRepository,
    private readonly tripTemplateRepository: TripTemplateRepository,
  ) {}

  /**
   * Creates a new trip instance (DRAFT) based on an existing trip template.
   * Auto-cancel fields are derived from the template when enabled, unless overridden in the DTO.
   * Driver and vehicle are optional at this stage.
   * @param input - Trip instance creation data
   * @param organizationId - UUID of the owning organization (from JWT context)
   * @returns TripInstance created and persisted
   * @throws TripTemplateNotFoundError if the template does not exist
   * @throws TripTemplateAccessForbiddenError if the template belongs to a different organization
   * @throws TripTemplateInactiveError if the template is inactive
   * @throws InvalidTripInstanceCapacityError if totalCapacity <= 0
   * @throws InvalidTripInstanceTimesError if departureTime >= arrivalEstimate
   * @throws InvalidTripInstanceAutoCancelTimeError if autoCancelAt is not before departureTime
   * @throws TripInstanceCreationFailedError if persistence fails
   */
  async execute(
    input: CreateTripInstanceDto,
    organizationId: string,
  ): Promise<TripInstance> {
    const template = await this.tripTemplateRepository.findById(
      input.tripTemplateId,
    );

    if (!template) {
      throw new TripTemplateNotFoundError(input.tripTemplateId);
    }

    if (template.organizationId !== organizationId) {
      throw new TripTemplateAccessForbiddenError(input.tripTemplateId);
    }

    if (!template.isActive()) {
      throw new TripTemplateInactiveError(input.tripTemplateId);
    }

    const departureTime = new Date(input.departureTime);
    const arrivalEstimate = new Date(input.arrivalEstimate);

    const autoCancelAt = this.resolveAutoCancelAt(
      template.autoCancelEnabled,
      template.autoCancelOffset,
      departureTime,
    );

    const minRevenue = this.resolveMinRevenue(
      input.minRevenue,
      template.autoCancelEnabled,
      template.minRevenue,
    );

    const instance = TripInstance.create({
      id: randomUUID(),
      organizationId,
      tripTemplateId: input.tripTemplateId,
      driverId: input.driverId ?? null,
      vehicleId: input.vehicleId ?? null,
      totalCapacity: input.totalCapacity,
      departureTime,
      arrivalEstimate,
      minRevenue,
      autoCancelAt,
    });

    const saved = await this.tripInstanceRepository.save(instance);

    if (!saved) {
      throw new TripInstanceCreationFailedError();
    }

    return saved;
  }

  /**
   * Calculates autoCancelAt by subtracting autoCancelOffset (minutes) from departureTime.
   * Returns null if auto-cancel is not enabled or offset is not set.
   */
  private resolveAutoCancelAt(
    autoCancelEnabled: boolean,
    autoCancelOffset: number | null,
    departureTime: Date,
  ): Date | null {
    if (!autoCancelEnabled || autoCancelOffset === null) return null;

    const autoCancelAt = new Date(departureTime);
    autoCancelAt.setMinutes(autoCancelAt.getMinutes() - autoCancelOffset);

    return autoCancelAt;
  }

  /**
   * Resolves minRevenue: uses DTO override if provided, falls back to template value when
   * auto-cancel is enabled, or returns null.
   */
  private resolveMinRevenue(
    dtoMinRevenue: number | null | undefined,
    autoCancelEnabled: boolean,
    templateMinRevenue: Money | null,
  ): Money | null {
    if (dtoMinRevenue != null) {
      return Money.create(dtoMinRevenue);
    }

    if (autoCancelEnabled && templateMinRevenue) {
      return templateMinRevenue;
    }

    return null;
  }
}
