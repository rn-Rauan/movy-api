/**
 * Classifies the physical type of a vehicle registered on the platform.
 *
 * @remarks
 * - `VAN` — light commercial van (typically up to ~15 seats)
 * - `MINIBUS` — medium-capacity minibus (typically 15–29 seats)
 * - `BUS` — large capacity bus (30+ seats)
 * - `CAR` — passenger car (typically up to 5 seats)
 *
 * Mirrors the `VehicleType` enum in the Prisma schema.
 */
export enum VehicleType {
  VAN = 'VAN',
  BUS = 'BUS',
  MINIBUS = 'MINIBUS',
  CAR = 'CAR',
}
