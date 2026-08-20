import { DailyBalance } from './daily-balance.model';

/** A single calendar day inside a month, rendered as a sub-list item. */
export interface DayEntry {
  /** ISO `YYYY-MM-DD`; the identity used for tracking and for balance lookup. */
  key: string;
  date: Date;
  /** Saturday or Sunday -- shaded differently in the day list. */
  weekend: boolean;
  /** The stored balance for this day, or null when the database holds no row for it. */
  balance: DailyBalance | null;
}

/** A calendar month, rendered as a top-level ordered-list item. */
export interface MonthEntry {
  /** Stable `YYYY-MM` key. */
  key: string;
  /** First day of the month, used for display formatting. */
  date: Date;
  days: DayEntry[];
  /** Balance of the last day in the month that has one, or null when the month has no data. */
  closingBalance: DailyBalance | null;
}
