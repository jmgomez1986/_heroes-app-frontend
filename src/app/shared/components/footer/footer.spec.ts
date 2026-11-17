import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Footer } from './footer';

describe('Footer', () => {
  let component: Footer;
  let fixture: ComponentFixture<Footer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
    }).compileComponents();

    fixture = TestBed.createComponent(Footer);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería renderizar el nombre del catálogo con ícono y el copyright', () => {
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Heroes App — Catálogo de Superhéroes');
    expect(text).toContain('© 2026 Heroes App. Todos los derechos reservados.');
    // Ícono acompañando al texto de la izquierda (S4).
    expect(fixture.nativeElement.querySelector('mat-icon')).toBeTruthy();
  });

  it('no debería contener textos de rolplay', () => {
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain('Archivo Protocol');
    expect(text).not.toContain('Sistema Metahumano');
  });

  it('debería usar la receta neutra: superficie blanca y borde superior zinc-200', () => {
    fixture.detectChanges();
    const footer = fixture.nativeElement.querySelector('footer');
    expect(footer?.classList).toContain('bg-white');
    expect(footer?.classList).toContain('border-zinc-200');
  });
});
