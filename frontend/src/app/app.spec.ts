import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the sidebar with home as the first icon', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const links = fixture.nativeElement.querySelectorAll('.sidebar a');
    expect(links.length).toBeGreaterThan(0);
    expect(links[0].getAttribute('aria-label')).toBe('Home');
    expect(links[0].getAttribute('href')).toBe('/home');
  });
});
