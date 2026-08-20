import { DailyBalance } from './daily-balance.model';
import { buildMonthWindow, monthWindowBounds, toDateKey } from './month.util';

const balance = (date: string, amount: number, predicted = false): DailyBalance => ({
  date,
  balance: amount,
  balanceSetManually: false,
  predicted,
  reviewed: false,
});

describe('month.util', () => {
  const anchor = new Date(2026, 7, 19); // 19 Aug 2026

  it('should span whole months from the first day back to the last day forward', () => {
    const bounds = monthWindowBounds(anchor, 12, 12);

    expect(toDateKey(bounds.from)).toBe('2025-08-01');
    expect(toDateKey(bounds.to)).toBe('2027-08-31');
  });

  it('should build one entry per month in the window, oldest first', () => {
    const months = buildMonthWindow(anchor, 12, 12, new Map());

    expect(months.length).toBe(25);
    expect(months[0].key).toBe('2025-08');
    expect(months[12].key).toBe('2026-08');
    expect(months[24].key).toBe('2027-08');
  });

  it('should use local dates for keys rather than shifting to UTC', () => {
    const months = buildMonthWindow(anchor, 0, 0, new Map());

    expect(months[0].days[0].key).toBe('2026-08-01');
    expect(months[0].days.at(-1)!.key).toBe('2026-08-31');
  });

  it('should give February the right length in a leap year', () => {
    const months = buildMonthWindow(new Date(2028, 1, 15), 0, 0, new Map());

    expect(months[0].days.length).toBe(29);
  });

  it('should flag Saturdays and Sundays as weekend days', () => {
    const days = buildMonthWindow(anchor, 0, 0, new Map())[0].days;

    // 1 Aug 2026 is a Saturday, so the weekend days are 1, 2, 8, 9, ...
    expect(days.filter((day) => day.weekend).map((day) => day.date.getDate())).toEqual([
      1, 2, 8, 9, 15, 16, 22, 23, 29, 30,
    ]);
  });

  it('should join each day to its stored balance and leave the rest null', () => {
    const months = buildMonthWindow(
      anchor,
      0,
      0,
      new Map([['2026-08-02', balance('2026-08-02', 500)]]),
    );

    expect(months[0].days[0].balance).toBeNull();
    expect(months[0].days[1].balance!.balance).toBe(500);
  });

  it('should summarise a month by its last day with data', () => {
    const months = buildMonthWindow(
      anchor,
      0,
      0,
      new Map([
        ['2026-08-02', balance('2026-08-02', 500)],
        ['2026-08-09', balance('2026-08-09', 900, true)],
      ]),
    );

    expect(months[0].closingBalance!.balance).toBe(900);
    expect(months[0].closingBalance!.predicted).toBe(true);
  });

  it('should report no closing balance for a month with no data', () => {
    const months = buildMonthWindow(anchor, 0, 0, new Map());

    expect(months[0].closingBalance).toBeNull();
  });
});
