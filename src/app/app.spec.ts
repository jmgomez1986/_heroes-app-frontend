import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      // Router necesario: el shell ahora renderiza links de navegación en el header.
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('debería renderizar el header antes del outlet y el footer después', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    const header = el.querySelector('app-header');
    const outlet = el.querySelector('router-outlet');
    const footer = el.querySelector('app-footer');

    expect(header).toBeTruthy();
    expect(outlet).toBeTruthy();
    expect(footer).toBeTruthy();
    // Orden del shell: header → outlet → footer dentro del contenedor flex.
    expect(
      header!.compareDocumentPosition(outlet!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      outlet!.compareDocumentPosition(footer!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
