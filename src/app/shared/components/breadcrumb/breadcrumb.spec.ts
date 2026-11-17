import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, Routes } from '@angular/router';

import { Breadcrumb } from './breadcrumb';

// Componente stub para las rutas del test: al breadcrumb solo le importa la URL.
@Component({ selector: 'stub-page', template: '' })
class StubPage {}

// Rutas mínimas espejo de app.routes.ts (S6): navegación real para que el
// breadcrumb reaccione a los NavigationEnd.
const testRoutes: Routes = [
  { path: 'heroes', component: StubPage },
  { path: 'new-hero', component: StubPage },
  { path: 'view-hero/:heroSlug', component: StubPage },
  { path: 'edit-hero/:heroSlug', component: StubPage },
  { path: '**', redirectTo: 'heroes', pathMatch: 'full' },
];

describe('Breadcrumb', () => {
  let component: Breadcrumb;
  let fixture: ComponentFixture<Breadcrumb>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Breadcrumb],
      providers: [provideRouter(testRoutes)],
    }).compileComponents();

    fixture = TestBed.createComponent(Breadcrumb);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // El breadcrumb renderiza links para los segmentos anteriores y un span
  // para el segmento actual (sin link).
  const breadcrumbItems = (): Element[] =>
    Array.from(fixture.nativeElement.querySelectorAll('nav a, nav span'));

  const breadcrumbAnchors = (): HTMLAnchorElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('a'));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('en /heroes muestra solo "Catálogo" como texto plano (segmento actual sin link)', async () => {
    await router.navigateByUrl('/heroes');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('a').length).toBe(0);
    const items = breadcrumbItems();
    expect(items.length).toBe(1);
    expect(items[0].textContent?.trim()).toBe('Catálogo');
    expect(items[0].tagName).toBe('SPAN');
  });

  it('en /new-hero muestra "Catálogo" como link y "Nuevo Héroe" como segmento actual', async () => {
    await router.navigateByUrl('/new-hero');
    fixture.detectChanges();

    const anchors = breadcrumbAnchors();
    expect(anchors.length).toBe(1);
    expect(anchors[0].textContent?.trim()).toBe('Catálogo');

    const current = breadcrumbItems().at(-1);
    expect(current?.textContent?.trim()).toBe('Nuevo Héroe');
    expect(current?.tagName).toBe('SPAN');
  });

  it('en /view-hero/:heroSlug deriva el alias del slug y solo "Catálogo" es link', async () => {
    await router.navigateByUrl('/view-hero/super-man');
    fixture.detectChanges();

    const anchors = breadcrumbAnchors();
    expect(anchors.length).toBe(1);
    expect(anchors[0].textContent?.trim()).toBe('Catálogo');

    const current = breadcrumbItems().at(-1);
    expect(current?.textContent?.trim()).toBe('Consultar: Super Man');
    expect(current?.tagName).toBe('SPAN');
  });

  it('en /edit-hero/:heroSlug el segmento actual es "Editar: {alias}" derivado del slug', async () => {
    await router.navigateByUrl('/edit-hero/captain-america');
    fixture.detectChanges();

    const current = breadcrumbItems().at(-1);
    expect(current?.textContent?.trim()).toBe('Editar: Captain America');
  });

  it('usa el separador chevron_right entre segmentos', async () => {
    await router.navigateByUrl('/new-hero');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('mat-icon').length).toBe(1);
  });
});
