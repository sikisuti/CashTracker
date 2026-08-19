import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LOCALE_PROVIDERS } from '../locale';
import { DailyBalance } from './daily-balance.model';
import { HomeComponent } from './home.component';
import { toDateKey } from './month.util';

/** Non-breaking space -- what the `hu` locale uses to group thousands. */
const NBSP = ' ';

describe('HomeComponent', () => {
  let httpMock: HttpTestingController;

  const today = new Date();
  const monthKey = toDateKey(today).slice(0, 7);
  const daysThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const balanceOn = (day: number, overrides: Partial<DailyBalance> = {}): DailyBalance => ({
    date: toDateKey(new Date(today.getFullYear(), today.getMonth(), day)),
    balance: 1000 * day,
    balanceSetManually: false,
    predicted: false,
    reviewed: false,
    ...overrides,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), LOCALE_PROVIDERS],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  /** Creates the component, answers its one request, and returns the rendered fixture. */
  function render(balances: DailyBalance[]) {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    httpMock.expectOne((request) => request.url === '/api/daily-balances').flush(balances);
    fixture.detectChanges();

    return fixture;
  }

  const textOf = (fixture: { nativeElement: Element }, selector: string): string =>
    fixture.nativeElement.querySelector(selector)!.textContent!.trim();

  it('should request exactly the twelve months either side of the current month', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    const request = httpMock.expectOne((r) => r.url === '/api/daily-balances');
    const expectedFrom = new Date(today.getFullYear(), today.getMonth() - 12, 1);
    const expectedTo = new Date(today.getFullYear(), today.getMonth() + 13, 0);

    expect(request.request.params.get('from')).toBe(toDateKey(expectedFrom));
    expect(request.request.params.get('to')).toBe(toDateKey(expectedTo));

    request.flush([]);
  });

  it('should list twenty-five months with the current one in the middle', () => {
    const fixture = render([]);

    const months = fixture.nativeElement.querySelectorAll('.month');
    expect(months.length).toBe(25);
    expect(months[12].classList.contains('current')).toBe(true);
  });

  it('should render the months as an unnumbered list', () => {
    const fixture = render([]);

    expect(fixture.nativeElement.querySelector('.month-list').tagName).toBe('UL');
  });

  it('should expand the current month by default', () => {
    const fixture = render([]);

    const expanded = fixture.nativeElement.querySelectorAll('.month-header[aria-expanded="true"]');
    expect(expanded.length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('.day-list .day').length).toBe(daysThisMonth);
  });

  it('should label the covered range as "yyyy MMM dd" in Hungarian', () => {
    const fixture = render([]);

    const months = [
      'jan.',
      'febr.',
      'márc.',
      'ápr.',
      'máj.',
      'jún.',
      'júl.',
      'aug.',
      'szept.',
      'okt.',
      'nov.',
      'dec.',
    ];
    const format = (date: Date) =>
      `${date.getFullYear()} ${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}`;
    const from = new Date(today.getFullYear(), today.getMonth() - 12, 1);
    const to = new Date(today.getFullYear(), today.getMonth() + 13, 0);

    expect(textOf(fixture, '.page-header p')).toBe(`${format(from)} – ${format(to)}`);
  });

  it('should head each month with the Hungarian month name', () => {
    const fixture = render([]);

    expect(textOf(fixture, '.month.current .month-name')).toMatch(
      /^\d{4} (január|február|március|április|május|június|július|augusztus|szeptember|október|november|december)$/,
    );
  });

  it('should group thousands with a space and put Ft after the amount', () => {
    const fixture = render([balanceOn(1, { balance: 4818549 })]);

    expect(textOf(fixture, '.day-list .day .balance')).toBe(`4${NBSP}818${NBSP}549${NBSP}Ft`);
  });

  it('should mark days the database has no row for', () => {
    const fixture = render([balanceOn(1)]);

    const days = fixture.nativeElement.querySelectorAll('.day-list .day');
    expect(days[1].classList.contains('empty')).toBe(true);
    expect(days[1].querySelector('.balance').textContent).toContain('—');
  });

  it('should flag predicted, manually set and reviewed days in Hungarian', () => {
    const fixture = render([
      balanceOn(1, { predicted: true, balanceSetManually: true, reviewed: true }),
    ]);

    const flags = fixture.nativeElement.querySelectorAll('.day-list .day .flag');
    expect([...flags].map((flag: Element) => flag.textContent!.trim())).toEqual([
      'becsült',
      'kézi',
      'ellenőrzött',
    ]);
  });

  it('should summarise each month with its closing balance and no day count', () => {
    const fixture = render([balanceOn(1), balanceOn(2, { balance: 777000 })]);

    const header = fixture.nativeElement.querySelector('.month.current .month-header');
    expect(header.querySelector('.balance').textContent.trim()).toBe(`777${NBSP}000${NBSP}Ft`);
    expect(header.textContent).not.toMatch(/\d+\s*\/\s*\d+/);
    expect(header.querySelector('.no-data')).toBeNull();
  });

  it('should say so in Hungarian when a month holds no data', () => {
    const fixture = render([]);

    expect(textOf(fixture, '.month .month-header .no-data')).toBe('nincs adat');
  });

  it('should collapse and re-expand a month on click', () => {
    const fixture = render([]);

    const header: HTMLButtonElement = fixture.nativeElement.querySelector(
      `.month-header[aria-controls="days-${monthKey}"]`,
    );

    header.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.day-list').length).toBe(0);

    header.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.day-list').length).toBe(1);
  });

  it('should allow several months to be open at once', () => {
    const fixture = render([]);

    const collapsed: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.month-header[aria-expanded="false"]',
    );
    collapsed.click();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll('.month-header[aria-expanded="true"]').length,
    ).toBe(2);
  });

  it('should offer a Hungarian retry when the request fails', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    httpMock
      .expectOne((r) => r.url === '/api/daily-balances')
      .flush('boom', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(textOf(fixture, '.status.error')).toContain('nem sikerült');
    expect(textOf(fixture, '.retry')).toBe('Újrapróbálkozás');

    fixture.nativeElement.querySelector('.retry').click();
    fixture.detectChanges();

    httpMock.expectOne((r) => r.url === '/api/daily-balances').flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.status.error')).toBeNull();
  });
});
