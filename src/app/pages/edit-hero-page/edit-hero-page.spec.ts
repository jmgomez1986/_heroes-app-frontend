import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import EditHeroPage from './edit-hero-page';
import { HeroesService } from '../../services/heroes';
import { Hero } from '../../interfaces/heroes.interface';
import { Mode } from '../../constants/defaultValues';

// Héroe de prueba reutilizable.
const mockHero: Hero = {
  _id: '1',
  slug: 'superman',
  name: 'Clark Kent',
  alias: 'Superman',
  powers: ['Vuelo'],
  description: 'Descripción de prueba',
  team: 'Liga de la Justicia',
  image: 'superman.jpg',
  status: 'Active',
  category: 'Heroe',
  universe: 'DC',
};

// Factory del servicio: cada método es un vi.fn() que emite al instante.
const createHeroesServiceMock = () => ({
  getHeroBySlug: vi.fn().mockReturnValue(of(mockHero)),
});

describe('EditHeroPage', () => {
  let component: EditHeroPage;
  let fixture: ComponentFixture<EditHeroPage>;
  let heroesService!: ReturnType<typeof createHeroesServiceMock>;

  const setMode = (mode: Mode) => fixture.componentRef.setInput('mode', mode);

  beforeEach(async () => {
    heroesService = createHeroesServiceMock();

    await TestBed.configureTestingModule({
      imports: [EditHeroPage],
      providers: [
        provideRouter([]),
        { provide: HeroesService, useValue: heroesService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditHeroPage);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('heroSlug', 'superman');
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show "Visualizar Héroe" heading when mode is "view"', async () => {
    setMode('view');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe('Visualizar Héroe');
  });

  it('should show "Editar Héroe" heading when mode is "edit"', async () => {
    setMode('edit');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe('Editar Héroe');
  });

  // El resource carga exitosamente y devuelve el héroe por su slug
  it('resource carga y devuelve el héroe', async () => {
    await fixture.whenStable();
    expect(heroesService.getHeroBySlug).toHaveBeenCalledWith('superman');
    expect(component.heroeResource.value()).toEqual(mockHero);
    expect(component.heroeResource.hasValue()).toBe(true);
  });

  // El resource muestra error y el template avisa cuando falla
  it('resource muestra error cuando el servicio falla', async () => {
    heroesService.getHeroBySlug.mockReturnValue(throwError(() => new Error('heroe no encontrado')));
    fixture.componentRef.setInput('heroSlug', 'batman');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(component.heroeResource.error()).toBeDefined();
    expect(component.heroeResource.hasValue()).toBe(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No se pudo cargar el héroe.');
  });
});
