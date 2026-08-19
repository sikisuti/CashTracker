/** One stored end-of-day balance, as returned by `GET /api/daily-balances`. */
export interface DailyBalance {
  /** ISO `YYYY-MM-DD`. */
  date: string;
  /** End-of-day balance in whole HUF. */
  balance: number;
  balanceSetManually: boolean;
  predicted: boolean;
  reviewed: boolean;
}
