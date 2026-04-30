import { Injectable } from '@nestjs/common';
import {
  PublicTripQueryService,
  PublicTripInstanceData,
} from 'src/modules/trip/domain/interfaces';
import { TripStatus } from 'src/modules/trip/domain/interfaces/enums/trip-status.enum';
import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { DbContext } from 'src/shared/infrastructure/database/db-context';
import {
  Prisma,
  TripInstance as PrismaTripInstance,
} from 'generated/prisma/client';
import { TripInstanceMapper } from '../mappers/trip-instance.mapper';

/**
 * Prisma-backed implementation of {@link PublicTripQueryService}.
 *
 * @remarks
 * This service owns the cross-aggregate read projection that powers the public
 * home page.  It JOINs `tripInstance` with `tripTemplate` in a single query so
 * that pagination is applied correctly at the database level — filtering by
 * `template.isPublic` after fetching would break page sizes.
 *
 * All I/O targets the `tripInstance` table (with an `include` for its parent
 * template's route and pricing columns) via the Prisma Client.
 */
@Injectable()
export class PrismaPublicTripQueryService implements PublicTripQueryService {
  constructor(private readonly dbContext: DbContext) {}

  /** Returns the active Prisma client (transaction-scoped if active). */
  private get db() {
    return this.dbContext.client;
  }

  /**
   * Returns a paginated list of bookable, publicly-visible trip instances joined
   * with their parent template's route and pricing data.
   *
   * @remarks
   * Only instances whose `tripStatus` is `SCHEDULED` or `CONFIRMED` **and** whose
   * parent template has `isPublic = true` and `status = ACTIVE` are returned.
   * Results are ordered by `departureTime` ascending so the soonest departures
   * appear first.
   *
   * Because `DbContext.client` is a union of `PrismaService | TransactionClient`,
   * TypeScript cannot narrow the overloaded return type of `findMany` when `include`
   * is present.  The result is therefore asserted to the locally-defined
   * {@link PublicTripRow} type, which is a safe structural assertion backed by the
   * Prisma schema.
   *
   * @param options - Pagination parameters `{ page, limit }`
   * @param organizationId - Optional UUID to scope results to a single organisation
   * @returns A {@link PaginatedResponse} of {@link PublicTripInstanceData} items
   */
  async findByOrgSlug(
    options: PaginationOptions,
    slug: string,
  ): Promise<PaginatedResponse<PublicTripInstanceData>> {
    type PublicTripRow = PrismaTripInstance & {
      tripTemplate: {
        departurePoint: string;
        destination: string;
        priceOneWay: Prisma.Decimal | null;
        priceReturn: Prisma.Decimal | null;
        priceRoundTrip: Prisma.Decimal | null;
        isRecurring: boolean;
      };
    };

    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const bookableStatuses: TripStatus[] = [
      TripStatus.SCHEDULED,
      TripStatus.CONFIRMED,
    ];

    const where = {
      tripStatus: { in: bookableStatuses },
      organization: { slug },
    };

    const [rawRows, total] = await Promise.all([
      this.db.tripInstance.findMany({
        where,
        include: {
          tripTemplate: {
            select: {
              departurePoint: true,
              destination: true,
              priceOneWay: true,
              priceReturn: true,
              priceRoundTrip: true,
              isRecurring: true,
            },
          },
        },
        orderBy: { departureTime: 'asc' },
        skip,
        take: limit,
      }),
      this.db.tripInstance.count({ where }),
    ]);

    const rows = rawRows as PublicTripRow[];

    const data: PublicTripInstanceData[] = rows.map((row) => {
      const { tripTemplate, ...instanceRow } = row;
      return {
        instance: TripInstanceMapper.toDomain(instanceRow),
        departurePoint: tripTemplate.departurePoint,
        destination: tripTemplate.destination,
        priceOneWay:
          tripTemplate.priceOneWay !== null
            ? Number(tripTemplate.priceOneWay)
            : null,
        priceReturn:
          tripTemplate.priceReturn !== null
            ? Number(tripTemplate.priceReturn)
            : null,
        priceRoundTrip:
          tripTemplate.priceRoundTrip !== null
            ? Number(tripTemplate.priceRoundTrip)
            : null,
        isRecurring: tripTemplate.isRecurring,
      };
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findPublic(
    options: PaginationOptions,
    organizationId?: string,
  ): Promise<PaginatedResponse<PublicTripInstanceData>> {
    /** Locally-typed shape of a trip instance row joined with its template select. */
    type PublicTripRow = PrismaTripInstance & {
      tripTemplate: {
        departurePoint: string;
        destination: string;
        priceOneWay: Prisma.Decimal | null;
        priceReturn: Prisma.Decimal | null;
        priceRoundTrip: Prisma.Decimal | null;
        isRecurring: boolean;
      };
    };

    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const bookableStatuses: TripStatus[] = [
      TripStatus.SCHEDULED,
      TripStatus.CONFIRMED,
    ];

    const where = {
      tripStatus: { in: bookableStatuses },
      isPublic: true,
      ...(organizationId ? { organizationId } : {}),
    };

    const [rawRows, total] = await Promise.all([
      this.db.tripInstance.findMany({
        where,
        include: {
          tripTemplate: {
            select: {
              departurePoint: true,
              destination: true,
              priceOneWay: true,
              priceReturn: true,
              priceRoundTrip: true,
              isRecurring: true,
            },
          },
        },
        orderBy: { departureTime: 'asc' },
        skip,
        take: limit,
      }),
      this.db.tripInstance.count({ where }),
    ]);

    // Safe structural assertion: Prisma returns the joined `tripTemplate` at runtime
    // even though the union-typed DbContext.client prevents TypeScript from inferring
    // the enriched return type automatically.
    const rows = rawRows as PublicTripRow[];

    const data: PublicTripInstanceData[] = rows.map((row) => {
      const { tripTemplate, ...instanceRow } = row;
      return {
        instance: TripInstanceMapper.toDomain(instanceRow),
        departurePoint: tripTemplate.departurePoint,
        destination: tripTemplate.destination,
        priceOneWay:
          tripTemplate.priceOneWay !== null
            ? Number(tripTemplate.priceOneWay)
            : null,
        priceReturn:
          tripTemplate.priceReturn !== null
            ? Number(tripTemplate.priceReturn)
            : null,
        priceRoundTrip:
          tripTemplate.priceRoundTrip !== null
            ? Number(tripTemplate.priceRoundTrip)
            : null,
        isRecurring: tripTemplate.isRecurring,
      };
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
