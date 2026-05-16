/**
 * Helpers for combining a calendar date (YYYY-MM-DD) with a time-of-day (HH:mm)
 * stored on a {@link TripTemplate}, producing the concrete UTC `Date` instants
 * used as `TripInstance.departureTime` / `TripInstance.arrivalEstimate`.
 *
 * All operations are in UTC. Local timezone conversion is the responsibility of
 * the presentation layer (frontend).
 */

const HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/** True when `value` matches the `HH:mm` 24-hour format. */
export function isValidTimeOfDay(value: string): boolean {
  return HHMM_REGEX.test(value);
}

/** Converts `HH:mm` to total minutes since midnight. Assumes the input is valid. */
export function timeOfDayToMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Combines a calendar date (`YYYY-MM-DD`) with a time-of-day (`HH:mm`) into a UTC `Date`.
 *
 * @param dateISO - Date portion as `YYYY-MM-DD`
 * @param timeHHmm - Time portion as `HH:mm`
 * @param addDay - When true, adds 24h to the result (used when arrival crosses midnight)
 */
export function combineDateAndTime(
  dateISO: string,
  timeHHmm: string,
  addDay = false,
): Date {
  const [y, m, d] = dateISO.split('-').map(Number);
  const [hh, mm] = timeHHmm.split(':').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d, hh, mm, 0, 0));
  if (addDay) {
    base.setUTCDate(base.getUTCDate() + 1);
  }
  return base;
}

/**
 * Returns true when `arrivalHHmm <= departureHHmm`, indicating the arrival occurs
 * on the day *after* the departure (e.g. departure 23:30 → arrival 00:15).
 */
export function arrivalCrossesMidnight(
  departureHHmm: string,
  arrivalHHmm: string,
): boolean {
  return timeOfDayToMinutes(arrivalHHmm) <= timeOfDayToMinutes(departureHHmm);
}
