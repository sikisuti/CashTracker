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

/** One bank transaction of a day, as nested in `GET /api/daily-balances/{date}`. */
export interface DayTransaction {
  id: number;
  date: string;
  type: string;
  /** ISO local date-time, or null when the bank gave no timestamp. */
  transactionDateTime: string | null;
  amount: number;
  accountNumber: string;
  owner: string;
  comment: string;
  /** Category name, or null while the transaction is uncategorised. */
  category: string | null;
}

/** One manual balance adjustment of a day. */
export interface DayCorrection {
  id: number;
  category: string;
  comment: string;
  amount: number;
  /** True when the correction only re-categorises money rather than adding any. */
  onlyMove: boolean;
  /** The transaction this correction re-categorises, or null when it stands alone. */
  pairedTransactionId: number | null;
}

/** Everything stored about one day, as returned by `GET /api/daily-balances/{date}`. */
export interface DayDetails {
  balance: DailyBalance;
  transactions: DayTransaction[];
  corrections: DayCorrection[];
}
