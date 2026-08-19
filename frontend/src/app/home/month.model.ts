/** A single calendar day inside a month, rendered as a sub-list item. */
export interface DayEntry {
  /** Stable `YYYY-MM-DD` key, also used as the router/tracking identity. */
  key: string;
  date: Date;
}

/** A calendar month, rendered as a top-level ordered-list item. */
export interface MonthEntry {
  /** Stable `YYYY-MM` key. */
  key: string;
  /** First day of the month, used for display formatting. */
  date: Date;
  days: DayEntry[];
}
