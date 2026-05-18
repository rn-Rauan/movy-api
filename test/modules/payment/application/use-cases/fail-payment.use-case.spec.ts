import { DriverRepository } from 'src/modules/driver/domain/interfaces/driver.repository';
import { DriverStatus } from 'src/modules/driver/domain/interfaces/enums/driver-status.enum';
import { FailPaymentUseCase } from 'src/modules/payment/application/use-cases/fail-payment.use-case';
import {
  PaymentAlreadyProcessedError,
  PaymentNotAssignedToDriverError,
  PaymentNotFoundError,
} from 'src/modules/payment/domain/errors/payment.errors';
import { PaymentStatus } from 'src/modules/payment/domain/interfaces/enums/payment-status.enum';
import { PaymentRepository } from 'src/modules/payment/domain/interfaces/payment.repository';
import { RoleName } from 'src/shared/domain/types';
import { makeDriver } from '../../../driver/factories/driver.factory';
import { makePayment } from '../../factories/payment.factory';

// ── Mocks ───────────────────────────────────────────────

function makeMocks() {
  const paymentRepository = {
    findById: jest.fn(),
    findDriverIdByPaymentId: jest.fn(),
    update: jest.fn(),
  } as any as jest.Mocked<PaymentRepository>;

  const driverRepository = {
    findByUserId: jest.fn(),
  } as any as jest.Mocked<DriverRepository>;

  return { paymentRepository, driverRepository };
}

// ── Tests ───────────────────────────────────────────────

const PAYMENT_ID = 'payment-id-stub';
const ORG_ID = 'org-id-stub';
const ADMIN_CTX = { userId: 'admin-user', role: RoleName.ADMIN } as const;
const DRIVER_CTX = { userId: 'driver-user', role: RoleName.DRIVER } as const;

describe('FailPaymentUseCase', () => {
  let sut: FailPaymentUseCase;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
    sut = new FailPaymentUseCase(
      mocks.paymentRepository,
      mocks.driverRepository,
    );
  });

  describe('ADMIN caller', () => {
    it('should fail a PENDING payment without checking driver ownership', async () => {
      const payment = makePayment({ id: PAYMENT_ID, organizationId: ORG_ID });
      mocks.paymentRepository.findById.mockResolvedValue(payment);
      mocks.paymentRepository.update.mockResolvedValue(payment);

      const result = await sut.execute(PAYMENT_ID, ORG_ID, ADMIN_CTX);

      expect(result.status).toBe(PaymentStatus.FAILED);
      expect(mocks.driverRepository.findByUserId).not.toHaveBeenCalled();
    });

    it('should throw PaymentNotFoundError when payment does not exist', async () => {
      mocks.paymentRepository.findById.mockResolvedValue(null);

      await expect(sut.execute(PAYMENT_ID, ORG_ID, ADMIN_CTX)).rejects.toThrow(
        PaymentNotFoundError,
      );
    });

    it('should throw PaymentAlreadyProcessedError when payment is not PENDING', async () => {
      const payment = makePayment({
        id: PAYMENT_ID,
        organizationId: ORG_ID,
        status: PaymentStatus.FAILED,
      });
      mocks.paymentRepository.findById.mockResolvedValue(payment);

      await expect(sut.execute(PAYMENT_ID, ORG_ID, ADMIN_CTX)).rejects.toThrow(
        PaymentAlreadyProcessedError,
      );
    });
  });

  describe('DRIVER caller', () => {
    it('should fail when the driver is assigned to the payment trip instance', async () => {
      const driver = makeDriver({ id: 'driver-1', userId: DRIVER_CTX.userId });
      const payment = makePayment({ id: PAYMENT_ID, organizationId: ORG_ID });

      mocks.paymentRepository.findById.mockResolvedValue(payment);
      mocks.driverRepository.findByUserId.mockResolvedValue(driver);
      mocks.paymentRepository.findDriverIdByPaymentId.mockResolvedValue(
        'driver-1',
      );
      mocks.paymentRepository.update.mockResolvedValue(payment);

      const result = await sut.execute(PAYMENT_ID, ORG_ID, DRIVER_CTX);

      expect(result.status).toBe(PaymentStatus.FAILED);
    });

    it('should throw PaymentNotAssignedToDriverError when driver does not own the trip', async () => {
      const driver = makeDriver({ id: 'driver-1', userId: DRIVER_CTX.userId });
      const payment = makePayment({ id: PAYMENT_ID, organizationId: ORG_ID });

      mocks.paymentRepository.findById.mockResolvedValue(payment);
      mocks.driverRepository.findByUserId.mockResolvedValue(driver);
      mocks.paymentRepository.findDriverIdByPaymentId.mockResolvedValue(
        'driver-2',
      );

      await expect(sut.execute(PAYMENT_ID, ORG_ID, DRIVER_CTX)).rejects.toThrow(
        PaymentNotAssignedToDriverError,
      );
      expect(mocks.paymentRepository.update).not.toHaveBeenCalled();
    });

    it('should throw PaymentNotAssignedToDriverError when driver is INACTIVE', async () => {
      const driver = makeDriver({
        id: 'driver-1',
        userId: DRIVER_CTX.userId,
        driverStatus: DriverStatus.INACTIVE,
      });
      const payment = makePayment({ id: PAYMENT_ID, organizationId: ORG_ID });

      mocks.paymentRepository.findById.mockResolvedValue(payment);
      mocks.driverRepository.findByUserId.mockResolvedValue(driver);
      mocks.paymentRepository.findDriverIdByPaymentId.mockResolvedValue(
        'driver-1',
      );

      await expect(sut.execute(PAYMENT_ID, ORG_ID, DRIVER_CTX)).rejects.toThrow(
        PaymentNotAssignedToDriverError,
      );
      expect(mocks.paymentRepository.update).not.toHaveBeenCalled();
    });
  });
});
