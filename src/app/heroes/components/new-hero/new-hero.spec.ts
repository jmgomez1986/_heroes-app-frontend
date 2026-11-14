import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import Swal, { type SweetAlertResult } from 'sweetalert2';
import { MatChipInputEvent } from '@angular/material/chips';

import NewHero from './new-hero';
import { HeroesService } from '../../../services/heroes';
import { HeroV2 } from '../../../interfaces/heroes.interface';
import { Mode } from '../../../interfaces/shared.interface';
import { I18N } from '../../../shared/i18n/es';

// Se mockea el módulo de sweetalert2 completo para poder espiar Swal.fire sin tocar el módulo real.
vi.mock('sweetalert2', () => ({
  default: { fire: vi.fn() },
}));

// Nombre de archivo para el control image: satisface el validador required (el File viaja por signal).
const DUMMY_FILE_NAME = 'superman.png';
// URL de imagen existente tal como la devuelve el backend (secure_url de Cloudinary).
const CLOUDINARY_IMAGE =
  'https://res.cloudinary.com/matiasdev/image/upload/v1794609048/heroes-app/superman.jpg';

// Héroe de prueba reutilizable. Con overrides se modifica algún atributo puntual.
const createMockHero = (overrides: Partial<HeroV2> = {}): HeroV2 => ({
  _id: '1',
  slug: 'superman',
  name: 'Clark Kent',
  alias: 'Superman',
  powers: ['Vuelo', 'Super fuerza'],
  description: 'Descripción de prueba',
  team: 'Liga de la Justicia',
  image: CLOUDINARY_IMAGE,
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
  addNewHero: vi.fn().mockReturnValue(
    of({ msg: 'Hero created correctly.', response: createMockHero() }),
  ),
  uploadHeroImage: vi.fn().mockReturnValue(
    of({ msg: 'Image uploaded correctly.', response: createMockHero() }),
  ),
  editHero: vi.fn().mockReturnValue(of(createMockHero())),
  deleteHero: vi.fn(),
});

// MatChipInputEvent se usa un objeto mínimo casteado.
const createChipEvent = (value: string, clear = vi.fn()): MatChipInputEvent =>
  ({ value, chipInput: { clear } }) as unknown as MatChipInputEvent;

