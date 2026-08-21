import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { FORMATS } from '../locale';
import { DayDetails } from './daily-balance.model';
import { DailyBalanceService } from './daily-balance.service';
import { DayEntry } from './month.model';

/**
 * A day's stored rows, shown beside the month list rather than over it. The same instance serves
 * every selection, so the load is driven by an effect rather than by `ngOnInit`. It deliberately
 * reacts to the day's key and not to the entry object: that object is rebuilt whenever any
 * balance changes, and a review tick elsewhere in the list must not re-request the open day.
 */
@Component({
  selector: 'app-day-details-panel',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './day-details-panel.component.html',
  styleUrl: './day-details-panel.component.css',
})
export class DayDetailsPanelComponent {
  readonly day = input.required<DayEntry>();
  readonly closed = output<void>();

  protected readonly formats = FORMATS;

  private readonly dailyBalanceService = inject(DailyBalanceService);

  protected readonly details = signal<DayDetails | null>(null);
  protected readonly loading = signal(false);
  protected readonly loadFailed = signal(false);

  private readonly key = computed(() => this.day().key);
  private readonly hasBalance = computed(() => !!this.day().balance);
  /** Bumped by the retry button, so the effect runs again for an unchanged day. */
  private readonly retries = signal(0);

  private pending: Subscription | null = null;

  constructor() {
    effect(() => {
      this.retries();
      this.load(this.key(), this.hasBalance());
    });

    inject(DestroyRef).onDestroy(() => this.pending?.unsubscribe());
  }

  protected retry(): void {
    this.retries.update((count) => count + 1);
  }

  protected close(): void {
    this.closed.emit();
  }

  private load(key: string, hasBalance: boolean): void {
    // A quick run of clicks down the list would otherwise let an earlier day's answer land last.
    this.pending?.unsubscribe();
    this.details.set(null);
    this.loadFailed.set(false);

    if (!hasBalance) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.pending = this.dailyBalanceService.getDetails(key).subscribe({
      next: (details) => {
        this.details.set(details);
        this.loading.set(false);
      },
      error: () => {
        this.loadFailed.set(true);
        this.loading.set(false);
      },
    });
  }
}
