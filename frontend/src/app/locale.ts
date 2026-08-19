import { registerLocaleData } from '@angular/common';
import localeHu from '@angular/common/locales/hu';
import { LOCALE_ID, Provider } from '@angular/core';

registerLocaleData(localeHu);

/**
 * The app is Hungarian-only, so dates, numbers and currency all format under `hu`. That locale
 * already supplies what we want: a non-breaking space as the thousands separator and "Ft" after
 * the amount -- neither is hand-rolled here.
 */
export const LOCALE_PROVIDERS: Provider[] = [{ provide: LOCALE_ID, useValue: 'hu' }];

/** Display formats shared by every template, so they cannot drift apart. */
export const FORMATS = {
  /** Full date, e.g. "2026 aug. 19". */
  date: 'yyyy MMM dd',
  /** Month heading, e.g. "2026 augusztus". */
  month: 'yyyy MMMM',
  currency: 'HUF',
  /** Amounts are whole forints -- never show a fraction. */
  currencyDigits: '1.0-0',
} as const;
