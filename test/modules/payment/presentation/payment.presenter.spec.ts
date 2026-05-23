import { PaymentStatus } from 'src/modules/payment/domain/interfaces/enums/payment-status.enum';
import { MethodPayment } from 'src/modules/payment/domain/interfaces/enums/method-payment.enum';
import { PaymentPresenter } from 'src/modules/payment/presentation/mappers/payment.presenter';
import { makePayment } from '../factories/payment.factory';

describe('PaymentPresenter.toHTTP', () => {
  it('serialises base fields and unwraps Money to a number', () => {
    const payment = makePayment({
      id: 'payment-1',
      organizationId: 'org-1',
      enrollmentId: 'enrollment-1',
      method: MethodPayment.PIX,
      amount: 23,
      status: PaymentStatus.COMPLETED,
    });

    const dto = PaymentPresenter.toHTTP(payment);

    expect(dto.id).toBe('payment-1');
    expect(dto.organizationId).toBe('org-1');
    expect(dto.enrollmentId).toBe('enrollment-1');
    expect(dto.method).toBe(MethodPayment.PIX);
    expect(dto.amount).toBe(23);
    expect(dto.status).toBe(PaymentStatus.COMPLETED);
  });

  it('exposes tripInstanceId and tripDepartureTime when the entity carries the snapshot', () => {
    const departureTime = new Date('2026-05-22T11:00:00.000Z');
    const payment = makePayment({
      tripInstanceId: 'trip-instance-1',
      tripDepartureTime: departureTime,
    });

    const dto = PaymentPresenter.toHTTP(payment);

    expect(dto.tripInstanceId).toBe('trip-instance-1');
    expect(dto.tripDepartureTime).toBe(departureTime);
  });

  it('omits trip snapshot fields when the entity has no enrollment relation loaded', () => {
    const payment = makePayment();

    const dto = PaymentPresenter.toHTTP(payment);

    expect(dto.tripInstanceId).toBeUndefined();
    expect(dto.tripDepartureTime).toBeUndefined();
  });
});