describe('NewHero', () => {
  let component: NewHero;
  let fixture: ComponentFixture<NewHero>;
  let router: Router;
  let heroesService!: ReturnType<typeof createHeroesServiceMock>;

  const setMode = (mode: Mode) => fixture.componentRef.setInput('mode', mode);
  const setHero = (hero: HeroV2) => fixture.componentRef.setInput('hero', hero);

  // Completa todos los campos obligatorios para que el formulario quede válido.
  const fillValidForm = (overrides: Record<string, unknown> = {}) => {
    component.heroForm.patchValue({
      name: 'Clark Kent',
      alias: 'Superman',
      status: 'Active',
      category: 'Hero',
      universe: 'DC',
      team: 'Liga de la Justicia',
      description: 'Descripción de prueba',
      powers: ['Vuelo'],
      image: DUMMY_FILE_NAME,
      ...overrides,
    });
  };

  // Simula la confirmación/cancelación del diálogo de sweetalert2.
  const mockSwalConfirmation = (isConfirmed: boolean) => {
    vi.mocked(Swal.fire).mockResolvedValue({
      isConfirmed,
      isDenied: false,
      isDismissed: !isConfirmed,
    } as SweetAlertResult);
  };

  // Espera a que se resuelvan las promesas (el .then de Swal.fire, RxJS, etc.).
  const flushMicrotasks = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

  beforeEach(async () => {
    heroesService = createHeroesServiceMock();

    await TestBed.configureTestingModule({
      imports: [NewHero],
      providers: [
        provideRouter([]),
        { provide: HeroesService, useValue: heroesService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NewHero);
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

  it('should set the image form control to the file name when the upload component emits a selection', () => {
    const file = new File(['fake'], DUMMY_FILE_NAME, { type: 'image/png' });

    component.onImageChanged({ fileName: DUMMY_FILE_NAME, file });

    // El control lleva el nombre; el archivo real queda en el signal interno y viaja al subir.
    expect(component.heroForm.get('image')?.value).toBe(DUMMY_FILE_NAME);
  });

  it('should clear the image form control when the selection is reseted', () => {
    const file = new File(['fake'], DUMMY_FILE_NAME, { type: 'image/png' });
    component.onImageChanged({ fileName: DUMMY_FILE_NAME, file });
    component.onImageChanged({ fileName: null, file: null });

    expect(component.heroForm.get('image')?.value).toBe('');
  });

  describe('poderes', () => {
    it('addPower agrega un poder al signal y al FormControl powers', () => {
      component.addPower('Fuego');

      expect(component.reactivePowersWords()).toEqual(['Fuego']);
      expect(component.heroForm.get('powers')?.value).toEqual(['Fuego']);
    });

    it('addReactivePowers recorta espacios, agrega el poder y limpia el input', () => {
      const clear = vi.fn();

      component.addReactivePowers(createChipEvent('  Fuego  ', clear));

      expect(component.reactivePowersWords()).toEqual(['Fuego']);
      expect(component.heroForm.get('powers')?.value).toEqual(['Fuego']);
      expect(clear).toHaveBeenCalled();
    });

    it('addReactivePowers no agrega un valor vacío pero igual limpia el input', () => {
      const clear = vi.fn();

      component.addReactivePowers(createChipEvent('   ', clear));

      expect(component.reactivePowersWords()).toEqual([]);
      expect(clear).toHaveBeenCalled();
    });

    it('removeReactivePowers elimina un poder y actualiza signal y FormControl', () => {
      component.addPower('Vuelo');
      component.addPower('Fuego');

      component.removeReactivePowers('Vuelo');

      expect(component.reactivePowersWords()).toEqual(['Fuego']);
      expect(component.heroForm.get('powers')?.value).toEqual(['Fuego']);
    });
  });

  it('cancelSubmit navega a /heroes', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.cancelSubmit();

    expect(navigateSpy).toHaveBeenCalledWith(['/heroes']);
  });

  describe('validaciones del formulario', () => {
    it('el formulario inicial es inválido con los errores required', () => {
      expect(component.heroForm.valid).toBe(false);
      expect(component.heroForm.get('name')?.hasError('required')).toBe(true);
      expect(component.heroForm.get('alias')?.hasError('required')).toBe(true);
      expect(component.heroForm.get('universe')?.hasError('required')).toBe(true);
      expect(component.heroForm.get('team')?.hasError('required')).toBe(true);
      expect(component.heroForm.get('description')?.hasError('required')).toBe(true);
      expect(component.heroForm.get('image')?.hasError('required')).toBe(true);
    });

    it('el formulario es válido cuando se completan los campos obligatorios', () => {
      fillValidForm();

      expect(component.heroForm.valid).toBe(true);
    });

    it('aplica los validadores maxLength en los campos de texto', () => {
      const name = component.heroForm.get('name');
      name?.setValue('x'.repeat(21));
      expect(name?.hasError('maxlength')).toBe(true);

      const alias = component.heroForm.get('alias');
      alias?.setValue('x'.repeat(21));
      expect(alias?.hasError('maxlength')).toBe(true);

      const universe = component.heroForm.get('universe');
      universe?.setValue('x'.repeat(11));
      expect(universe?.hasError('maxlength')).toBe(true);

      const team = component.heroForm.get('team');
      team?.setValue('x'.repeat(21));
      expect(team?.hasError('maxlength')).toBe(true);

      const description = component.heroForm.get('description');
      description?.setValue('x'.repeat(151));
      expect(description?.hasError('maxlength')).toBe(true);
    });

    it('onSubmit no abre el diálogo de confirmación si el formulario es inválido', () => {
      component.onSubmit();

      expect(Swal.fire).not.toHaveBeenCalled();
    });
  });

  describe('mensajes de error en el template (mat-error)', () => {
    it('muestra los mensajes required al renderizar el formulario vacío', () => {
      component.heroForm.markAllAsTouched();
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('El nombre es obligatorio');
      expect(text).toContain('El alias es obligatorio');
      expect(text).toContain('El universo es obligatorio');
      expect(text).toContain('El equipo del héroe es obligatorio');
      expect(text).toContain('La descripción del Héroe es obligatoria.');
    });

    it('muestra los mensajes de maxLength cuando se superan los límites', () => {
      component.heroForm.get('name')?.setValue('x'.repeat(21));
      component.heroForm.get('alias')?.setValue('x'.repeat(21));
      component.heroForm.get('universe')?.setValue('x'.repeat(11));
      component.heroForm.get('team')?.setValue('x'.repeat(21));
      component.heroForm.get('description')?.setValue('x'.repeat(151));
      component.heroForm.markAllAsTouched();
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('El nombre debe tener un máximo de 20 caracteres.');
      expect(text).toContain('El alias debe tener un máximo de 20 caracteres.');
      expect(text).toContain('El universo debe tener un máximo de 10 caracteres.');
      expect(text).toContain('El equipo del héroe debe tener un máximo de 20 caracteres.');
      expect(text).toContain('La descripción del Héroe debe tener un máximo de 150 caracteres.');
    });

    it('no muestra mat-error cuando el formulario es válido', () => {
      fillValidForm();

      fixture.detectChanges();

      const errors = fixture.nativeElement.querySelectorAll('mat-error');
      expect(errors.length).toBe(0);
    });
  });

  describe('límite de caracteres con onTextInput', () => {
    // Simula un evento 'input' con un target mínimamente tipado (sin 'any').
    const createInputEvent = (value: string, selectionStart = value.length): {
      event: Event;
      target: { value: string; selectionStart: number; setSelectionRange: ReturnType<typeof vi.fn> };
    } => {
      const target = { value, selectionStart, setSelectionRange: vi.fn() };
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: target });
      return { event, target };
    };

    it('recorta el texto al máximo + 1 y deja el control inválido (maxlength)', () => {
      const { event, target } = createInputEvent('x'.repeat(25));

      component.onTextInput(event, 'alias');

      expect(target.value).toBe('x'.repeat(21));
      expect(component.heroForm.get('alias')?.value).toBe('x'.repeat(21));
      expect(component.heroForm.get('alias')?.hasError('maxlength')).toBe(true);
    });

    it('no recorta cuando el texto está dentro de máximo + 1', () => {
      const { event, target } = createInputEvent('x'.repeat(21));

      component.onTextInput(event, 'alias');

      expect(target.value).toBe('x'.repeat(21));
    });

    it('muestra el mat-hint solo cuando el campo llega al máximo', () => {
      component.heroForm.get('alias')?.setValue('x'.repeat(20));
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Límite de caracteres alcanzado');
    });

    it('no muestra el mat-hint por debajo del máximo ni al superarlo', () => {
      component.heroForm.get('alias')?.setValue('x'.repeat(19));
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).not.toContain('Límite de caracteres alcanzado');

      component.heroForm.get('alias')?.setValue('x'.repeat(21));
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).not.toContain('Límite de caracteres alcanzado');
    });

    it('integración: el input no tiene maxlength nativo y recorta el DOM al tipear', () => {
      fixture.detectChanges();
      const aliasInput = fixture.nativeElement.querySelector('#heroAlias') as HTMLInputElement;
      expect(aliasInput.getAttribute('maxlength')).toBeNull();

      aliasInput.value = 'z'.repeat(30);
      aliasInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(aliasInput.value.length).toBe(21);
      expect(component.heroForm.get('alias')?.value?.length).toBe(21);
    });

    it('integración: con el alias en 21 el formulario queda inválido y Guardar se deshabilita', () => {
      fillValidForm();
      fixture.detectChanges();

      const aliasInput = fixture.nativeElement.querySelector('#heroAlias') as HTMLInputElement;
      aliasInput.value = 'x'.repeat(21);
      aliasInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.heroForm.valid).toBe(false);
      const saveButton = fixture.debugElement
        .queryAll(By.css('button'))
        .find((button) => button.nativeElement.textContent?.trim() === 'Guardar');
      expect(saveButton?.nativeElement.disabled).toBe(true);
    });
  });

  describe('modo create', () => {
    it('onSubmit llama addNewHero, refresca el grid y navega a /heroes al confirmar', async () => {
      setMode('create');
      fillValidForm();
      component.reactivePowersWords.set(['Vuelo']);
      mockSwalConfirmation(true);
      const refreshSpy = vi.spyOn(component.heroesUtilsService, 'refreshLoad');
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      component.onSubmit();
      await flushMicrotasks();

      expect(heroesService.addNewHero).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Clark Kent',
          alias: 'Superman',
          universe: 'DC',
          powers: ['Vuelo'],
          // El JSON no lleva la imagen: se sube aparte con el slug de la respuesta.
          image: '',
        }),
      );
      expect(heroesService.editHero).not.toHaveBeenCalled();
      expect(refreshSpy).toHaveBeenCalledTimes(1);
      expect(navigateSpy).toHaveBeenCalledWith(['/heroes']);
    });

    it('no llama al servicio cuando la confirmación se cancela', async () => {
      fillValidForm();
      mockSwalConfirmation(false);

      component.onSubmit();
      await flushMicrotasks();

      expect(heroesService.addNewHero).not.toHaveBeenCalled();
      expect(heroesService.editHero).not.toHaveBeenCalled();
    });

    it('onSubmit muestra el diálogo de confirmación de Swal al guardar', async () => {
      setMode('create');
      fillValidForm();
      component.reactivePowersWords.set(['Vuelo']);
      mockSwalConfirmation(true);
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      component.onSubmit();
      await flushMicrotasks();

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: I18N.form.confirmSaveTitle }),
      );
      expect(navigateSpy).toHaveBeenCalledWith(['/heroes']);
    });

    it('onSubmit muestra el diálogo de éxito cuando el guardado es exitoso', async () => {
      setMode('create');
      fillValidForm();
      component.reactivePowersWords.set(['Vuelo']);
      mockSwalConfirmation(true);
      const refreshSpy = vi.spyOn(component.heroesUtilsService, 'refreshLoad');
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      component.onSubmit();
      await flushMicrotasks();

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: I18N.form.saveSuccessTitle }),
      );
      expect(refreshSpy).toHaveBeenCalledTimes(1);
      expect(navigateSpy).toHaveBeenCalledWith(['/heroes']);
    });
  });

  describe('subida de imagen en modo create', () => {
    // Selecciona una imagen real por el canal público (onImageChanged) y devuelve el File.
    const selectImage = () => {
      const file = new File(['fake'], DUMMY_FILE_NAME, { type: 'image/png' });
      component.onImageChanged({ fileName: DUMMY_FILE_NAME, file });
      return file;
    };

    it('tras crear el héroe sube la imagen con el slug de la respuesta', async () => {
      setMode('create');
      fillValidForm();
      selectImage();
      mockSwalConfirmation(true);
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      component.onSubmit();
      await flushMicrotasks();

      expect(heroesService.uploadHeroImage).toHaveBeenCalledWith('superman', expect.any(File));
      // Orden: primero se crea el héroe y después se sube la imagen.
      const createOrder = heroesService.addNewHero.mock.invocationCallOrder[0];
      const uploadOrder = heroesService.uploadHeroImage.mock.invocationCallOrder[0];
      expect(uploadOrder).toBeGreaterThan(createOrder);
      expect(navigateSpy).toHaveBeenCalledWith(['/heroes']);
    });

    it('no sube imagen cuando no se seleccionó ningún archivo', async () => {
      setMode('create');
      fillValidForm(); // el control lleva nombre, pero no hay File por signal
      mockSwalConfirmation(true);
      vi.spyOn(router, 'navigate').mockResolvedValue(true);

      component.onSubmit();
      await flushMicrotasks();

      expect(heroesService.uploadHeroImage).not.toHaveBeenCalled();
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: I18N.form.saveSuccessTitle, icon: 'success' }),
      );
    });

    it('si la subida de imagen falla avisa con warning y igual navega al listado', async () => {
      setMode('create');
      fillValidForm();
      selectImage();
      mockSwalConfirmation(true);
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      heroesService.uploadHeroImage.mockReturnValue(
        throwError(() => new Error('Cloudinary caído')),
      );

      component.onSubmit();
      await flushMicrotasks();

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          text: I18N.form.saveImageErrorCreateText,
          icon: 'warning',
        }),
      );
      expect(navigateSpy).toHaveBeenCalledWith(['/heroes']);
    });
  });

  describe('modo edit', () => {
    it('onSubmit llama editHero con el id y los datos del formulario', async () => {
      setMode('edit');
      setHero(createMockHero());
      fixture.detectChanges(); // el effect copia el héroe al formulario
      mockSwalConfirmation(true);
      const refreshSpy = vi.spyOn(component.heroesUtilsService, 'refreshLoad');
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      component.onSubmit();
      await flushMicrotasks();

      expect(heroesService.editHero).toHaveBeenCalledWith(
        'superman',
        expect.objectContaining({ name: 'Clark Kent', alias: 'Superman' }),
      );
      expect(heroesService.addNewHero).not.toHaveBeenCalled();
      expect(refreshSpy).toHaveBeenCalledTimes(1);
      expect(navigateSpy).toHaveBeenCalledWith(['/heroes']);
    });

    it('onSubmit muestra el diálogo de confirmación de Swal al guardar en modo edit', async () => {
      setMode('edit');
      setHero(createMockHero());
      fixture.detectChanges(); // el effect copia el héroe al formulario
      mockSwalConfirmation(true);
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      component.onSubmit();
      await flushMicrotasks();

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: I18N.form.confirmSaveTitle }),
      );
      expect(navigateSpy).toHaveBeenCalledWith(['/heroes']);
    });

    it('onSubmit muestra el diálogo de éxito cuando el guardado es exitoso en modo edit', async () => {
      setMode('edit');
      setHero(createMockHero());
      fixture.detectChanges(); // el effect copia el héroe al formulario
      mockSwalConfirmation(true);
      const refreshSpy = vi.spyOn(component.heroesUtilsService, 'refreshLoad');
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      component.onSubmit();
      await flushMicrotasks();

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({ title: I18N.form.saveSuccessTitle }),
      );
      expect(refreshSpy).toHaveBeenCalledTimes(1);
      expect(navigateSpy).toHaveBeenCalledWith(['/heroes']);
    });
  });

  describe('modo view', () => {
    it('deshabilita el formulario y oculta el botón Guardar', () => {
      setMode('view');
      setHero(createMockHero());

      fixture.detectChanges();

      expect(component.heroForm.disabled).toBe(true);

      const buttonTexts = fixture.debugElement
        .queryAll(By.css('button'))
        .map((button) => button.nativeElement.textContent?.trim());
      expect(buttonTexts).not.toContain('Guardar');
    });
  });

  describe('botones Guardar y Cancelar (interacción del template)', () => {
    const getButtonByText = (text: string) =>
      fixture.debugElement
        .queryAll(By.css('button'))
        .find((button) => button.nativeElement.textContent?.trim() === text);

    it('Cancelar navega a /heroes al hacer click', () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      fixture.detectChanges();

      const cancelButton = getButtonByText('Cancelar');
      expect(cancelButton).toBeTruthy();
      cancelButton!.triggerEventHandler('click', null);

      expect(navigateSpy).toHaveBeenCalledWith(['/heroes']);
    });

    it('Guardar está deshabilitado con form inválido y no guarda', () => {
      fixture.detectChanges();

      const saveButton = getButtonByText('Guardar');
      expect(saveButton).toBeTruthy();
      expect(saveButton!.nativeElement.disabled).toBe(true);

      saveButton!.triggerEventHandler('click', null);

      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('Guardar guarda al hacer click con form válido', async () => {
      fillValidForm();
      mockSwalConfirmation(true);
      const refreshSpy = vi.spyOn(component.heroesUtilsService, 'refreshLoad');
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      fixture.detectChanges();

      const saveButton = getButtonByText('Guardar');
      expect(saveButton).toBeTruthy();
      expect(saveButton!.nativeElement.disabled).toBe(false);
      saveButton!.triggerEventHandler('click', null);
      await flushMicrotasks();

      expect(heroesService.addNewHero).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Clark Kent' }),
      );
      expect(refreshSpy).toHaveBeenCalledTimes(1);
      expect(navigateSpy).toHaveBeenCalledWith(['/heroes']);
    });
  });

  it('muestra un diálogo de error y loguea en consola cuando el servicio falla', async () => {
    fillValidForm();
    component.reactivePowersWords.set(['Vuelo']);
    mockSwalConfirmation(true);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    heroesService.addNewHero.mockReturnValue(throwError(() => new Error('Base de datos caída')));

    component.onSubmit();
    await flushMicrotasks();

    expect(errorSpy).toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: I18N.form.saveErrorTitle }));
  });
});
