/**
 * Lifecycle states of a subscription.
 *
 * - `ACTIVE` — the subscription is valid and grants the organisation its plan benefits.
 * - `CANCELED` — the subscription was explicitly cancelled by an admin; no refund logic
 *   is applied in the domain layer.
 * - `PAST_DUE` — the subscription expired without renewal (currently set externally
 *   by a scheduled task or webhook).
 */
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  PAST_DUE = 'PAST_DUE',
}
