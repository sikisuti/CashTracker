import { DatePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { MonthEntry } from './month.model';
import { buildMonthsOfYear } from './month.util';

@Component({
  selector: 'app-home',
  imports: [DatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private readonly today = new Date();

  protected readonly year = this.today.getFullYear();
  protected readonly months: MonthEntry[] = buildMonthsOfYear(this.year);

  /** Keys of the months currently expanded; the current month starts open. */
  private readonly expandedKeys = signal<ReadonlySet<string>>(
    new Set([this.months[this.today.getMonth()].key]),
  );

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

  protected isToday(key: string): boolean {
    return key === this.todayKey;
  }

  private readonly todayKey = [
    this.today.getFullYear(),
    String(this.today.getMonth() + 1).padStart(2, '0'),
    String(this.today.getDate()).padStart(2, '0'),
  ].join('-');
}
