import { Injectable } from '@nestjs/common';
import {
  TripTemplateAccessForbiddenError,
  TripTemplateNotFoundError,
} from '../../domain/entities/errors/trip-template.errors';
import { TripTemplateRepository } from '../../domain/interfaces';

@Injectable()
export class DeactivateTripTemplateUseCase {
  constructor(
    private readonly tripTemplateRepository: TripTemplateRepository,
  ) {}

  /**
   * Soft-deletes a trip template by setting its status to INACTIVE.
   * @param id - UUID of the trip template to deactivate
   * @param organizationId - UUID of the organization from JWT context
   * @throws TripTemplateNotFoundError if trip template does not exist
   * @throws TripTemplateAccessForbiddenError if template belongs to a different organization
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
