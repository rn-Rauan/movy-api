import {
  PaginatedResponse,
  PaginationOptions,
} from 'src/shared/domain/interfaces';
import { TripInstance } from '../entities';

/**
 * Enriched projection returned by the public trip listing query.
 *
 * @remarks
 * Combines fields from the {@link TripInstance} aggregate with the read-only
 * route and pricing snapshot sourced from its parent `TripTemplate`.  This is
 * intentionally a **read model** — it is never used to reconstruct or mutate
 * either aggregate.
 */
export interface PublicTripInstanceData {
  /** The trip instance aggregate. */
  instance: TripInstance;
  /** Human-readable departure location inherited from the template. */
  departurePoint: string;
  /** Human-readable destination inherited from the template. */
  destination: string;
  /** One-way ticket price in the organisation's currency, or `null` if not offered. */
  priceOneWay: number | null;
  /** Return-leg price, or `null` if not offered. */
  priceReturn: number | null;
  /** Round-trip price, or `null` if not offered. */
  priceRoundTrip: number | null;
  /** Whether the trip repeats on a schedule. */
  isRecurring: boolean;
}

/**
 * Query service contract for public, unauthenticated trip listings.
 *
 * @remarks
 * Repositories manage a single aggregate's lifecycle (SRP).  This service
 * exists specifically for the cross-aggregate read projection required by the
 * public home page — it JOINs `tripInstance` with `tripTemplate` and returns
 * the combined {@link PublicTripInstanceData} shape.
 *
 * The concrete implementation lives at
 * `infrastructure/db/services/prisma-public-trip-query.service.ts`.
 * Registered in the NestJS DI container as an abstract class token.
 */
export abstract class PublicTripQueryService {
  abstract findPublic(
    options: PaginationOptions,
    organizationId?: string,
  ): Promise<PaginatedResponse<PublicTripInstanceData>>;

  /**
   * Returns SCHEDULED/CONFIRMED trips for a specific org identified by slug,
   * regardless of `isPublic` — used for org-specific listing pages.
   */
  abstract findByOrgSlug(
    options: PaginationOptions,
    slug: string,
  ): Promise<PaginatedResponse<PublicTripInstanceData>>;
}
