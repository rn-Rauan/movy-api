import { Injectable } from '@nestjs/common';
import { TripTemplate } from '../../domain/entities';
import {
  TripTemplateAccessForbiddenError,
  TripTemplateNotFoundError,
} from '../../domain/entities/errors/trip-template.errors';
import { TripTemplateRepository } from '../../domain/interfaces';

/**
 * Retrieves a single {@link TripTemplate} by its UUID.
 *
 * Enforces organisation-scoped access: only members of the owning
 * organisation may read the template.
 */
@Injectable()
export class FindTripTemplateByIdUseCase {
  constructor(
    private readonly tripTemplateRepository: TripTemplateRepository,
  ) {}

  /**
   * Looks up the template and validates org ownership.
   *
   * @param id - UUID of the trip template
   * @param organizationId - UUID of the organisation (from JWT)
   * @returns The matching {@link TripTemplate}
   * @throws {@link TripTemplateNotFoundError} if the template does not exist
   * @throws {@link TripTemplateAccessForbiddenError} if the template belongs to a different org
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
