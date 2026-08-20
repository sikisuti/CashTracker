import { DailyBalance } from './daily-balance.model';
import { DayEntry, MonthEntry } from './month.model';

const pad = (value: number): string => String(value).padStart(2, '0');

/** Local-time ISO date key. Deliberately not `toISOString()`, which shifts to UTC. */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** First day of the month `offset` months away from `anchor`. */
function startOfMonth(anchor: Date, offset: number): Date {
  return new Date(anchor.getFullYear(), anchor.getMonth() + offset, 1);
}

/** Last day of the month `offset` months away from `anchor` (day 0 = last day of the month before). */
function endOfMonth(anchor: Date, offset: number): Date {
  return new Date(anchor.getFullYear(), anchor.getMonth() + offset + 1, 0);
}

/**
 * Inclusive first/last calendar day covered by a window of whole months around `anchor` -- the
 * date range to ask the backend for.
 */
export function monthWindowBounds(
  anchor: Date,
  monthsBack: number,
  monthsForward: number,
): { from: Date; to: Date } {
  return { from: startOfMonth(anchor, -monthsBack), to: endOfMonth(anchor, monthsForward) };
}

function buildDays(
  year: number,
  month: number,
  balances: ReadonlyMap<string, DailyBalance>,
): DayEntry[] {
  const dayCount = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(year, month, index + 1);
    const key = toDateKey(date);
    const weekday = date.getDay();
    return {
      key,
      date,
      weekend: weekday === 0 || weekday === 6,
      balance: balances.get(key) ?? null,
    };
  });
}

/**
 * The whole months from `monthsBack` before `anchor` to `monthsForward` after it, oldest first,
 * with each day joined to its stored balance (null where the database has no row).
 */
export function buildMonthWindow(
  anchor: Date,
  monthsBack: number,
  monthsForward: number,
  balances: ReadonlyMap<string, DailyBalance>,
): MonthEntry[] {
  const monthCount = monthsBack + monthsForward + 1;

  return Array.from({ length: monthCount }, (_, index) => {
    const first = startOfMonth(anchor, index - monthsBack);
    const days = buildDays(first.getFullYear(), first.getMonth(), balances);

    return {
      key: `${first.getFullYear()}-${pad(first.getMonth() + 1)}`,
      date: first,
      days,
      closingBalance: days.filter((day) => day.balance !== null).at(-1)?.balance ?? null,
    };
  });
}
