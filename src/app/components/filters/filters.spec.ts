import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Filters } from './filters';
import { Filters as FiltersQuery } from '../../interfaces/heroes.interface';

describe('Filters', () => {
  let component: Filters;
  let fixture: ComponentFixture<Filters>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Filters],
    }).compileComponents();

    fixture = TestBed.createComponent(Filters);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('valueChanges (filtro por nombre)', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('emite el filtro normalizado (trim) como objeto parcial para cualquier longitud', async () => {
      vi.useFakeTimers();
      const emit = vi.spyOn(component.filtersChange, 'emit');

      component.nameFilter.setValue('  ab  ');
      await vi.advanceTimersByTimeAsync(1000);

      expect(emit).toHaveBeenCalledWith({ name: 'ab' });
    });

    it('no emite cuando el control es inválido (supera el máximo de caracteres)', async () => {
      vi.useFakeTimers();
      const emit = vi.spyOn(component.filtersChange, 'emit');

      component.nameFilter.setValue('x'.repeat(25));
      expect(component.nameFilter.invalid).toBe(true);
      await vi.advanceTimersByTimeAsync(1000);

      expect(emit).not.toHaveBeenCalled();
    });
  });

  describe('valueChanges (filtro por alias)', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('emite el filtro normalizado (trim) como objeto parcial para cualquier longitud', async () => {
      vi.useFakeTimers();
      const emit = vi.spyOn(component.filtersChange, 'emit');

      component.aliasFilter.setValue('  ab  ');
      await vi.advanceTimersByTimeAsync(1000);

      expect(emit).toHaveBeenCalledWith({ alias: 'ab' });
    });

    it('no emite cuando el control es inválido (supera el máximo de caracteres)', async () => {
      vi.useFakeTimers();
      const emit = vi.spyOn(component.filtersChange, 'emit');

      component.aliasFilter.setValue('x'.repeat(25));
      expect(component.aliasFilter.invalid).toBe(true);
      await vi.advanceTimersByTimeAsync(1000);

      expect(emit).not.toHaveBeenCalled();
    });
  });

  describe('hidratación desde la URL (initialFilters)', () => {
    it('precarga los controles con los filtros de la URL sin re-emitir', async () => {
      const emit = vi.spyOn(component.filtersChange, 'emit');

      fixture.componentRef.setInput('initialFilters', {
        name: 'super',
        alias: 'man',
      } as FiltersQuery);
      await fixture.whenStable();

      expect(component.nameFilter.value).toBe('super');
      expect(component.aliasFilter.value).toBe('man');
      // La hidratación no debe disparar valueChanges (no hay loop URL → emit → URL)
      expect(emit).not.toHaveBeenCalled();
    });

    it('sincroniza los controles cuando la URL cambia (botón atrás/adelante) sin re-emitir', async () => {
      fixture.componentRef.setInput('initialFilters', { name: 'super' } as FiltersQuery);
      await fixture.whenStable();

      const emit = vi.spyOn(component.filtersChange, 'emit');
      fixture.componentRef.setInput('initialFilters', { name: 'batman' } as FiltersQuery);
      await fixture.whenStable();

      expect(component.nameFilter.value).toBe('batman');
      expect(emit).not.toHaveBeenCalled();
    });

    it('no pisa los controles cuando la URL ya coincide con lo tipeado', async () => {
      fixture.componentRef.setInput('initialFilters', { name: 'super' } as FiltersQuery);
      await fixture.whenStable();

      const emit = vi.spyOn(component.filtersChange, 'emit');
      fixture.componentRef.setInput('initialFilters', { name: 'super', alias: '' } as FiltersQuery);
      await fixture.whenStable();

      expect(component.nameFilter.value).toBe('super');
      expect(emit).not.toHaveBeenCalled();
    });
  });

  describe('límite de caracteres (onTextInput)', () => {
    // Simula un evento 'input' con un target mínimamente tipado (sin 'any').
    const createInputEvent = (
      value: string,
    ): {
      event: Event;
      target: {
        value: string;
        selectionStart: number;
        setSelectionRange: ReturnType<typeof vi.fn>;
      };
    } => {
      const target = { value, selectionStart: value.length, setSelectionRange: vi.fn() };
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: target });
      return { event, target };
    };

    it('recorta el nameFilter a máximo + 1 (21) y lo deja inválido', () => {
      const { event, target } = createInputEvent('x'.repeat(30));

      component.onTextInput(event, component.nameFilter);

      expect(target.value).toBe('x'.repeat(21));
      expect(component.nameFilter.value).toBe('x'.repeat(21));
      expect(component.nameFilter.hasError('maxlength')).toBe(true);
    });

    it('muestra el mat-hint solo cuando el filtro llega al máximo (20)', () => {
      component.nameFilter.setValue('x'.repeat(20));
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Límite de caracteres alcanzado');

      component.nameFilter.setValue('x'.repeat(19));
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).not.toContain('Límite de caracteres alcanzado');
    });

    it('integración: no tiene maxlength nativo y recorta el DOM al tipear', () => {
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('#heroName') as HTMLInputElement;
      expect(input.getAttribute('maxlength')).toBeNull();

      input.value = 'y'.repeat(25);
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(input.value.length).toBe(21);
      expect(component.nameFilter.value?.length).toBe(21);
    });
  });
});
