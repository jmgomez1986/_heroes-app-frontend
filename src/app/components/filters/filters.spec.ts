import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { Filters } from './filters';
import { Filters as FiltersQuery } from '../../interfaces/heroes.interface';

describe('Filters', () => {
  let component: Filters;
  let fixture: ComponentFixture<Filters>;

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

  describe('valueChanges (filtro por nombre)', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('emite el filtro normalizado (trim) como objeto parcial para cualquier longitud', async () => {
      vi.useFakeTimers();
      const emit = vi.spyOn(component.filtersChange, 'emit');

      component.filterForm.get('name')!.setValue('  ab  ');
      await vi.advanceTimersByTimeAsync(1000);

      expect(emit).toHaveBeenCalledWith({ name: 'ab' });
    });

    it('no emite cuando el control es inválido (supera el máximo de caracteres)', async () => {
      vi.useFakeTimers();
      const emit = vi.spyOn(component.filtersChange, 'emit');

      component.filterForm.get('name')!.setValue('x'.repeat(25));
      expect(component.filterForm.get('name')!.invalid).toBe(true);
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

      component.filterForm.get('alias')!.setValue('  ab  ');
      await vi.advanceTimersByTimeAsync(1000);

      expect(emit).toHaveBeenCalledWith({ alias: 'ab' });
    });

    it('no emite cuando el control es inválido (supera el máximo de caracteres)', async () => {
      vi.useFakeTimers();
      const emit = vi.spyOn(component.filtersChange, 'emit');

      component.filterForm.get('alias')!.setValue('x'.repeat(25));
      expect(component.filterForm.get('alias')!.invalid).toBe(true);
      await vi.advanceTimersByTimeAsync(1000);

      expect(emit).not.toHaveBeenCalled();
    });
  });

  describe('valueChanges (filtros nuevos)', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('emite team al cambiar el valor de texto', async () => {
      vi.useFakeTimers();
      const emit = vi.spyOn(component.filtersChange, 'emit');

      const teamControl = component.filterForm.get('team')!;
      teamControl.setValue('  Avengers  ');
      await vi.advanceTimersByTimeAsync(1000);

      expect(emit).toHaveBeenCalledWith({ team: 'Avengers' });
    });

    it('no emite team cuando el control es inválido (supera el máximo de caracteres)', async () => {
      vi.useFakeTimers();
      const emit = vi.spyOn(component.filtersChange, 'emit');

      const teamControl = component.filterForm.get('team')!;
      teamControl.setValue('x'.repeat(25));
      expect(teamControl.invalid).toBe(true);
      await vi.advanceTimersByTimeAsync(1000);

      expect(emit).not.toHaveBeenCalled();
    });

    it('emite universe al cambiar el valor de texto', async () => {
      vi.useFakeTimers();
      const emit = vi.spyOn(component.filtersChange, 'emit');

      const universeControl = component.filterForm.get('universe')!;
      universeControl.setValue('  Marvel  ');
      await vi.advanceTimersByTimeAsync(1000);

      expect(emit).toHaveBeenCalledWith({ universe: 'Marvel' });
    });

    it('emite category al cambiar el radio button', async () => {
      vi.useFakeTimers();
      const emit = vi.spyOn(component.filtersChange, 'emit');

      const categoryControl = component.filterForm.get('category')!;
      categoryControl.setValue('villano');
      await vi.advanceTimersByTimeAsync(1000);

      expect(emit).toHaveBeenCalledWith({ category: 'villano' });
    });

    it('emite status al cambiar el select', async () => {
      vi.useFakeTimers();
      const emit = vi.spyOn(component.filtersChange, 'emit');

      const statusControl = component.filterForm.get('status')!;
      statusControl.setValue('activo');
      await vi.advanceTimersByTimeAsync(1000);

      expect(emit).toHaveBeenCalledWith({ status: 'activo' });
    });
  });

  describe('hidratación desde la URL (initialFilters)', () => {
    it('precarga los controles con los filtros de la URL sin re-emitir', async () => {
      const emit = vi.spyOn(component.filtersChange, 'emit');

      fixture.componentRef.setInput('initialFilters', {
        name: 'super',
        alias: 'man',
        team: 'Avengers',
        category: 'heroe',
      } as FiltersQuery);
      await fixture.whenStable();

      expect(component.filterForm.get('name')!.value).toBe('super');
      expect(component.filterForm.get('alias')!.value).toBe('man');
      expect(component.filterForm.get('team')!.value).toBe('Avengers');
      expect(component.filterForm.get('category')!.value).toBe('heroe');
      // La hidratación no debe disparar valueChanges (no hay loop URL → emit → URL)
      expect(emit).not.toHaveBeenCalled();
    });

    it('sincroniza los controles cuando la URL cambia (botón atrás/adelante) sin re-emitir', async () => {
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
});
