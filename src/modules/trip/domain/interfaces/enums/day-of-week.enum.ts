/**
 * Days of the week used to define the recurrence frequency of a {@link TripTemplate}.
 *
 * @remarks
 * A recurring template must declare at least one value in its `frequency` array.
 * Non-recurring templates use an empty array.
 */
export enum DayOfWeek {
  SUNDAY = 'SUNDAY',
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
}
