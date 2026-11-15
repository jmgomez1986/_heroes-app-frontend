import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';

import { HeroesGrid } from './heroes-grid';
import { HeroesService } from '../../../services/heroes';
import { GetHeroesResponse, Hero } from '../../../interfaces/heroes.interface';

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

  it('applyFilters escribe la URL con el filtro y resetea la página (los vacíos no viajan)', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.applyFilters({ name: '  batman  ' });

    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        // page: undefined no aparece (vuelve al default = página 1)
        queryParams: { name: 'batman' },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      }),
    );
  });

  it('applyFilters descarta los filtros vacíos', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.applyFilters({ alias: '   ' });

    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: {} }),
    );
  });

  it('handlePageEvent escribe page y size en la URL; los defaults no viajan', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.handlePageEvent({ pageIndex: 2, pageSize: 25 } as PageEvent);
    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { page: 3, elements_per_page: 25 } }),
    );

    component.handlePageEvent({ pageIndex: 0, pageSize: 10 } as PageEvent);
    expect(navigateSpy).toHaveBeenLastCalledWith(
      [],
      expect.objectContaining({ queryParams: {} }),
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
      expect.objectContaining({ queryParams: { page: 3 } }),
    );
  });
});
