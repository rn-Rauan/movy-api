import { SubscriptionEntity } from 'src/modules/subscriptions/domain/entities/subscription.entity';
import { SubscriptionStatus } from 'src/modules/subscriptions/domain/interfaces/enums/subscription-status.enum';

describe('SubscriptionEntity.changePlan', () => {
  const ENROLLED_AT = new Date(Date.UTC(2026, 4, 24, 16, 46, 0)); // 2026-05-24
  const CHANGED_AT = new Date(Date.UTC(2026, 5, 4, 12, 0, 0)); // 2026-06-04

  function makeRestored() {
    return SubscriptionEntity.restore({
      id: 'sub-1',
      organizationId: 'org-1',
      planId: 1,
      status: SubscriptionStatus.ACTIVE,
      startDate: ENROLLED_AT,
      expiresAt: new Date(Date.UTC(2026, 5, 23, 16, 46, 0)), // 2026-06-23
      createdAt: ENROLLED_AT,
      updatedAt: ENROLLED_AT,
    });
  }

  beforeEach(() => jest.useFakeTimers().setSystemTime(CHANGED_AT));
  afterEach(() => jest.useRealTimers());

  it('should restart the term: startDate = now and expiresAt = now + durationDays', () => {
    const sub = makeRestored();

    sub.changePlan(2, 30);

    expect(sub.startDate).toEqual(CHANGED_AT);
    expect(sub.expiresAt).toEqual(new Date(Date.UTC(2026, 6, 4, 12, 0, 0))); // 2026-07-04
    expect(sub.planId).toBe(2);
  });

  it('should preserve id, organizationId and the original createdAt (enrolment instant)', () => {
    const sub = makeRestored();

    sub.changePlan(3, 30);

    expect(sub.id).toBe('sub-1');
    expect(sub.organizationId).toBe('org-1');
    expect(sub.createdAt).toEqual(ENROLLED_AT);
  });
});
