import { Injectable } from '@nestjs/common';
import { TripTemplate } from '../../domain/entities';
import {
  TripTemplateAccessForbiddenError,
  TripTemplateNotFoundError,
} from '../../domain/entities/errors/trip-template.errors';
import { TripTemplateRepository } from '../../domain/interfaces';

@Injectable()
export class FindTripTemplateByIdUseCase {
  constructor(
    private readonly tripTemplateRepository: TripTemplateRepository,
  ) {}

  /**
   * Finds a trip template by its unique ID, scoped to the requesting organization.
   * @param id - UUID of the trip template
   * @param organizationId - UUID of the organization from JWT context
   * @returns TripTemplate found
   * @throws TripTemplateNotFoundError if trip template does not exist
   * @throws TripTemplateAccessForbiddenError if template belongs to a different organization
   */
  async execute(id: string, organizationId: string): Promise<TripTemplate> {
    const tripTemplate = await this.tripTemplateRepository.findById(id);

    if (!tripTemplate) {
      throw new TripTemplateNotFoundError(id);
    }

    if (tripTemplate.organizationId !== organizationId) {
      throw new TripTemplateAccessForbiddenError(id);
    }

    return tripTemplate;
  }
}
