import { DayEntry, MonthEntry } from './month.model';

const pad = (value: number): string => String(value).padStart(2, '0');

/** Builds every calendar day of the given month, in ascending order. */
function buildDays(year: number, month: number): DayEntry[] {
  // Day 0 of the next month is the last day of this one.
  const dayCount = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: dayCount }, (_, index) => {
    const day = index + 1;
    return {
      key: `${year}-${pad(month + 1)}-${pad(day)}`,
      date: new Date(year, month, day),
    };
  });
}

/** Builds the twelve months of the given year, January first. */
export function buildMonthsOfYear(year: number): MonthEntry[] {
  return Array.from({ length: 12 }, (_, month) => ({
    key: `${year}-${pad(month + 1)}`,
    date: new Date(year, month, 1),
    days: buildDays(year, month),
  }));
}
