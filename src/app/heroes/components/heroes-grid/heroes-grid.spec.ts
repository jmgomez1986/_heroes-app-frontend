import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, NEVER, of, throwError } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';

import { HeroesGrid } from './heroes-grid';
import { HeroesService } from '../../../services/heroes';
import { HeroesUtilsService } from '../../../services/heroes-utils';
import { GetHeroesResponse, Hero } from '../../../interfaces/heroes.interface';
import { I18N } from '../../../shared/i18n/es';
import Swal from 'sweetalert2';

// Se mockea el módulo de sweetalert2 completo para poder espiar Swal.fire sin tocar el módulo real.
vi.mock('sweetalert2', () => ({
  default: { fire: vi.fn() },
}));

// Héroe de prueba reutilizable.
const createMockHero = (overrides: Partial<Hero> = {}): Hero => ({
  _id: '1',
  slug: 'superman',
  name: 'Clark Kent',
  alias: 'Superman',
  powers: ['Vuelo'],
  description: 'Descripción de prueba',
  team: 'Liga de la Justicia',
  image: '',
  status: 'Active',
  category: 'Hero',
  universe: 'DC',
  ...overrides,
});

const createMockResponse = (overrides: Partial<GetHeroesResponse> = {}): GetHeroesResponse => ({
  total_pages: 1,
  current_page: 1,
  elements_per_page: 10,
  total_elements: 4,
  data: [createMockHero()],
  ...overrides,
});

// Fake del servicio: cada método es un vi.fn() que emite al instante.
// No se toca HTTP ni hace falta provideHttpClientTesting (patrón ya usado en el repo).
const createHeroesServiceMock = () => ({
  getHeroes: vi.fn().mockReturnValue(of(createMockResponse())),
});

