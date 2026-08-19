import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LOCALE_PROVIDERS } from '../locale';
import { TransactionListComponent } from './transaction-list.component';

/** Non-breaking space -- what the `hu` locale uses to group thousands. */
const NBSP = ' ';

describe('TransactionListComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), LOCALE_PROVIDERS],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function render(transactions: unknown[]) {
    const fixture = TestBed.createComponent(TransactionListComponent);
    fixture.detectChanges();

    httpMock.expectOne('/api/transactions').flush(transactions);
    fixture.detectChanges();

    return fixture;
  }

  it('should label the table in Hungarian', () => {
    const fixture = render([]);

    expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe('Tranzakciók');
    expect(
      [...fixture.nativeElement.querySelectorAll('th')].map((th: Element) =>
        th.textContent!.trim(),
      ),
    ).toEqual(['Dátum', 'Leírás', 'Összeg']);
  });

  it('should render dates as "yyyy MMM dd" in Hungarian', () => {
    const fixture = render([{ id: 1, description: 'teszt', amount: 1234567, date: '2026-08-19' }]);

    const cells = fixture.nativeElement.querySelectorAll('tbody td');
    expect(cells[0].textContent.trim()).toBe('2026 aug. 19');
  });

  it('should render amounts with space-grouped thousands and Ft', () => {
    const fixture = render([{ id: 1, description: 'teszt', amount: 1234567, date: '2026-08-19' }]);

    const cells = fixture.nativeElement.querySelectorAll('tbody td');
    expect(cells[2].textContent.trim()).toBe(`1${NBSP}234${NBSP}567${NBSP}Ft`);
  });

  it('should say so in Hungarian when there is nothing to show', () => {
    const fixture = render([]);

    expect(fixture.nativeElement.querySelector('tbody td').textContent.trim()).toBe(
      'Nincs megjeleníthető tranzakció.',
    );
  });
});
