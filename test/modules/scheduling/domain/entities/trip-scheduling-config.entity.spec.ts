import { TripSchedulingConfig } from 'src/modules/scheduling/domain/entities/trip-scheduling-config.entity';
import { InvalidSchedulingDaysAheadError } from 'src/modules/scheduling/domain/entities/errors/trip-scheduling-config.errors';

describe('TripSchedulingConfig (entity)', () => {
  const baseInput = {
    id: 'config-id-stub',
    organizationId: 'org-id-stub',
  };

  describe('create — defaults', () => {
    it('should apply default daysAhead and enabled when not provided', () => {
      const config = TripSchedulingConfig.create(baseInput);

      expect(config.daysAhead).toBe(14);
      expect(config.enabled).toBe(true);
    });
  });

  describe('create — daysAhead validation', () => {
    it.each([0, -1, 91, 1.5])(
      'should reject daysAhead = %s with InvalidSchedulingDaysAheadError',
      (value) => {
        expect(() =>
          TripSchedulingConfig.create({ ...baseInput, daysAhead: value }),
        ).toThrow(InvalidSchedulingDaysAheadError);
      },
    );

    it.each([1, 30, 90])('should accept boundary daysAhead = %s', (value) => {
      const config = TripSchedulingConfig.create({
        ...baseInput,
        daysAhead: value,
      });
      expect(config.daysAhead).toBe(value);
    });
  });

  describe('updateDaysAhead', () => {
    it('should update on valid value', () => {
      const config = TripSchedulingConfig.create(baseInput);
      config.updateDaysAhead(45);
      expect(config.daysAhead).toBe(45);
    });

    it('should throw on out-of-range value', () => {
      const config = TripSchedulingConfig.create(baseInput);
      expect(() => config.updateDaysAhead(0)).toThrow(
        InvalidSchedulingDaysAheadError,
      );
    });
  });

  describe('setEnabled', () => {
    it('should flip enabled flag', () => {
      const config = TripSchedulingConfig.create(baseInput);
      config.setEnabled(false);
      expect(config.enabled).toBe(false);
    });
  });
});
