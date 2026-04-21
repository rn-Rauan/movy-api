import { Injectable } from '@nestjs/common';
import { TripInstance } from '../../domain/entities';
import {
  TripTemplateAccessForbiddenError,
  TripTemplateNotFoundError,
} from '../../domain/entities/errors/trip-template.errors';
import { TripInstanceRepository, TripTemplateRepository } from '../../domain/interfaces';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';

@Injectable()
export class FindTripInstancesByTemplateUseCase {
  constructor(
    private readonly tripInstanceRepository: TripInstanceRepository,
    private readonly tripTemplateRepository: TripTemplateRepository,
  ) {}

  /**
   * Lists all trip instances for a given trip template, scoped to the requesting organization.
   * Validates template ownership before querying instances.
   * @param templateId - UUID of the trip template
   * @param organizationId - UUID of the organization from JWT context
   * @param options - Pagination options (page, limit)
   * @returns Paginated response with TripInstance list ordered by departure time
   * @throws TripTemplateNotFoundError if the template does not exist
   * @throws TripTemplateAccessForbiddenError if the template belongs to a different organization
   */
  async execute(
    templateId: string,
    organizationId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResponse<TripInstance>> {
    const template = await this.tripTemplateRepository.findById(templateId);

    if (!template) {
      throw new TripTemplateNotFoundError(templateId);
    }

    if (template.organizationId !== organizationId) {
      throw new TripTemplateAccessForbiddenError(templateId);
    }

    return this.tripInstanceRepository.findByTemplateId(templateId, options);
  }
}
