/**
 * Billing period start date.
 *
 * The billing period window is `[expiresAt − durationDays, expiresAt)`, so its
 * start is simply `expiresAt` shifted back by the plan's duration. Used to
 * count resource consumption (e.g., trips) within the subscription cycle
 * instead of the calendar month — thus, the count only resets when `expiresAt` advances
 * (renewal / plan change), never at the arbitrary turn of the civil month.
 *
 * @param expiresAt - Current billing period end date
 * @param durationDays - Plan duration in days
 * @returns Billing period start date
 */
export function billingPeriodStart(
  expiresAt: Date,
  durationDays: number,
): Date {
  const start = new Date(expiresAt);
  start.setDate(start.getDate() - durationDays);
  return start;
}
