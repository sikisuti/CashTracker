import { TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
    }).compileComponents();
  });

  it('should list the twelve months of the current year', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    const months = fixture.nativeElement.querySelectorAll('.month');
    expect(months.length).toBe(12);
  });

  it('should expand the current month by default', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    const expanded = fixture.nativeElement.querySelectorAll('.month-header[aria-expanded="true"]');
    expect(expanded.length).toBe(1);

    const currentMonth = new Date();
    const dayCount = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    expect(fixture.nativeElement.querySelectorAll('.day-list .day').length).toBe(dayCount);
  });

  it('should collapse a month when its header is clicked again', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    const header: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.month-header[aria-expanded="true"]',
    );
    header.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.day-list').length).toBe(0);
  });

  it('should expand a collapsed month when its header is clicked', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    const collapsed: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.month-header[aria-expanded="false"]',
    );
    collapsed.click();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll('.month-header[aria-expanded="true"]').length,
    ).toBe(2);
  });
});
