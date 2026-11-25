import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { I18N } from '../../shared/i18n/es';
import { translate } from '../../shared/i18n/translate';

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
  private readonly heroesUtilsService = inject(HeroesUtilsService);

  readonly i18n = I18N;
  translate = translate;

  readonly panelOpenState = signal(false);

  /** Configuración de campos de filtro. Agregar un filtro nuevo = agregar una entrada aquí. */
  readonly filterConfig = input<FilterFieldConfig[]>([
    {
      id: 'name',
      type: 'text',
      label: `${this.i18n.fieldsLabel.heroName}`,
      placeholder: `${this.i18n.placeholders.name}`,
      maxLength: 20,
    },
    {
      id: 'alias',
      type: 'text',
      label: `${this.i18n.fieldsLabel.heroAlias}`,
      placeholder: `${this.i18n.placeholders.alias}`,
      maxLength: 20,
    },
    {
      id: 'team',
      label: `${this.i18n.fieldsLabel.heroTeam}`,
      placeholder: `${this.i18n.placeholders.team}`,
      type: 'text',
      maxLength: 20,
    },
    {
      id: 'universe',
      type: 'text',
      label: `${this.i18n.fieldsLabel.heroUniverse}`,
      placeholder: `${this.i18n.placeholders.universe}`,
      maxLength: 20,
    },
    {
      id: 'category',
      type: 'radio',
      label: `${this.i18n.fieldsLabel.heroCategory}`,

      options: [
        { label: this.i18n.heroCategory.all, value: 'all', default: true },
        { label: this.i18n.heroCategory.hero, value: 'hero', default: false },
        { label: this.i18n.heroCategory.villain, value: 'villain', default: false },
        { label: this.i18n.heroCategory.antiHero, value: 'anti-hero', default: false },
      ],
    },
    {
      id: 'status',
      type: 'select',
      label: `${this.i18n.fieldsLabel.heroStatus}`,
      options: [
        { label: this.i18n.heroStatus.active, value: 'active', default: false },
        { label: this.i18n.heroStatus.inactive, value: 'inactive', default: false },
        { label: this.i18n.heroStatus.deceased, value: 'deceased', default: false },
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
        const initialValue = field.type === 'radio' ? this.defaultValueOf(field) : '';
        controls[field.id] = new FormControl(initialValue, validators) as FormControl<string>;
      }
      return controls as Partial<Record<keyof FiltersQuery, FormControl<string>>>;
    })(),
  );

  /** Valores iniciales desde la URL: la grilla los pasa al montar y al volver atrás/adelante. */
  initialFilters = input<FiltersQuery>({});

  /** Último valor del form. La hidratación usa emitEvent: false, así que no lo dispara. */
  private readonly formValue = toSignal(this.filterForm.valueChanges, {
    initialValue: this.filterForm.value,
  });

  /** En los radios, el valor default ("Todos") equivale a no filtrar. */
  private defaultValueOf(field: FilterFieldConfig): string {
    return field.options?.find((opt) => opt.default)?.value ?? '';
  }

  /** "Todos" y el valor vacío son el mismo estado: sin filtro. */
  private normalizedValue(field: FilterFieldConfig, value: string | undefined): string {
    return field.type === 'radio' && value === this.defaultValueOf(field) ? '' : (value ?? '');
  }

  /** Hay cambios cuando el form difiere de los filtros hidratados desde la URL. */
  readonly hasChanges = computed(() => {
    const current = this.formValue();
    const initial = this.initialFilters();
    return this.filterConfig().some(
      (field) =>
        this.normalizedValue(field, current[field.id]) !==
        this.normalizedValue(field, initial[field.id]),
    );
  });

  /** Emite el valor del form al aplicar; la grilla se encarga de recortar y omitir vacíos. */
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
        const initialValue =
          field.type === 'radio' && !initial[field.id]
            ? this.defaultValueOf(field)
            : (initial[field.id] ?? '');
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
    if (this.filterForm.invalid || !this.hasChanges()) {
      return;
    }
    this.panelOpenState.set(false);
    this.filtersChange.emit(this.filterForm.value);
  }

  resetFilters(): void {
    this.filterConfig().forEach((field) => {
      const control = this.filterForm.get(field.id)!;
      const value = field.type === 'radio' ? this.defaultValueOf(field) : '';
      // Al escribir el valor se actualiza formValue y, con él, hasChanges.
      if (control.value !== value) {
        control.setValue(value);
      }
    });
    this.panelOpenState.set(false);
    this.refreshHeroes.emit();
  }
}
