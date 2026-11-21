import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { Filters } from './filters';
import { FiltersQuery } from '../../interfaces/heroesFilters.interface';

describe('Filters', () => {
  let component: Filters;
  let fixture: ComponentFixture<Filters>;

  const buttons = () =>
    Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
  const buttonWithText = (text: string) => buttons().find((b) => b.textContent?.includes(text));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Filters],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(Filters);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('applyFilters', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('emite el valor completo del form al hacer click en Aplicar filtros', async () => {
      const emit = vi.spyOn(component.filtersChange, 'emit');
      component.filterForm.get('name')!.setValue('batman');
      component.filterForm.get('status')!.setValue('active');
      fixture.detectChanges();

      const applyButton = buttonWithText('Aplicar filtros');
      expect(applyButton).toBeDefined();
      applyButton?.click();
      await fixture.whenStable();

      expect(emit).toHaveBeenCalledOnce();
      expect(emit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'batman', status: 'active' }),
      );
    });

    it('no emite al cambiar un control sin hacer click (ni con el debounce viejo)', async () => {
      vi.useFakeTimers();
      const emit = vi.spyOn(component.filtersChange, 'emit');

      component.filterForm.get('name')!.setValue('batman');
      await vi.advanceTimersByTimeAsync(1000);

      expect(emit).not.toHaveBeenCalled();
    });

    it('no emite cuando el form es inválido', () => {
      const emit = vi.spyOn(component.filtersChange, 'emit');
      component.filterForm.get('name')!.setValue('x'.repeat(21));

      component.applyFilters();

      expect(emit).not.toHaveBeenCalled();
    });

    it('no emite cuando no hay cambios', () => {
      const emit = vi.spyOn(component.filtersChange, 'emit');

      component.applyFilters();

      expect(emit).not.toHaveBeenCalled();
    });

    it('deshabilita Aplicar filtros cuando no hay cambios', () => {
      fixture.detectChanges();

      expect(buttonWithText('Aplicar filtros')?.disabled).toBe(true);
    });

    it('deshabilita Aplicar filtros cuando la URL trae category=all', async () => {
      fixture.componentRef.setInput('initialFilters', { category: 'all' } as FiltersQuery);
      await fixture.whenStable();
      fixture.detectChanges();

      expect(buttonWithText('Aplicar filtros')?.disabled).toBe(true);
    });

    it('deshabilita Aplicar filtros cuando el form es inválido', () => {
      component.filterForm.get('name')!.setValue('x'.repeat(21));
      fixture.detectChanges();

      expect(buttonWithText('Aplicar filtros')?.disabled).toBe(true);
    });

    it('habilita Aplicar filtros cuando hay cambios y el form es válido', () => {
      component.filterForm.get('name')!.setValue('batman');
      fixture.detectChanges();

      expect(buttonWithText('Aplicar filtros')?.disabled).toBe(false);
    });
  });

  describe('resetFilters', () => {
    it('limpia textos, select y radios y pide recargar', () => {
      const refreshEmit = vi.spyOn(component.refreshHeroes, 'emit');

      component.filterForm.get('name')!.setValue('batman');
      component.filterForm.get('alias')!.setValue('murcielago');
      component.filterForm.get('team')!.setValue('liga');
      component.filterForm.get('universe')!.setValue('dc');
      component.filterForm.get('category')!.setValue('hero');
      component.filterForm.get('status')!.setValue('active');

      component.resetFilters();

      expect(component.filterForm.get('name')!.value).toBe('');
      expect(component.filterForm.get('alias')!.value).toBe('');
      expect(component.filterForm.get('team')!.value).toBe('');
      expect(component.filterForm.get('universe')!.value).toBe('');
      expect(component.filterForm.get('category')!.value).toBe('all');
      expect(component.filterForm.get('status')!.value).toBe('');
      expect(refreshEmit).toHaveBeenCalledOnce();
    });
  });

  describe('hidratación desde la URL (initialFilters)', () => {
    it('precarga los controles con los filtros de la URL sin emitir', async () => {
      const emit = vi.spyOn(component.filtersChange, 'emit');

      fixture.componentRef.setInput('initialFilters', {
        name: 'super',
        alias: 'man',
        team: 'Avengers',
      } as FiltersQuery);
      await fixture.whenStable();

      expect(component.filterForm.get('name')!.value).toBe('super');
      expect(component.filterForm.get('alias')!.value).toBe('man');
      expect(component.filterForm.get('team')!.value).toBe('Avengers');
      fixture.componentRef.setInput('initialFilters', {
        universe: 'DC',
        category: 'hero',
        status: 'active',
      } as FiltersQuery);
      await fixture.whenStable();
      expect(component.filterForm.get('universe')!.value).toBe('DC');
      expect(component.filterForm.get('category')!.value).toBe('hero');
      expect(component.filterForm.get('status')!.value).toBe('active');
      expect(emit).not.toHaveBeenCalled();
    });

    it('sincroniza los controles cuando la URL cambia (botón atrás/adelante) sin emitir', async () => {
      fixture.componentRef.setInput('initialFilters', { name: 'super' } as FiltersQuery);
      await fixture.whenStable();

      const emit = vi.spyOn(component.filtersChange, 'emit');
      fixture.componentRef.setInput('initialFilters', { name: 'batman' } as FiltersQuery);
      await fixture.whenStable();

      expect(component.filterForm.get('name')!.value).toBe('batman');
      expect(emit).not.toHaveBeenCalled();
    });

    it('no pisa los controles cuando la URL ya coincide con lo tipeado', async () => {
      fixture.componentRef.setInput('initialFilters', { name: 'super' } as FiltersQuery);
      await fixture.whenStable();

      const emit = vi.spyOn(component.filtersChange, 'emit');
      fixture.componentRef.setInput('initialFilters', { name: 'super', alias: '' } as FiltersQuery);
      await fixture.whenStable();

      expect(component.filterForm.get('name')!.value).toBe('super');
      expect(emit).not.toHaveBeenCalled();
    });
  });

  describe('límite de caracteres (onTextInput)', () => {
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

      component.onTextInput(event, 'name');

      expect(target.value).toBe('x'.repeat(21));
      expect(component.filterForm.get('name')!.value).toBe('x'.repeat(21));
      expect(component.filterForm.get('name')!.hasError('maxlength')).toBe(true);
    });

    it('recorta el teamFilter a máximo + 1 (21) y lo deja inválido', () => {
      const { event, target } = createInputEvent('x'.repeat(30));

      component.onTextInput(event, 'team');

      expect(target.value).toBe('x'.repeat(21));
      expect(component.filterForm.get('team')!.value).toBe('x'.repeat(21));
      expect(component.filterForm.get('team')!.hasError('maxlength')).toBe(true);
    });

    it('muestra el aviso de límite solo cuando el filtro llega al máximo (20)', () => {
      component.filterForm.get('name')!.setValue('x'.repeat(20));
      expect(component.filterForm.get('name')!.value?.length).toBe(20);

      component.filterForm.get('name')!.setValue('x'.repeat(19));
      expect(component.filterForm.get('name')!.value?.length).toBe(19);
    });
  });

  describe('X de los campos', () => {
    it('limpia el input de texto al hacer click', async () => {
      fixture.componentRef.setInput('initialFilters', { name: 'batman' } as FiltersQuery);
      await fixture.whenStable();

      const clearButton = buttons().find(
        (b) => b.getAttribute('aria-label') === 'Limpiar búsqueda',
      );
      expect(clearButton).toBeDefined();
      clearButton?.click();

      expect(component.filterForm.get('name')!.value).toBe('');
    });

    it('limpia el estado al hacer click en la X del select', () => {
      component.filterForm.get('status')!.setValue('active');
      fixture.detectChanges();

      const clearButton = buttons().find((b) => b.getAttribute('aria-label') === 'Limpiar estado');
      expect(clearButton).toBeDefined();

      clearButton?.click();

      expect(component.filterForm.get('status')!.value).toBe('');
    });
  });

  describe('botón Limpiar filtros', () => {
    it('ejecuta resetFilters al hacer click', () => {
      const resetSpy = vi.spyOn(component, 'resetFilters');
      const clearButton = buttonWithText('Limpiar filtros');
      expect(clearButton).toBeDefined();

      clearButton?.click();

      expect(resetSpy).toHaveBeenCalledOnce();
    });
  });

  describe('panelOpenState', () => {
    it('se actualiza con los eventos opened y closed del expansion panel', () => {
      const panel = fixture.nativeElement.querySelector('mat-expansion-panel');
      expect(panel).not.toBeNull();

      panel.dispatchEvent(new Event('opened'));
      expect(component.panelOpenState()).toBe(true);

      panel.dispatchEvent(new Event('closed'));
      expect(component.panelOpenState()).toBe(false);
    });
  });

  describe('radio por defecto', () => {
    it('marca la opción Todos', () => {
      fixture.detectChanges();

      const radios = Array.from(
        fixture.nativeElement.querySelectorAll('input[type="radio"]'),
      ) as HTMLInputElement[];
      expect(radios.length).toBe(4);
      expect(radios[0].checked).toBe(true);
      expect(radios[1].checked).toBe(false);
    });
  });
});
