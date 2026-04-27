/**
 * Booking (enrollment) type for a passenger on a trip instance.
 *
 * Determines which price from the `TripTemplate` is applied when
 * `recordedPrice` is resolved server-side during booking creation.
 *
 * - `ONE_WAY` — single-direction trip
 * - `RETURN` — single-direction with a return journey already registered separately
 * - `ROUND_TRIP` — outbound and return journey bundled in one booking
 */
export enum EnrollmentType {
  ONE_WAY = 'ONE_WAY',
  RETURN = 'RETURN',
  ROUND_TRIP = 'ROUND_TRIP',
}
