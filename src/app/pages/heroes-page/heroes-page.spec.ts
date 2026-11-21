import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import HeroesPage from './heroes-page';
import { HeroesService } from '../../services/heroes';
import { GetHeroesResponse, HeroStatsResponse } from '../../interfaces/heroes.interface';

const createMockResponse = (): GetHeroesResponse => ({
  total_pages: 1,
  current_page: 1,
  elements_per_page: 10,
  total_elements: 0,
  data: [],
});

const createMockStats = (): HeroStatsResponse => ({
  total_elements: 42,
  total_heroes: 30,
  total_villains: 12,
  total_active: 21,
  total_inactive: 3,
  total_deceased: 1,
});

// Fake del servicio: la página monta el grid completo (que consulta en el arranque)
// y ahora también consulta GET /heroes/stats para la sección de contadores.
const heroesServiceMock = {
  getHeroes: vi.fn().mockReturnValue(of(createMockResponse())),
  getStats: vi.fn(),
};

describe('HeroesPage', () => {
  // Fuente de query params "actual" para el ActivatedRoute fake que consume el grid.
  const snapshotQueryParams: Record<string, string> = {};

  const flushMicrotasks = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

  const createFixture = async (): Promise<ComponentFixture<HeroesPage>> => {
    const fixture = TestBed.createComponent(HeroesPage);
    await fixture.whenStable();
    return fixture;
  };

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
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete snapshotQueryParams['name'];
    delete snapshotQueryParams['alias'];
  });

  it('should create', async () => {
    heroesServiceMock.getStats.mockReturnValue(of(createMockStats()));
    const fixture = await createFixture();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra la sección de stats con el contrato del backend (total + chips por categoría)', async () => {
    heroesServiceMock.getStats.mockReturnValue(of(createMockStats()));
    const fixture = await createFixture();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('Total de personajes');
    expect(host.textContent).toContain('42');
    expect(host.textContent).toContain('30 Héroes');
    expect(host.textContent).toContain('12 Villanos');
  });

  it('si GET /heroes/stats falla (endpoint inexistente), la sección de stats se oculta sin error visible', async () => {
    heroesServiceMock.getStats.mockReturnValueOnce(throwError(() => new Error('endpoint pendiente')));
    const fixture = await createFixture();
    await flushMicrotasks();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).not.toContain('Total de personajes');
    // La página sigue viva: el resto del catálogo renderiza normalmente.
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renderiza el encabezado con el título del catálogo y no duplica el botón de alta', async () => {
    heroesServiceMock.getStats.mockReturnValue(of(createMockStats()));
    const fixture = await createFixture();

    const host = fixture.nativeElement as HTMLElement;
    // El título del catálogo vive en la página (el acceso a Home lo da el header).
    expect(host.querySelector('h1')?.textContent).toContain('Catálogo de Superhéroes');
    // El alta vive en el CTA del header: la página no repite el botón.
    expect(host.textContent).not.toContain('Agregar un nuevo héroe');
  });
});
