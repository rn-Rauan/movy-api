import { Injectable } from '@nestjs/common';
import { TripInstance } from '../../domain/entities';
import {
  TripTemplateAccessForbiddenError,
  TripTemplateNotFoundError,
} from '../../domain/entities/errors/trip-template.errors';
import {
  TripInstanceRepository,
  TripTemplateRepository,
} from '../../domain/interfaces';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';

/**
 * Returns a paginated list of {@link TripInstance} items derived from a specific {@link TripTemplate}.
 *
 * Validates that the template exists and belongs to the requesting organisation
 * before delegating to the repository.
 */
@Injectable()
export class FindTripInstancesByTemplateUseCase {
  constructor(
    private readonly tripInstanceRepository: TripInstanceRepository,
    private readonly tripTemplateRepository: TripTemplateRepository,
  ) {}

  /**
   * Validates template ownership and returns the paginated list of instances.
   *
   * @param templateId - UUID of the trip template
   * @param organizationId - UUID of the organisation (from JWT)
   * @param options - Pagination parameters `{ page, limit }`
   * @returns A {@link PaginatedResponse} of {@link TripInstance} items ordered by `departureTime`
   * @throws {@link TripTemplateNotFoundError} if the template does not exist
   * @throws {@link TripTemplateAccessForbiddenError} if the template belongs to a different org
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
