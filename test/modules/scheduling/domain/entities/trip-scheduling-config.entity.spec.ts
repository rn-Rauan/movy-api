import { TripSchedulingConfig } from 'src/modules/scheduling/domain/entities/trip-scheduling-config.entity';
import {
  InvalidSchedulingCronError,
  InvalidSchedulingDaysAheadError,
} from 'src/modules/scheduling/domain/entities/errors/trip-scheduling-config.errors';

describe('TripSchedulingConfig (entity)', () => {
  const baseInput = {
    id: 'config-id-stub',
    organizationId: 'org-id-stub',
  };

  describe('create — defaults', () => {
    it('should apply default daysAhead, crons and enabled when not provided', () => {
      const config = TripSchedulingConfig.create(baseInput);

      expect(config.daysAhead).toBe(14);
      expect(config.generationCron).toBe('0 2 * * *');
      expect(config.autoCancelCron).toBe('*/15 * * * *');
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

  describe('create — cron validation', () => {
    it('should reject malformed generationCron', () => {
      expect(() =>
        TripSchedulingConfig.create({
          ...baseInput,
          generationCron: 'not-a-cron',
        }),
      ).toThrow(InvalidSchedulingCronError);
    });

    it('should reject malformed autoCancelCron', () => {
      expect(() =>
        TripSchedulingConfig.create({
          ...baseInput,
          autoCancelCron: '99 99 * * *',
        }),
      ).toThrow(InvalidSchedulingCronError);
    });

    it('should accept any valid cron expression', () => {
      const config = TripSchedulingConfig.create({
        ...baseInput,
        generationCron: '30 4 * * 1-5',
        autoCancelCron: '*/10 * * * *',
      });
      expect(config.generationCron).toBe('30 4 * * 1-5');
      expect(config.autoCancelCron).toBe('*/10 * * * *');
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

  describe('updateCrons', () => {
    it('should replace only generation when autoCancel is undefined', () => {
      const config = TripSchedulingConfig.create(baseInput);
      config.updateCrons('0 5 * * *');
      expect(config.generationCron).toBe('0 5 * * *');
      expect(config.autoCancelCron).toBe('*/15 * * * *');
    });

    it('should replace only autoCancel when generation is undefined', () => {
      const config = TripSchedulingConfig.create(baseInput);
      config.updateCrons(undefined, '*/5 * * * *');
      expect(config.generationCron).toBe('0 2 * * *');
      expect(config.autoCancelCron).toBe('*/5 * * * *');
    });

    it('should reject malformed cron expressions', () => {
      const config = TripSchedulingConfig.create(baseInput);
      expect(() => config.updateCrons('foo')).toThrow(
        InvalidSchedulingCronError,
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
