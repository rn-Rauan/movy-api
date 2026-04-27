import { Injectable } from '@nestjs/common';
import {
  TripTemplateAccessForbiddenError,
  TripTemplateNotFoundError,
} from '../../domain/entities/errors/trip-template.errors';
import { TripTemplateRepository } from '../../domain/interfaces';

/**
 * Soft-deactivates a {@link TripTemplate} by setting its `status` to `INACTIVE`.
 *
 * Once deactivated, no new {@link TripInstance} can be created from the template.
 * Existing instances are unaffected.
 */
@Injectable()
export class DeactivateTripTemplateUseCase {
  constructor(
    private readonly tripTemplateRepository: TripTemplateRepository,
  ) {}

  /**
   * Deactivates the template after validating ownership.
   *
   * @param id - UUID of the trip template to deactivate
   * @param organizationId - UUID of the organisation (from JWT)
   * @throws {@link TripTemplateNotFoundError} if the template does not exist
   * @throws {@link TripTemplateAccessForbiddenError} if the template belongs to a different org
   */
  async execute(id: string, organizationId: string): Promise<void> {
    const tripTemplate = await this.tripTemplateRepository.findById(id);

    if (!tripTemplate) {
      throw new TripTemplateNotFoundError(id);
    }

    if (tripTemplate.organizationId !== organizationId) {
      throw new TripTemplateAccessForbiddenError(id);
    }

    tripTemplate.deactivate();

    await this.tripTemplateRepository.update(tripTemplate);
  }
}
