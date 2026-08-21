import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  afterNextRender,
  afterRenderEffect,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FORMATS } from '../locale';
import { Connector, buildConnector } from './connector.util';
import { DailyBalance } from './daily-balance.model';
import { DailyBalanceService } from './daily-balance.service';
import { DayDetailsPanelComponent } from './day-details-panel.component';
import { DayEntry, MonthEntry } from './month.model';
import { buildMonthWindow, monthWindowBounds, toDateKey } from './month.util';

/** How far the month list reaches on either side of the current month. */
const MONTHS_BACK = 12;
const MONTHS_FORWARD = 12;

@Component({
  selector: 'app-home',
  imports: [CurrencyPipe, DatePipe, DayDetailsPanelComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  protected readonly formats = FORMATS;

  private readonly dailyBalanceService = inject(DailyBalanceService);
  private readonly destroyRef = inject(DestroyRef);

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

  /**
   * The day shown in the detail panel, held as a key rather than as an entry: the entries are
   * rebuilt whenever a balance changes, and the panel has to follow that day's new data.
   */
  protected readonly selectedKey = signal<string | null>(null);

  protected readonly selectedDay = computed<DayEntry | null>(() => {
    const key = this.selectedKey();
    if (!key) {
      return null;
    }

    const month = this.months().find((entry) => entry.key === key.slice(0, 7));
    return month?.days.find((day) => day.key === key) ?? null;
  });

  private readonly layout = viewChild<ElementRef<HTMLElement>>('layout');
  private readonly detail = viewChild<ElementRef<HTMLElement>>('detail');

  /** The line drawn from the selected row to the panel, or null when there is none to draw. */
  protected readonly connector = signal<Connector | null>(null);

  private frame: number | null = null;

  constructor() {
    afterRenderEffect(() => {
      // Everything that can move either end of the line: the selection, the rows themselves and
      // which months are open.
      this.selectedKey();
      this.months();
      this.expandedKeys();
      this.measureConnector();
    });

    afterNextRender(() => this.watchViewport());
  }

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

  protected select(day: DayEntry): void {
    this.selectedKey.set(day.key);
  }

  private store(balance: DailyBalance): void {
    this.balances.update((balances) => new Map(balances).set(balance.date, balance));
  }

  /**
   * The panel is pinned while the list scrolls under it, so the line has to be re-measured on
   * every scroll, resize and change of the panel's own height.
   */
  private watchViewport(): void {
    const schedule = () => this.scheduleMeasure();

    // Capture phase: the list scrolls inside the shell's <main>, and scroll events from an inner
    // element never reach the window by bubbling.
    window.addEventListener('scroll', schedule, { capture: true, passive: true });
    window.addEventListener('resize', schedule, { passive: true });

    // ResizeObserver is missing under jsdom, where there is no geometry to react to anyway.
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
    const layout = this.layout()?.nativeElement;
    const detail = this.detail()?.nativeElement;
    if (layout) {
      observer?.observe(layout);
    }
    if (detail) {
      observer?.observe(detail);
    }

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', schedule, { capture: true });
      window.removeEventListener('resize', schedule);
      observer?.disconnect();
      if (this.frame !== null) {
        cancelAnimationFrame(this.frame);
      }
    });
  }

  private scheduleMeasure(): void {
    if (this.frame !== null) {
      return;
    }

    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      this.measureConnector();
    });
  }

  private measureConnector(): void {
    const layout = this.layout()?.nativeElement;
    const key = this.selectedKey();
    const row = key ? layout?.querySelector(`[data-day="${key}"]`) : null;
    const panel = layout?.querySelector('.day-panel');

    if (!layout || !row || !panel) {
      this.connector.set(null);
      return;
    }

    this.connector.set(
      buildConnector(
        row.getBoundingClientRect(),
        panel.getBoundingClientRect(),
        layout.getBoundingClientRect(),
        window.innerHeight,
      ),
    );
  }
}
