import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { HeroesService } from './heroes';
import { HeroV2, NewHeroResponse, UploadImageResponse } from '../interfaces/heroes.interface';
import { environment } from '../environments/environment';

describe('HeroesService', () => {
  let service: HeroesService;
  let httpMock: HttpTestingController;

  const createMockHero = (overrides: Partial<HeroV2> = {}): HeroV2 => ({
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
