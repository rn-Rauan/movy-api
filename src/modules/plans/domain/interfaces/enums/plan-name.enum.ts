/**
 * Available subscription plan tiers on the Movy platform.
 *
 * Each tier determines the operational limits of the subscribing organisation,
 * including the maximum number of vehicles, drivers, and monthly trips.
 *
 * @see PlanEntity
 */
export enum PlanName {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  PREMIUM = 'PREMIUM',
}
