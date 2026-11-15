import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import HeroesPage from './heroes-page';
import { HeroesService } from '../../services/heroes';
import { HeroesUtilsService } from '../../services/heroes-utils';
import { GetHeroesResponse } from '../../interfaces/heroes.interface';

const createMockResponse = (): GetHeroesResponse => ({
  total_pages: 1,
  current_page: 1,
  elements_per_page: 10,
  total_elements: 0,
  data: [],
});

// Fake del servicio: la página monta el grid completo, que consulta en el arranque.
const heroesServiceMock = { getHeroes: vi.fn().mockReturnValue(of(createMockResponse())) };

describe('HeroesPage', () => {
  let component: HeroesPage;
  let fixture: ComponentFixture<HeroesPage>;
  let router: Router;
  let heroesUtilsService: HeroesUtilsService;
  // Snapshot mutable: cada test define los query params "actuales" de la URL.
  const snapshotQueryParams: Record<string, string> = {};

  const flushMicrotasks = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroesPage],
      providers: [
        provideRouter([]),
        { provide: HeroesService, useValue: heroesServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParams: snapshotQueryParams, queryParamMap: convertToParamMap({}) },
            queryParamMap: of(convertToParamMap({})),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroesPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    heroesUtilsService = TestBed.inject(HeroesUtilsService);
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete snapshotQueryParams['name'];
    delete snapshotQueryParams['alias'];
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('el título con URL con filtros navega a /heroes sin query params (la grilla re-consulta sola)', async () => {
    snapshotQueryParams['name'] = 'super';
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const refreshSpy = vi.spyOn(heroesUtilsService, 'refreshLoad');

    (fixture.nativeElement.querySelector('h1') as HTMLElement).click();
    await flushMicrotasks();

    expect(navigateSpy).toHaveBeenCalledWith(['/heroes']);
    // La limpieza de la URL ya dispara el GET: no hace falta forzar el refresco
    expect(refreshSpy).not.toHaveBeenCalled();
  });

  it('el título con URL ya limpia navega a /heroes y fuerza el refresco del GET', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const refreshSpy = vi.spyOn(heroesUtilsService, 'refreshLoad');

    (fixture.nativeElement.querySelector('h1') as HTMLElement).click();

    expect(navigateSpy).toHaveBeenCalledWith(['/heroes']);
    // Con la URL limpia el navigate es un no-op: el refresco forzado re-dispara el GET
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });
});
