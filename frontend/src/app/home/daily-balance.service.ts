import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DailyBalance } from './daily-balance.model';

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
}
