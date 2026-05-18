import { Injectable } from '@nestjs/common';
import { DriverRepository } from 'src/modules/driver/domain/interfaces/driver.repository';
import { DriverStatus } from 'src/modules/driver/domain/interfaces/enums/driver-status.enum';
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
 * to the driver linked to the authenticated user, scoped to the caller's
 * organisation.
 *
 * Behaviour notes:
 * - Resolves `userId → driverId` via {@link DriverRepository.findByUserId}.
 * - Scopes results to `organizationId` from the caller's `TenantContext` to
 *   prevent cross-tenant leaks (a driver may hold memberships in multiple
 *   organisations; the `Driver` entity itself is 1:1 with `User`).
 * - If the user has no driver profile yet (onboarding state) **or** the
 *   driver is not `ACTIVE`, returns an empty page rather than erroring —
 *   the FE handles "no trips", "no profile", and "deactivated" identically.
 */
@Injectable()
export class FindTripInstancesByDriverMeUseCase {
  constructor(
    private readonly tripInstanceRepository: TripInstanceRepository,
    private readonly driverRepository: DriverRepository,
  ) {}

  async execute(
    userId: string,
    organizationId: string | undefined,
    options: PaginationOptions,
    status?: TripStatus,
  ): Promise<PaginatedResponse<TripInstanceWithMeta>> {
    const emptyPage: PaginatedResponse<TripInstanceWithMeta> = {
      data: [],
      total: 0,
      page: options.page,
      limit: options.limit,
      totalPages: 0,
    };

    // No org in session (dev account, B2C user, or missing JWT enrichment)
    // → no tenant scope to filter by → return empty rather than leak.
    if (!organizationId) {
      return emptyPage;
    }

    const driver = await this.driverRepository.findByUserId(userId);

    if (!driver || driver.driverStatus !== DriverStatus.ACTIVE) {
      return emptyPage;
    }

    return this.tripInstanceRepository.findByDriverIdWithMeta(
      driver.id,
      organizationId,
      options,
      status,
    );
  }
}
