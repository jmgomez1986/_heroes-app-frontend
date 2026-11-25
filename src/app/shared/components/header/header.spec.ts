import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, Routes } from '@angular/router';

import { Header } from './header';

// Componente stub para las rutas del test: al header solo le importa la URL activa.
@Component({ selector: 'app-stub-page', template: '' })
class StubPage {}

// Rutas mínimas espejo de app.routes.ts: los tests navegan de verdad para
// comprobar el estado activo de los links (S1).
const testRoutes: Routes = [
  { path: 'heroes', component: StubPage },
  { path: 'new-hero', component: StubPage },
  { path: 'view-hero/:heroSlug', component: StubPage },
  { path: 'edit-hero/:heroSlug', component: StubPage },
  { path: '**', redirectTo: 'heroes', pathMatch: 'full' },
];

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter(testRoutes)],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería renderizar la marca "Heroes App" desde la constante única del componente', () => {
    fixture.detectChanges();
    const brand = fixture.nativeElement.querySelector('a');
    expect(brand?.textContent?.trim()).toBe('Heroes App');
  });

  it('debería renderizar los links de navegación y el CTA "Agregar un nuevo héroe" hacia /new-hero', () => {
    fixture.detectChanges();
    const links: HTMLAnchorElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('nav a'),
    );
    const labels = links.map((a) => a.textContent?.trim());
    expect(labels).toContain('Catálogo');
    expect(labels).toContain('Nuevo Héroe');

    const cta = fixture.nativeElement.querySelector('button');
    expect(cta?.textContent).toContain('Agregar un nuevo héroe');
    // El CTA navega al formulario de alta (el atributo estático routerLink
    // se preserva en el DOM).
    expect(cta?.getAttribute('routerlink')).toBe('/new-hero');
    // El ícono "+" acompaña al texto del CTA.
    expect(cta?.querySelector('mat-icon')).toBeTruthy();
  });

  it('debería marcar como activo el link "Catálogo" cuando la ruta es /heroes', async () => {
    // Primera pasada de CD: crea los links y suscribe RouterLinkActive.
    fixture.detectChanges();
    await router.navigateByUrl('/heroes');
    fixture.detectChanges();
    const activeLink = fixture.nativeElement.querySelector('a.text-indigo-600');
    expect(activeLink?.textContent?.trim()).toBe('Catálogo');
  });

  it('debería marcar como activo el link "Nuevo Héroe" cuando la ruta es /new-hero', async () => {
    fixture.detectChanges();
    await router.navigateByUrl('/new-hero');
    fixture.detectChanges();
    const activeLink = fixture.nativeElement.querySelector('a.text-indigo-600');
    expect(activeLink?.textContent?.trim()).toBe('Nuevo Héroe');
  });

  it('debería usar la receta neutra: sticky, superficie blanca y borde zinc-200', () => {
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('header');
    expect(header?.classList).toContain('sticky');
    expect(header?.classList).toContain('bg-white');
    expect(header?.classList).toContain('border-zinc-200');
  });
});
