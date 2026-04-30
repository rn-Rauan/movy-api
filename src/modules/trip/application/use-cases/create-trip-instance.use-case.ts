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
import { UnitOfWork } from 'src/shared/domain/interfaces/unit-of-work';
import { PlanLimitService } from 'src/modules/subscriptions/application/services/plan-limit.service';

/**
 * Creates a new {@link TripInstance} (in `DRAFT` status) from an existing active {@link TripTemplate}.
 *
 * Auto-cancel fields are derived from the template when the feature is enabled,
 * unless overridden in the DTO. Driver and vehicle assignment is optional at this stage.
 */
@Injectable()
export class CreateTripInstanceUseCase {
  constructor(
    private readonly tripInstanceRepository: TripInstanceRepository,
    private readonly tripTemplateRepository: TripTemplateRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly planLimitService: PlanLimitService,
  ) {}

  /**
   * Creates a new trip instance based on an existing active trip template.
   *
   * @param input - Trip instance creation data
   * @param organizationId - UUID of the owning organisation (from JWT)
   * @returns The newly created and persisted {@link TripInstance}
   * @throws {@link TripTemplateNotFoundError} if the template does not exist
   * @throws {@link TripTemplateAccessForbiddenError} if the template belongs to a different org
   * @throws {@link TripTemplateInactiveError} if the template is inactive
   * @throws {@link InvalidTripInstanceCapacityError} if `totalCapacity <= 0`
   * @throws {@link InvalidTripInstanceTimesError} if `departureTime >= arrivalEstimate`
   * @throws {@link InvalidTripInstanceAutoCancelTimeError} if `autoCancelAt >= departureTime`
   * @throws {@link TripInstanceCreationFailedError} if persistence fails
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

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyCount =
      await this.tripInstanceRepository.countByOrganizationAndMonth(
        organizationId,
        startOfMonth,
        now,
      );
    await this.planLimitService.assertMonthlyTripLimit(
      organizationId,
      monthlyCount,
    );

    return this.unitOfWork.execute(async () => {
      const freshTemplate = await this.tripTemplateRepository.findById(
        input.tripTemplateId,
      );

      if (!freshTemplate) {
        throw new TripTemplateNotFoundError(input.tripTemplateId);
      }

      if (!freshTemplate.isActive()) {
        throw new TripTemplateInactiveError(input.tripTemplateId);
      }

      const departureTime = new Date(input.departureTime);
      const arrivalEstimate = new Date(input.arrivalEstimate);

      const autoCancelAt = this.resolveAutoCancelAt(
        freshTemplate.autoCancelEnabled,
        freshTemplate.autoCancelOffset,
        departureTime,
      );

      const minRevenue = this.resolveMinRevenue(
        input.minRevenue,
        freshTemplate.autoCancelEnabled,
        freshTemplate.minRevenue,
      );

      const instance = TripInstance.create({
        id: randomUUID(),
        organizationId,
        tripTemplateId: input.tripTemplateId,
        driverId: input.driverId ?? null,
        vehicleId: input.vehicleId ?? null,
        totalCapacity: input.totalCapacity,
        isPublic: freshTemplate.isPublic,
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
    });
  }

  /**
   * Calculates `autoCancelAt` by subtracting `autoCancelOffset` minutes from `departureTime`.
   *
   * @returns `null` if auto-cancel is disabled or no offset is configured
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
   * Resolves `minRevenue`: uses DTO override if provided, falls back to the template
   * value when auto-cancel is enabled, or returns `null`.
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