describe('HeroesGrid', () => {
  let component: HeroesGrid;
  let fixture: ComponentFixture<HeroesGrid>;
  let router: Router;
  let heroesService!: ReturnType<typeof createHeroesServiceMock>;
  // Fuente controlable de query params: hace las veces de la URL.
  let queryParams$: BehaviorSubject<ParamMap>;

  // Espera a que se resuelvan las promesas (el loader del resource, RxJS, etc.).
  const flushMicrotasks = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

  beforeEach(async () => {
    heroesService = createHeroesServiceMock();
    queryParams$ = new BehaviorSubject(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [HeroesGrid],
      providers: [
        provideRouter([]),
        { provide: HeroesService, useValue: heroesService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: queryParams$.value },
            queryParamMap: queryParams$.asObservable(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroesGrid);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('arma la consulta con page, size y filtros tomados de la URL', async () => {
    queryParams$.next(convertToParamMap({ page: '2', elements_per_page: '25', name: 'super' }));
    await flushMicrotasks();

    expect(heroesService.getHeroes).toHaveBeenLastCalledWith(2, 25, { name: 'super' });
  });

  it('sanitiza page y size inválidos en la URL contra los límites del backend', async () => {
    queryParams$.next(convertToParamMap({ page: 'abc', elements_per_page: '999' }));
    await flushMicrotasks();

    expect(heroesService.getHeroes).toHaveBeenLastCalledWith(1, 10, {});
  });

  it('applyFilters escribe la URL con el filtro recortado y page/size explícitos', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.applyFilters({ name: '  batman  ' });

    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { name: 'batman', page: 1, elements_per_page: 10 },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      }),
    );
  });

  it('applyFilters descarta los filtros vacíos y la página 1 viaja explícita', () => {
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.applyFilters({ alias: '   ' });

    expect(router.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParamsHandling: 'merge', replaceUrl: true }),
    );
  });

  it('toma de la URL todos los filtros y los manda al get', async () => {
    queryParams$.next(
      convertToParamMap({
        name: 'clark',
        alias: 'super',
        team: 'liga',
        universe: 'dc',
        category: 'heroe',
        status: 'activo',
      }),
    );
    await flushMicrotasks();

    expect(heroesService.getHeroes).toHaveBeenLastCalledWith(1, 10, {
      name: 'clark',
      alias: 'super',
      team: 'liga',
      universe: 'dc',
      category: 'heroe',
      status: 'activo',
    });
  });

  it('clearFilters borra todos los filtros de la URL cuando había alguno', async () => {
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const refresh = vi.spyOn(TestBed.inject(HeroesUtilsService), 'refreshLoad');
    queryParams$.next(convertToParamMap({ name: 'batman', category: 'heroe', page: '3' }));
    await flushMicrotasks();

    component.clearFilters();

    const extras = vi.mocked(router.navigate).mock.calls.at(-1)![1]!;
    expect(extras.queryParams).toStrictEqual({
      name: undefined,
      alias: undefined,
      team: undefined,
      universe: undefined,
      category: undefined,
      status: undefined,
      page: 1,
      elements_per_page: 10,
    });
    expect(extras).toEqual(
      expect.objectContaining({ queryParamsHandling: 'merge', replaceUrl: true }),
    );
    expect(refresh).not.toHaveBeenCalled();
  });

  it('clearFilters recarga el listado cuando la URL ya estaba sin filtros', () => {
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const refresh = vi.spyOn(TestBed.inject(HeroesUtilsService), 'refreshLoad');

    component.clearFilters();

    expect(refresh).toHaveBeenCalledOnce();
  });

  it('limpiar un filtro lo BORRA de la URL: el router recibe la key con undefined (señal de borrado del merge)', () => {
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.applyFilters({ alias: '   ' });

    const extras = vi.mocked(router.navigate).mock.calls[0][1]!;
    expect(extras.queryParams).toStrictEqual({
      alias: undefined,
      page: 1,
      elements_per_page: 10,
    });
  });

  it('handlePageEvent escribe page y size en la URL; los defaults viajan explícitos', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.handlePageEvent({ pageIndex: 2, pageSize: 25 } as PageEvent);
    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { page: 3, elements_per_page: 25 } }),
    );

    component.handlePageEvent({ pageIndex: 0, pageSize: 10 } as PageEvent);
    expect(navigateSpy).toHaveBeenLastCalledWith(
      [],
      expect.objectContaining({ queryParams: { page: 1, elements_per_page: 10 } }),
    );
  });

  it('con data vacía en una página fuera de rango, vuelve a la última página con datos (en la URL)', async () => {
    heroesService.getHeroes.mockReturnValue(of(createMockResponse({ data: [], total_pages: 3 })));
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    queryParams$.next(convertToParamMap({ page: '5' }));
    await fixture.whenStable();
    await flushMicrotasks();

    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { page: 3, elements_per_page: 10 } }),
    );
  });

  it('si el GET falla, muestra el SweetAlert de error y el estado vacío (sin spinner infinito)', async () => {
    heroesService.getHeroes.mockReturnValue(throwError(() => new Error('server down')));
    // La carga inicial del beforeEach ya resolvió con éxito: fuerzo un nuevo GET que falla
    component.heroesResource.reload();
    await fixture.whenStable();
    await flushMicrotasks();

    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: I18N.messages.loadErrorTitle,
        text: I18N.messages.loadErrorText,
        icon: 'error',
      }),
    );
    // Sin spinner colgado y con el estado vacío visible
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('mat-spinner')).toBeNull();
    expect(host.textContent).toContain('No se encontraron resultados.');
  });

  it('si el GET tiene éxito no se dispara el SweetAlert de error', async () => {
    await fixture.whenStable();
    await flushMicrotasks();

    expect(Swal.fire).not.toHaveBeenCalled();
  });

  describe('selector de items por página arriba + paginador abajo (S3 corregida)', () => {
    it('muestra el pill con los items de la página actual y el total del backend', async () => {
      const heroB = createMockHero({ _id: '2', slug: 'batman', alias: 'Batman', name: 'Bruce Wayne' });
      heroesService.getHeroes.mockReturnValue(of(createMockResponse({ total_elements: 42, data: [createMockHero(), heroB] })));
      component.heroesResource.reload();
      await fixture.whenStable();
      await flushMicrotasks();

      const pill = fixture.nativeElement.querySelector('[data-testid="count-pill"]');
      expect(pill).not.toBeNull();
      expect(pill.textContent).toContain('Mostrando');
      expect(pill.textContent).toContain('2');
      expect(pill.textContent).toContain('42');
      expect(pill.textContent).toContain('héroes');
    });

    it('oculta el pill mientras la consulta está en curso (el selector y el paginador siguen visibles)', () => {
      // Observable que nunca emite: simula una carga infinita del GET.
      // whenStable() esperaría al resource pendiente: se detecta manualmente.
      heroesService.getHeroes.mockReturnValue(NEVER);
      component.heroesResource.reload();
      fixture.detectChanges();

      const host = fixture.nativeElement as HTMLElement;
      expect(host.querySelector('[data-testid="count-pill"]')).toBeNull();
      expect(host.querySelector('[data-testid="page-size-selector"]')).not.toBeNull();
      expect(host.querySelector('mat-paginator')).not.toBeNull();
    });

    it('en estado de error del GET tampoco se muestra el pill', async () => {
      heroesService.getHeroes.mockReturnValue(throwError(() => new Error('server down')));
      component.heroesResource.reload();
      await fixture.whenStable();
      await flushMicrotasks();

      expect(fixture.nativeElement.querySelector('[data-testid="count-pill"]')).toBeNull();
    });

    it('hay exactamente un paginador y queda abajo, fuera del selector superior', async () => {
      const host = fixture.nativeElement as HTMLElement;
      const countSelector = host.querySelector('app-hero-count-selector')!;
      const paginator = host.querySelector('mat-paginator')!;

      expect(host.querySelectorAll('mat-paginator').length).toBe(1);
      // El paginador vive después del selector (abajo de la grilla), no dentro de él.
      expect(countSelector.contains(paginator)).toBe(false);
      expect(countSelector.compareDocumentPosition(paginator) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('el cambio de tamaño desde el selector vuelve a la página 1 y escribe la URL', () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      component.handlePageSizeChange(25);

      expect(navigateSpy).toHaveBeenCalledWith(
        [],
        expect.objectContaining({
          queryParams: { page: 1, elements_per_page: 25 },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        }),
      );
    });
  });
});
