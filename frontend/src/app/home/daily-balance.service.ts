import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DailyBalance, DayDetails } from './daily-balance.model';

@Injectable({ providedIn: 'root' })
export class DailyBalanceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/daily-balances';

  /** Stored balances between `from` and `to` (both inclusive, both ISO `YYYY-MM-DD`). */
  getInRange(from: string, to: string): Observable<DailyBalance[]> {
    return this.http.get<DailyBalance[]>(this.baseUrl, {
      params: new HttpParams().set('from', from).set('to', to),
    });
  }

  /** One day's balance with its transactions and corrections. 404s for a day with no stored row. */
  getDetails(date: string): Observable<DayDetails> {
    return this.http.get<DayDetails>(`${this.baseUrl}/${date}`);
  }

  /** Marks a day reviewed or unreviewed, returning the day as it was stored. */
  setReviewed(date: string, reviewed: boolean): Observable<DailyBalance> {
    return this.http.patch<DailyBalance>(`${this.baseUrl}/${date}`, { reviewed });
  }
}
