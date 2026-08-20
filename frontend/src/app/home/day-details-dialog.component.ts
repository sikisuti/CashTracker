import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FORMATS } from '../locale';
import { DayDetails } from './daily-balance.model';
import { DailyBalanceService } from './daily-balance.service';
import { DayEntry } from './month.model';

/**
 * A day's stored rows, shown in a native modal `<dialog>`. The day is passed in already joined to
 * its balance, so a day the database holds no row for renders its empty state without a request.
 */
@Component({
  selector: 'app-day-details-dialog',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './day-details-dialog.component.html',
  styleUrl: './day-details-dialog.component.css',
})
export class DayDetailsDialogComponent implements OnInit, AfterViewInit {
  readonly day = input.required<DayEntry>();
  readonly closed = output<void>();

  protected readonly formats = FORMATS;

  private readonly dailyBalanceService = inject(DailyBalanceService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly details = signal<DayDetails | null>(null);
  protected readonly loading = signal(false);
  protected readonly loadFailed = signal(false);

  ngOnInit(): void {
    if (this.day().balance) {
      this.load();
    }
  }

  ngAfterViewInit(): void {
    this.dialog().nativeElement.showModal();
  }

  protected load(): void {
    this.loading.set(true);
    this.loadFailed.set(false);

    this.dailyBalanceService.getDetails(this.day().key).subscribe({
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

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  /** A click that lands on the dialog element itself came from the backdrop, not the content. */
  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.close();
    }
  }
}
