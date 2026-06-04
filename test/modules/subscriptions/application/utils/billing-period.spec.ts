import { billingPeriodStart } from 'src/modules/subscriptions/application/utils/billing-period';

describe('billingPeriodStart', () => {
  it('should subtract durationDays from expiresAt', () => {
    const expiresAt = new Date(Date.UTC(2026, 5, 30, 12, 0, 0)); // 2026-06-30T12:00:00Z

    const start = billingPeriodStart(expiresAt, 30);

    expect(start).toEqual(new Date(Date.UTC(2026, 4, 31, 12, 0, 0))); // 2026-05-31T12:00:00Z
  });

  it('should keep the time-of-day so the window length is exactly durationDays', () => {
    const expiresAt = new Date(Date.UTC(2026, 0, 15, 8, 30, 45, 123));

    const start = billingPeriodStart(expiresAt, 7);

    expect(start).toEqual(new Date(Date.UTC(2026, 0, 8, 8, 30, 45, 123)));
  });

  it('should not mutate the passed expiresAt', () => {
    const expiresAt = new Date(Date.UTC(2026, 5, 30, 0, 0, 0));
    const snapshot = expiresAt.getTime();

    billingPeriodStart(expiresAt, 30);

    expect(expiresAt.getTime()).toBe(snapshot);
  });

  it('should cross month/year boundaries correctly', () => {
    const expiresAt = new Date(Date.UTC(2026, 0, 5, 0, 0, 0)); // 2026-01-05

    const start = billingPeriodStart(expiresAt, 30);

    expect(start).toEqual(new Date(Date.UTC(2025, 11, 6, 0, 0, 0))); // 2025-12-06
  });
});
