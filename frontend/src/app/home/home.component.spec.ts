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

  it('should lay a day row out as date, balance, reviewed checkbox and details button', () => {
    const fixture = render([balanceOn(1)]);

    const columns = fixture.nativeElement.querySelector('.day-list .day').children;
    expect([...columns].map((column: Element) => column.className)).toEqual([
      'date',
      'balance',
      'review',
      'details',
    ]);
  });

  it('should date a day row in full, without the weekday', () => {
    const fixture = render([balanceOn(1)]);

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
    expect(textOf(fixture, '.day-list .day .date')).toBe(
      `${today.getFullYear()} ${months[today.getMonth()]} 01`,
    );
  });

  it('should show the reviewed flag as a checkbox rather than a label', () => {
    const fixture = render([balanceOn(1, { reviewed: true }), balanceOn(2, { reviewed: false })]);

    const days = fixture.nativeElement.querySelectorAll('.day-list .day');
    expect(days[0].querySelector('.review').checked).toBe(true);
    expect(days[1].querySelector('.review').checked).toBe(false);
    expect(fixture.nativeElement.querySelector('.day-list .day .flag')).toBeNull();
  });

  it('should shade weekends and reviewed days', () => {
    // Any Saturday past the 1st, so it cannot collide with the reviewed day below.
    const saturday = [...Array(daysThisMonth).keys()]
      .map((index) => index + 1)
      .find(
        (day) => day > 1 && new Date(today.getFullYear(), today.getMonth(), day).getDay() === 6,
      )!;
    const fixture = render([balanceOn(1, { reviewed: true }), balanceOn(saturday)]);

    const days = fixture.nativeElement.querySelectorAll('.day-list .day');
    expect(days[0].classList.contains('reviewed')).toBe(true);
    expect(days[saturday - 1].classList.contains('weekend')).toBe(true);
    expect(days[saturday - 1].classList.contains('reviewed')).toBe(false);
  });

  it('should only show the checkbox on days with a settled balance', () => {
    const fixture = render([balanceOn(1), balanceOn(2, { predicted: true })]);

    const days = fixture.nativeElement.querySelectorAll('.day-list .day');
    const hidden = (index: number) =>
      days[index].querySelector('.review').classList.contains('hidden');

    expect(hidden(0)).toBe(false); // stored and settled
    expect(hidden(1)).toBe(true); // predicted
    expect(hidden(2)).toBe(true); // no row at all
  });

  it('should keep the columns aligned on a day whose checkbox is hidden', () => {
    const fixture = render([balanceOn(1), balanceOn(2, { predicted: true })]);

    const days = fixture.nativeElement.querySelectorAll('.day-list .day');
    expect([...days[1].children].map((column: Element) => column.tagName)).toEqual(
      [...days[0].children].map((column: Element) => column.tagName),
    );
  });

  it('should not offer to review a day the database has no row for', () => {
    const fixture = render([balanceOn(1)]);

    const days = fixture.nativeElement.querySelectorAll('.day-list .day');
    expect(days[0].querySelector('.review').disabled).toBe(false);
    expect(days[1].querySelector('.review').disabled).toBe(true);
  });

  it('should patch the day when its checkbox is ticked', () => {
    const fixture = render([balanceOn(1)]);

    const checkbox: HTMLInputElement =
      fixture.nativeElement.querySelector('.day-list .day .review');
    checkbox.click();
    fixture.detectChanges();

    const request = httpMock.expectOne(`/api/daily-balances/${balanceOn(1).date}`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ reviewed: true });

    request.flush(balanceOn(1, { reviewed: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.day-list .day .review').checked).toBe(true);
  });

  it('should untick the checkbox again and say so when the patch fails', () => {
    const fixture = render([balanceOn(1)]);

    fixture.nativeElement.querySelector('.day-list .day .review').click();
    fixture.detectChanges();

    httpMock
      .expectOne(`/api/daily-balances/${balanceOn(1).date}`)
      .flush('boom', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.day-list .day .review').checked).toBe(false);
    expect(textOf(fixture, '.review-error')).toContain('nem sikerült');
  });

  it('should open a modal with the day details when the details button is pressed', () => {
    const fixture = render([balanceOn(1)]);

    fixture.nativeElement.querySelector('.day-list .day .details').click();
    fixture.detectChanges();

    httpMock.expectOne(`/api/daily-balances/${balanceOn(1).date}`).flush({
      balance: balanceOn(1),
      transactions: [],
      corrections: [],
    });
    fixture.detectChanges();

    const dialog: HTMLDialogElement = fixture.nativeElement.querySelector('dialog.day-dialog');
    expect(dialog.open).toBe(true);
  });

  it('should close the modal and drop it from the page', () => {
    const fixture = render([balanceOn(1)]);

    fixture.nativeElement.querySelector('.day-list .day .details').click();
    fixture.detectChanges();
    httpMock.expectOne(`/api/daily-balances/${balanceOn(1).date}`).flush({
      balance: balanceOn(1),
      transactions: [],
      corrections: [],
    });
    fixture.detectChanges();

    fixture.nativeElement.querySelector('dialog.day-dialog .close').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('dialog.day-dialog')).toBeNull();
  });

  it('should not ask for details of a day the database has no row for', () => {
    const fixture = render([balanceOn(1)]);

    fixture.nativeElement.querySelectorAll('.day-list .day .details')[1].click();
    fixture.detectChanges();

    expect(textOf(fixture, 'dialog.day-dialog .status')).toBe('Ehhez a naphoz nincs tárolt adat.');
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
