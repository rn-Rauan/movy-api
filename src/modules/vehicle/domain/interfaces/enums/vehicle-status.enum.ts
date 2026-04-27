/**
 * Operational status of a {@link VehicleEntity}.
 *
 * @remarks
 * - `ACTIVE` — vehicle is available for assignment to trip instances
 * - `INACTIVE` — vehicle has been soft-deleted via `RemoveVehicleUseCase`;
 *   historical trip references remain intact due to `onDelete: Restrict`
 */
export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}
