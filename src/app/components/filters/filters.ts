import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { HeroErrorStateMatcher } from '../../shared/error-state-matcher';
import { HeroesUtilsService } from '../../services/heroes-utils';
import { FilterFieldConfig, FiltersQuery } from '../../interfaces/heroesFilters.interface';

@Component({
  selector: 'app-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
  ],
  templateUrl: './filters.html',
})
export class Filters {
  matcher = new HeroErrorStateMatcher();
  // Inyeccion de la referencia de destruccion para la desubcripcion
  private destroyRef = inject(DestroyRef);
  private readonly heroesUtilsService = inject(HeroesUtilsService);

  readonly panelOpenState = signal(false);

  /** Configuración de campos de filtro. Agregar un filtro nuevo = agregar una entrada aquí. */
  readonly filterConfig = input<FilterFieldConfig[]>([
    {
      id: 'name',
      label: 'Nombre a buscar:',
      placeholder: 'Ingrese el nombre del Héroe',
      type: 'text',
      maxLength: 20,
    },
    {
      id: 'alias',
      label: 'Alias a buscar:',
      placeholder: 'Ingrese el alias del Héroe',
      type: 'text',
      maxLength: 20,
    },
    {
      id: 'team',
      label: 'Equipo:',
      placeholder: 'Ingrese el equipo del Héroe',
      type: 'text',
      maxLength: 20,
    },
    {
      id: 'universe',
      label: 'Universo:',
      placeholder: 'Ingrese el universo del Héroe',
      type: 'text',
      maxLength: 20,
    },
    {
      id: 'category',
      label: 'Categoría:',
      placeholder: 'Seleccione una categoría',
      type: 'radio',
      options: [
        { label: 'Todos', value: 'all', default: true },
        { label: 'Héroe', value: 'hero', default: false },
        { label: 'Villano', value: 'villain', default: false },
        { label: 'Anti-héroe', value: 'anti-hero', default: false },
      ],
    },
    {
      id: 'status',
      label: 'Estado:',
      placeholder: 'Seleccione un estado',
      type: 'select',
      options: [
        { label: 'Activo', value: 'active', default: false },
        { label: 'Inactivo', value: 'inactive', default: false },
        { label: 'Fallecido', value: 'deceased', default: false },
      ],
    },
  ]);

  /**
   * FormGroup con un FormControl por cada campo de filterConfig.
   * Los controles se crean en la declaración para que estén disponibles
   * desde el primer ciclo de detección.
   */
  readonly filterForm = new FormGroup<Partial<Record<keyof FiltersQuery, FormControl<string>>>>(
    (() => {
      const controls: Record<string, FormControl<string>> = {};
      for (const field of this.filterConfig()) {
        const validators = field.maxLength ? [Validators.maxLength(field.maxLength)] : [];
        controls[field.id] = new FormControl('', validators) as FormControl<string>;
      }
      return controls as Partial<Record<keyof FiltersQuery, FormControl<string>>>;
    })(),
  );

  /** Valores iniciales desde la URL: la grilla los pasa al montar y al volver atrás/adelante. */
  initialFilters = input<FiltersQuery>({});

  /** Emite el filtro aplicado ya normalizado (trim), como objeto parcial: { name } o { alias }. */
  filtersChange = output<Partial<FiltersQuery>>();
  refreshHeroes = output<void>();

  constructor() {
    // Hidratación desde la URL con emitEvent: false: actualiza el control sin
    // re-disparar valueChanges (no hay loop URL -> setValue -> emit -> navigate).
    // Si el valor ya coincide no se toca, para no pisar lo que el usuario está tipeando.
    effect(() => {
      const initial = this.initialFilters();
      this.filterConfig().forEach((field) => {
        const control = this.filterForm.get(field.id)!;
        const initialValue = initial[field.id] ?? '';
        if (control.value !== initialValue) {
          control.setValue(initialValue, { emitEvent: false });
        }
      });
    });
  }

  /**
   * Devuelve el FormControl de un campo del config. Los controles se crean en
   * la declaración de filterForm a partir de filterConfig, así que siempre
   * existen para los ids declarados ahí.
   */
  getControl(fieldId: keyof FiltersQuery): FormControl<string> {
    return this.filterForm.get(fieldId) as FormControl<string>;
  }

  /**
   * Limita la escritura de los inputs a maxLength + 1 caracteres. Al superar el máximo,
   * el validador maxLength invalida el control y la búsqueda no se emite
   * (ver HeroesUtilsService.enforceMaxLength).
   * Solo aplica a campos de tipo 'text'.
   */
  onTextInput(event: Event, fieldId: keyof FiltersQuery): void {
    const control = this.getControl(fieldId);
    const field = this.filterConfig().find((f) => f.id === fieldId);
    if (field?.type === 'text' && field.maxLength) {
      this.heroesUtilsService.enforceMaxLength(event, control, field.maxLength);
    }
  }

  applyFilters(): void {
    this.filtersChange.emit(this.filterForm.value);
  }

  resetFilters(): void {
    this.filterConfig().forEach((field) => {
      const control = this.filterForm.get(field.id)!;
      const value = field.type === 'radio' ? 'all' : '';
      // emitEvent reemplaza el valor que el debounce todavía no aplicó,
      // así un texto a medio tipear no vuelve a la URL después de limpiar.
      if (control.value !== '') {
        control.setValue(value);
      }
    });
    this.refreshHeroes.emit();
  }
}
