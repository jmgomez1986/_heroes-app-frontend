import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import Swal, { type SweetAlertResult } from 'sweetalert2';
import { of, throwError } from 'rxjs';

import { HeroGridCard } from './hero-grid-card';
import { Hero } from '../../../interfaces/heroes.interface';
import { HeroesService } from '../../../services/heroes';
import { I18N } from '../../../shared/i18n/es';

// Se crea el Mock del heroe cpmo una arrow function, para despues si es necesario, en otros test,
// usarla para sobreescribir algun atributo
// Ejemplo: fixture.componentRef.setInput('hero', createMockHero({ name: 'Nuevo nombre' }));
const createMockHero = (overrides: Partial<Hero> = {}): Hero => ({
  _id: '1',
  slug: 'superman',
  name: 'Clark Kent',
  alias: 'Superman',
  powers: ['Vuelo', 'Super fuerza', 'Visión de calor'],
  description: 'Descripción de prueba',
  team: 'Liga de la Justicia',
  image: 'superman.jpg',
  status: 'Active',
  category: 'Heroe',
  universe: 'DC',
  ...overrides,
});

// Fake del servicio: cada método es un vi.fn() que emite al instante.
// No se toca HTTP ni hace falta provideHttpClientTesting (patrón ya usado en el repo).
const createHeroesServiceMock = () => ({
  getHeroes: vi.fn(),
  getHeroBySlug: vi.fn(),
  addNewHero: vi.fn().mockReturnValue(of({ res: createMockHero() })),
  editHero: vi.fn().mockReturnValue(of(createMockHero())),
  deleteHero: vi.fn().mockReturnValue(of({ msg: 'Hero deleted correctly.' })),
});

// Se mockea el módulo de sweetalert2 completo para poder espiar Swal.fire sin tocar el módulo real.
vi.mock('sweetalert2', () => ({
  default: { fire: vi.fn() },
}));

// Espera a que se resuelvan las promesas (el .then de Swal.fire, RxJS, etc.).
const flushMicrotasks = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

// Simula la confirmación/cancelación del diálogo de sweetalert2.
const mockSwalConfirmation = (isConfirmed: boolean) => {
  vi.mocked(Swal.fire).mockResolvedValue({
    isConfirmed,
    isDenied: false,
    isDismissed: !isConfirmed,
  } as SweetAlertResult);
};

describe('HeroGridCard', () => {
  let component: HeroGridCard;
  let fixture: ComponentFixture<HeroGridCard>;
  let router: Router;
  let heroesService!: ReturnType<typeof createHeroesServiceMock>;
  let heroDeletedSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    heroesService = createHeroesServiceMock();

    await TestBed.configureTestingModule({
      imports: [HeroGridCard],
      providers: [provideRouter([]), { provide: HeroesService, useValue: heroesService }],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroGridCard);
    component = fixture.componentInstance;

    // El input "hero" es requerido se setea antes usando el mock generado por la función createMockHero
    fixture.componentRef.setInput('hero', createMockHero());
    router = TestBed.inject(Router);
    heroDeletedSpy = vi.spyOn(component.heroDeleted, 'emit');
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display status with other backgroud if status is  not "Active"', () => {
    // Se setea el input "hero" con un status diferente a "Active"
    fixture.componentRef.setInput('hero', createMockHero({ status: 'Inactive' }));
    fixture.detectChanges();

    const statusElement = fixture.nativeElement.querySelector('.bg-red-500');
    expect(statusElement).toBeTruthy();
  });

  it('should display 3 chips of powers ', () => {
    const chips = fixture.nativeElement.querySelectorAll('mat-chip') as NodeListOf<Element>;
    const chipTexts = Array.from(chips).map((chip) => chip.textContent?.trim());

    expect(chipTexts).toContain('Vuelo');
    expect(chipTexts).toContain('Super fuerza');
    expect(chipTexts).toContain('Visión de calor');
  });

  it('should display only 3 chips of powers and display other chip with text "2 más"', () => {
    // Se setea el input "hero" con más de 3 powers
    fixture.componentRef.setInput(
      'hero',
      createMockHero({
        powers: ['Vuelo', 'Super fuerza', 'Visión de calor', 'Regeneración', 'Invisibilidad'],
      }),
    );
    fixture.detectChanges();

    const chips = fixture.nativeElement.querySelectorAll('mat-chip') as NodeListOf<Element>;
    const chipTexts = Array.from(chips).map((chip) => chip.textContent?.trim());

    expect(chipTexts).toContain('Vuelo');
    expect(chipTexts).toContain('Super fuerza');
    expect(chipTexts).toContain('Visión de calor');
    expect(chipTexts).toContain('2 más');
    expect(chipTexts).not.toContain('Regeneración');
    expect(chipTexts).not.toContain('Invisibilidad');
  });

  it('should call router.navigate with "/edit-hero/" when editHero is called', () => {
    // Se crea un espia de router.navigate para verificar que se llame con el argumento correcto
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.editHero();
    // La edición navega por slug (contrato real del backend), no por id
    expect(navigateSpy).toHaveBeenCalledWith(['/edit-hero/superman']);
  });

  it('should call router.navigate with "/view-hero/" when viewHero is called', () => {
    // Se crea un espia de router.navigate para verificar que se llame con el argumento correcto
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.viewHero();
    expect(navigateSpy).toHaveBeenCalledWith(['/view-hero/superman']);
  });

  it('deleteHero muestra el diálogo de confirmación de Swal al guardar', async () => {
    mockSwalConfirmation(false);
    component.deleteHero();
    await flushMicrotasks();

    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: I18N.heroes.card.confirmDeleteTitle,
        text: I18N.heroes.card.confirmDeleteText,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: I18N.heroes.card.confirmButton,
        cancelButtonText: I18N.heroes.card.cancelButton,
      }),
    );

    // Al cancelar el diálogo, el servicio no debe llamarse.
    expect(heroesService.deleteHero).not.toHaveBeenCalled();
  });

  it('deleteHero llama al servicio deleteHero con el slug del héroe cuando Swal confirma', async () => {
    mockSwalConfirmation(true);
    component.deleteHero();
    await flushMicrotasks();

    expect(heroesService.deleteHero).toHaveBeenCalledWith('superman');
  });

  it('deleteHero muestra el mensaje de éxito y emite heroDeleted cuando la eliminación es exitosa', async () => {
    mockSwalConfirmation(true);
    component.deleteHero();
    await flushMicrotasks();

    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({ title: I18N.heroes.card.deleteSuccessTitle }),
    );
    expect(heroDeletedSpy).toHaveBeenCalledTimes(1);
  });

  it('deleteHero muestra un diálogo de error y loguea en consola cuando el servicio falla', async () => {
    mockSwalConfirmation(true);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    heroesService.deleteHero.mockReturnValue(throwError(() => new Error('Base de datos caída')));

    component.deleteHero();
    await flushMicrotasks();

    expect(errorSpy).toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({ title: I18N.heroes.card.deleteErrorTitle }),
    );
  });
});
