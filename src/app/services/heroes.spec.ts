import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { HeroesService } from './heroes';
import {
  DeleteHeroResponse,
  EditHeroResponse,
  GetHeroesResponse,
  Hero,
  HeroStats,
  NewHeroResponse,
  UploadImageResponse,
} from '../interfaces/heroes.interface';
import { environment } from '../environments/environment';

describe('HeroesService', () => {
  let service: HeroesService;
  let httpMock: HttpTestingController;

  const createMockHero = (overrides: Partial<Hero> = {}): Hero => ({
    _id: '1',
    slug: 'superman',
    name: 'Clark Kent',
    alias: 'Superman',
    powers: ['Vuelo', 'Super fuerza'],
    description: 'Descripción de prueba',
    team: 'Liga de la Justicia',
    image: '',
    status: 'Active',
    category: 'Hero',
    universe: 'DC',
    ...overrides,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HeroesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('addNewHero hace POST a /heroes con el héroe en el body', () => {
    const mockHero = createMockHero();
    const mockResponse: NewHeroResponse = { msg: 'Hero created correctly.', response: mockHero };
    let result: NewHeroResponse | undefined;

    service.addNewHero(mockHero).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${environment.url}/api/heroes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockHero);
    req.flush(mockResponse);

    expect(result).toEqual(mockResponse);
  });

  it('getHeroes pagina y filtra: solo viajan los filtros con valor (con trim)', () => {
    const mockResponse: GetHeroesResponse = {
      total_pages: 1,
      current_page: 2,
      elements_per_page: 25,
      total_elements: 4,
      data: [createMockHero()],
    };
    let result: GetHeroesResponse | undefined;

    service.getHeroes(2, 25, { name: '  super ', alias: '' }).subscribe((res) => (result = res));

    // alias vacío no viaja; name viaja recortado
    const req = httpMock.expectOne(
      `${environment.url}/api/heroes?page=2&elements_per_page=25&name=super`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    expect(result).toEqual(mockResponse);
  });

  it('getHeroes sin filtros arma solo los params de paginación (los defaults viajan al backend)', () => {
    service.getHeroes(1, 10).subscribe();

    const req = httpMock.expectOne(
      `${environment.url}/api/heroes?page=1&elements_per_page=10`,
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      total_pages: 1,
      current_page: 1,
      elements_per_page: 10,
      total_elements: 0,
      data: [],
    });
  });

  it('getStats hace GET a /heroes/stats y devuelve el contrato del backend', () => {
    const mockStats: HeroStats = { total_elements: 42, total_heroes: 30, total_villains: 12, total_active: 21, total_inactive: 3, total_deceased: 1 };
    let result: HeroStats | undefined;

    service.getStats().subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${environment.url}/api/heroes/stats`);
    expect(req.request.method).toBe('GET');
    req.flush(mockStats);

    expect(result).toEqual(mockStats);
  });

  it('getHeroBySlug hace GET a /heroes/:slug', () => {
    const mockHero = createMockHero();
    let result: Hero | undefined;

    service.getHeroBySlug('superman').subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${environment.url}/api/heroes/superman`);
    expect(req.request.method).toBe('GET');
    req.flush(mockHero);

    expect(result).toEqual(mockHero);
  });

  it('editHero hace PATCH a /heroes/:slug con los campos a editar', () => {
    const edits: Partial<Hero> = { alias: 'Superman Prime', description: 'Nueva descripción' };
    const mockResponse: EditHeroResponse = {
      msg: 'Hero modified correctly',
      response: createMockHero(edits),
    };
    let result: EditHeroResponse | undefined;

    service.editHero('superman', { ...createMockHero(), ...edits }).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${environment.url}/api/heroes/superman`);
    expect(req.request.method).toBe('PATCH');
    req.flush(mockResponse);

    expect(result).toEqual(mockResponse);
  });

  it('deleteHero hace DELETE a /heroes/:slug', () => {
    const mockResponse: DeleteHeroResponse = { msg: 'Hero deleted correctly.' };
    let result: DeleteHeroResponse | undefined;

    service.deleteHero('superman').subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${environment.url}/api/heroes/superman`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockResponse);

    expect(result).toEqual(mockResponse);
  });

  it('uploadHeroImage envía el archivo como binario con su Content-Type', () => {
    const file = new File(['fake'], 'superman.png', { type: 'image/png' });
    const mockResponse: UploadImageResponse = {
      msg: 'Image uploaded correctly.',
      response: createMockHero({ image: 'https://res.cloudinary.com/matiasdev/superman.jpg' }),
    };
    let result: UploadImageResponse | undefined;

    service.uploadHeroImage('superman', file).subscribe((res) => (result = res));

    const req = httpMock.expectOne(`${environment.url}/api/heroes/superman/image`);
    expect(req.request.method).toBe('POST');
    // El body es el archivo crudo, no JSON ni base64
    expect(req.request.body).toBe(file);
    expect(req.request.headers.get('Content-Type')).toBe('image/png');
    req.flush(mockResponse);

    expect(result).toEqual(mockResponse);
  });
});
