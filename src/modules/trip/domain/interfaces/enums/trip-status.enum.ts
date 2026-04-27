/**
 * Lifecycle state machine for a {@link TripInstance}.
 *
 * Valid transitions:
 * - `DRAFT` → `SCHEDULED` (requires driver + vehicle) | `CANCELED`
 * - `SCHEDULED` → `CONFIRMED` (requires driver + vehicle) | `CANCELED`
 * - `CONFIRMED` → `IN_PROGRESS` (requires driver + vehicle) | `SCHEDULED` (revert) | `CANCELED`
 * - `IN_PROGRESS` → `FINISHED` | `CANCELED`
 * - `FINISHED` → terminal
 * - `CANCELED` → terminal
 */
export enum TripStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  CANCELED = 'CANCELED',
}
