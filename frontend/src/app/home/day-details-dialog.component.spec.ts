import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LOCALE_PROVIDERS } from '../locale';
import { DayDetails } from './daily-balance.model';
import { DayDetailsDialogComponent } from './day-details-dialog.component';
import { DayEntry } from './month.model';

/** Non-breaking space -- what the `hu` locale uses to group thousands. */
const NBSP = ' ';

describe('DayDetailsDialogComponent', () => {
  let httpMock: HttpTestingController;

  const key = '2026-08-19';
  const url = `/api/daily-balances/${key}`;

  const day = (hasBalance = true): DayEntry => ({
    key,
    date: new Date(2026, 7, 19),
    weekend: false,
    balance: hasBalance
      ? { date: key, balance: 4818549, balanceSetManually: false, predicted: false, reviewed: true }
      : null,
  });

  const details = (overrides: Partial<DayDetails> = {}): DayDetails => ({
    balance: day().balance!,
    transactions: [],
    corrections: [],
    ...overrides,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DayDetailsDialogComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), LOCALE_PROVIDERS],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  /** Creates the dialog for a day with a stored balance and answers its one request. */
  function render(response: DayDetails): ComponentFixture<DayDetailsDialogComponent> {
    const fixture = TestBed.createComponent(DayDetailsDialogComponent);
    fixture.componentRef.setInput('day', day());
    fixture.detectChanges();

    httpMock.expectOne(url).flush(response);
    fixture.detectChanges();

    return fixture;
  }

  const textOf = (fixture: ComponentFixture<DayDetailsDialogComponent>, selector: string): string =>
    fixture.nativeElement.querySelector(selector)!.textContent!.trim();

  it('should open as a modal headed with the Hungarian date and weekday', () => {
    const fixture = render(details());

    const dialog: HTMLDialogElement = fixture.nativeElement.querySelector('dialog');
    expect(dialog.open).toBe(true);
    expect(textOf(fixture, '.dialog-header h2')).toBe('2026 aug. 19');
    expect(textOf(fixture, '.dialog-header .weekday')).toBe('szerda');
  });

  it('should summarise the balance with its Hungarian flags', () => {
    const fixture = render(
      details({
        balance: {
          date: key,
          balance: 4818549,
          balanceSetManually: true,
          predicted: true,
          reviewed: true,
        },
      }),
    );

    expect(textOf(fixture, '.summary .balance')).toBe(`4${NBSP}818${NBSP}549${NBSP}Ft`);
    const flags = fixture.nativeElement.querySelectorAll('.summary .flag');
    expect([...flags].map((flag: Element) => flag.textContent!.trim())).toEqual([
      'becsült',
      'kézi',
      'ellenőrzött',
    ]);
  });

  it('should list the transactions of the day', () => {
    const fixture = render(
      details({
        transactions: [
          {
            id: 7,
            date: key,
            type: 'kártyás vásárlás',
            transactionDateTime: '2026-08-19T10:30:00',
            amount: -3200,
            accountNumber: '1234',
            owner: 'Bolt',
            comment: 'kenyér',
            category: 'Élelmiszer',
          },
        ],
      }),
    );

    const cells = fixture.nativeElement.querySelectorAll('.transactions tbody td');
    expect(cells[0].textContent.trim()).toBe('10:30');
    expect(cells[1].textContent).toContain('Bolt');
    expect(cells[1].textContent).toContain('kenyér');
    expect(cells[2].textContent.trim()).toBe('Élelmiszer');
    expect(cells[3].textContent.trim()).toBe(`-3${NBSP}200${NBSP}Ft`);
  });

  it('should mark an uncategorised transaction and one without a timestamp', () => {
    const fixture = render(
      details({
        transactions: [
          {
            id: 7,
            date: key,
            type: 'átutalás',
            transactionDateTime: null,
            amount: 1000,
            accountNumber: '',
            owner: '',
            comment: '',
            category: null,
          },
        ],
      }),
    );

    expect(textOf(fixture, '.transactions tbody .time')).toBe('—');
    expect(textOf(fixture, '.transactions tbody .what')).toBe('átutalás');
    expect(textOf(fixture, '.transactions tbody .uncategorised')).toBe('nincs kategória');
  });

  it('should list the corrections of the day', () => {
    const fixture = render(
      details({
        corrections: [
          {
            id: 3,
            category: 'Élelmiszer',
            comment: 'készpénz',
            amount: -500,
            onlyMove: true,
            pairedTransactionId: 7,
          },
        ],
      }),
    );

    const cells = fixture.nativeElement.querySelectorAll('.corrections tbody td');
    expect(cells[0].textContent.trim()).toBe('Élelmiszer');
    expect(cells[1].textContent).toContain('készpénz');
    expect(cells[2].textContent.trim()).toBe(`-500${NBSP}Ft`);
    const flags = fixture.nativeElement.querySelectorAll('.corrections .flag');
    expect([...flags].map((flag: Element) => flag.textContent!.trim())).toEqual([
      'csak átsorolás',
      'párosított',
    ]);
  });

  it('should say in Hungarian when the day holds no transactions or corrections', () => {
    const fixture = render(details());

    const empty = fixture.nativeElement.querySelectorAll('.rows .status');
    expect([...empty].map((status: Element) => status.textContent!.trim())).toEqual([
      'Nincs tranzakció ezen a napon.',
      'Nincs korrekció ezen a napon.',
    ]);
  });

  it('should not request anything for a day the database has no row for', () => {
    const fixture = TestBed.createComponent(DayDetailsDialogComponent);
    fixture.componentRef.setInput('day', day(false));
    fixture.detectChanges();

    httpMock.expectNone(url);
    expect(textOf(fixture, '.status')).toBe('Ehhez a naphoz nincs tárolt adat.');
  });

  it('should offer a Hungarian retry when the request fails', () => {
    const fixture = TestBed.createComponent(DayDetailsDialogComponent);
    fixture.componentRef.setInput('day', day());
    fixture.detectChanges();

    httpMock.expectOne(url).flush('boom', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(textOf(fixture, '.status.error')).toContain('nem sikerült');

    fixture.nativeElement.querySelector('.retry').click();
    fixture.detectChanges();

    httpMock.expectOne(url).flush(details());
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.status.error')).toBeNull();
  });

  it('should report a close back to its host', () => {
    const fixture = render(details());
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);

    fixture.nativeElement.querySelector('.close').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('dialog').open).toBe(false);
    expect(closed).toHaveBeenCalled();
  });
});
