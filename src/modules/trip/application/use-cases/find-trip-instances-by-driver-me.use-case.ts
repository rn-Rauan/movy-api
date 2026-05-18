import { Injectable } from '@nestjs/common';
import { DriverRepository } from 'src/modules/driver/domain/interfaces/driver.repository';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import {
  TripInstanceRepository,
  TripInstanceWithMeta,
  TripStatus,
} from '../../domain/interfaces';

/**
 * Returns a paginated, enriched list of {@link TripInstance} items assigned
 * to the driver linked to the authenticated user.
 *
 * Behaviour notes:
 * - Resolves `userId → driverId` via {@link DriverRepository.findByUserId}.
 * - If the user has no driver profile yet (onboarding state), returns an
 *   empty page rather than erroring — the FE handles "no trips" the same
 *   way as "no driver profile".
 */
@Injectable()
export class FindTripInstancesByDriverMeUseCase {
  constructor(
    private readonly tripInstanceRepository: TripInstanceRepository,
    private readonly driverRepository: DriverRepository,
  ) {}

  async execute(
    userId: string,
    options: PaginationOptions,
    status?: TripStatus,
  ): Promise<PaginatedResponse<TripInstanceWithMeta>> {
    const driver = await this.driverRepository.findByUserId(userId);

    if (!driver) {
      return {
        data: [],
        total: 0,
        page: options.page,
        limit: options.limit,
        totalPages: 0,
      };
    }

    return this.tripInstanceRepository.findByDriverIdWithMeta(
      driver.id,
      options,
      status,
    );
  }
}
