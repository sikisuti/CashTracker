import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FORMATS } from '../locale';
import { DailyBalance } from './daily-balance.model';
import { DailyBalanceService } from './daily-balance.service';
import { MonthEntry } from './month.model';
import { buildMonthWindow, monthWindowBounds, toDateKey } from './month.util';

/** How far the month list reaches on either side of the current month. */
const MONTHS_BACK = 12;
const MONTHS_FORWARD = 12;

@Component({
  selector: 'app-home',
  imports: [CurrencyPipe, DatePipe],
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

  protected readonly months = computed(() =>
    buildMonthWindow(this.today, MONTHS_BACK, MONTHS_FORWARD, this.balances()),
  );

  /** Keys of the months currently expanded; the current month starts open. */
  private readonly expandedKeys = signal<ReadonlySet<string>>(new Set([this.todayKey.slice(0, 7)]));

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
}
