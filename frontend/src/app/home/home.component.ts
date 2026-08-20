import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FORMATS } from '../locale';
import { DailyBalance } from './daily-balance.model';
import { DailyBalanceService } from './daily-balance.service';
import { DayDetailsDialogComponent } from './day-details-dialog.component';
import { DayEntry, MonthEntry } from './month.model';
import { buildMonthWindow, monthWindowBounds, toDateKey } from './month.util';

/** How far the month list reaches on either side of the current month. */
const MONTHS_BACK = 12;
const MONTHS_FORWARD = 12;

@Component({
  selector: 'app-home',
  imports: [CurrencyPipe, DatePipe, DayDetailsDialogComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  protected readonly formats = FORMATS;

  private readonly dailyBalanceService = inject(DailyBalanceService);

  private readonly today = new Date();
  private readonly todayKey = toDateKey(this.today);
  private readonly bounds = monthWindowBounds(this.today, MONTHS_BACK, MONTHS_FORWARD);

  protected readonly rangeStart = this.bounds.from;
  protected readonly rangeEnd = this.bounds.to;

  private readonly balances = signal<ReadonlyMap<string, DailyBalance>>(new Map());
  protected readonly loading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly reviewFailed = signal(false);

  protected readonly months = computed(() =>
    buildMonthWindow(this.today, MONTHS_BACK, MONTHS_FORWARD, this.balances()),
  );

  /** Keys of the months currently expanded; the current month starts open. */
  private readonly expandedKeys = signal<ReadonlySet<string>>(new Set([this.todayKey.slice(0, 7)]));

  /** The day whose detail dialog is open, or null while none is. */
  protected readonly selectedDay = signal<DayEntry | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.loadFailed.set(false);

    this.dailyBalanceService
      .getInRange(toDateKey(this.rangeStart), toDateKey(this.rangeEnd))
      .subscribe({
        next: (balances) => {
          this.balances.set(new Map(balances.map((balance) => [balance.date, balance])));
          this.loading.set(false);
        },
        error: () => {
          this.loadFailed.set(true);
          this.loading.set(false);
        },
      });
  }

  protected isExpanded(month: MonthEntry): boolean {
    return this.expandedKeys().has(month.key);
  }

  protected toggle(month: MonthEntry): void {
    this.expandedKeys.update((keys) => {
      const next = new Set(keys);
      if (!next.delete(month.key)) {
        next.add(month.key);
      }
      return next;
    });
  }

  protected isCurrentMonth(month: MonthEntry): boolean {
    return month.key === this.todayKey.slice(0, 7);
  }

  protected isToday(key: string): boolean {
    return key === this.todayKey;
  }

  /**
   * Only a settled balance can be confirmed: a predicted day is model output with nothing to
   * review yet, and a day the database holds no row for has nothing at all.
   */
  protected isReviewable(day: DayEntry): boolean {
    return !!day.balance && !day.balance.predicted;
  }

  /**
   * Applies the new reviewed flag straight away so the checkbox never lags behind the pointer,
   * then rolls the row back to what it was if the write does not land.
   */
  protected setReviewed(day: DayEntry, event: Event): void {
    const previous = day.balance;
    if (!previous) {
      return;
    }

    const reviewed = (event.target as HTMLInputElement).checked;
    this.reviewFailed.set(false);
    this.store({ ...previous, reviewed });

    this.dailyBalanceService.setReviewed(day.key, reviewed).subscribe({
      next: (stored) => this.store(stored),
      error: () => {
        this.store(previous);
        this.reviewFailed.set(true);
      },
    });
  }

  protected openDetails(day: DayEntry): void {
    this.selectedDay.set(day);
  }

  private store(balance: DailyBalance): void {
    this.balances.update((balances) => new Map(balances).set(balance.date, balance));
  }
}
