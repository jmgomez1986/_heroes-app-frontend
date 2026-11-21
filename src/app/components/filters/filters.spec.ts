import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { Filters } from './filters';
import { FiltersQuery } from '../../interfaces/heroesFilters.interface';

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
      categoryControl.setValue('villain');
      await vi.advanceTimersByTimeAsync(1000);

      expect(emit).toHaveBeenCalledWith({ category: 'villain' });
    });

    it('emite status al cambiar el select', async () => {
      vi.useFakeTimers();
      const emit = vi.spyOn(component.filtersChange, 'emit');

      const statusControl = component.filterForm.get('status')!;
      statusControl.setValue('active');
      await vi.advanceTimersByTimeAsync(1000);

      expect(emit).toHaveBeenCalledWith({ status: 'active' });
    });
  });

  describe('resetFilters', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('limpia textos, select y radios, pide recargar y no reaplica lo que estaba en debounce', async () => {
      vi.useFakeTimers();
      const filtersEmit = vi.spyOn(component.filtersChange, 'emit');
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

      await vi.advanceTimersByTimeAsync(1000);

      expect(filtersEmit).toHaveBeenCalledWith({ name: '' });
      expect(filtersEmit).toHaveBeenCalledWith({ category: 'all' });
      expect(filtersEmit).toHaveBeenCalledWith({ status: '' });
      expect(filtersEmit).not.toHaveBeenCalledWith({ name: 'batman' });
      expect(filtersEmit).not.toHaveBeenCalledWith({ category: 'hero' });
    });
  });

  describe('hidratación desde la URL (initialFilters)', () => {
    it('precarga los controles con los filtros de la URL sin re-emitir', async () => {
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

  describe('botón Limpiar filtros', () => {
    it('renderiza el botón, no muestra "Aplicar filtros" y ejecuta resetFilters al hacer click', async () => {
      const buttons = Array.from(
        fixture.nativeElement.querySelectorAll('button'),
      ) as HTMLButtonElement[];
      const button = buttons.find((b) => b.textContent?.trim() === 'Limpiar filtros');
      expect(button).toBeDefined();
      expect(button?.textContent?.trim()).toBe('Limpiar filtros');
      expect(fixture.nativeElement.textContent).not.toContain('Aplicar filtros');

      const resetSpy = vi.spyOn(component, 'resetFilters');
      button?.click();
      await fixture.whenStable();

      expect(resetSpy).toHaveBeenCalledOnce();
    });
  });

  describe('X del select de estado', () => {
    it('limpia el estado al hacer click en la X', async () => {
      component.filterForm.get('status')!.setValue('active');
      fixture.detectChanges();

      const buttons = Array.from(
        fixture.nativeElement.querySelectorAll('button'),
      ) as HTMLButtonElement[];
      const clearButton = buttons.find((b) => b.getAttribute('aria-label') === 'Limpiar estado');
      expect(clearButton).toBeDefined();

      clearButton?.click();
      await fixture.whenStable();

      expect(component.filterForm.get('status')!.value).toBe('');
    });
  });
});
