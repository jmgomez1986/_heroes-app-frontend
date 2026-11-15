import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { HeroErrorStateMatcher } from '../../shared/error-state-matcher';
import { HeroesUtilsService } from '../../services/heroes-utils';
import { Filters as FiltersQuery } from '../../interfaces/heroes.interface';

@Component({
  selector: 'app-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
  ],
  templateUrl: './filters.html',
})
export class Filters {
  matcher = new HeroErrorStateMatcher();
  // Largo máximo de los filtros de texto.
  readonly FILTER_MAX_LENGTH = 20;
  // Inyeccion de la referencia de destruccion para la desubcripcion
  private destroyRef = inject(DestroyRef);
  private readonly heroesUtilsService = inject(HeroesUtilsService);
  // FormControl para el filtrado por nombre. El debounce (en el constructor) evita
  // llamadas redundantes mientras se escribe; no hay mínimo de caracteres.
  readonly nameFilter = new FormControl('', [Validators.maxLength(this.FILTER_MAX_LENGTH)]);
  readonly aliasFilter = new FormControl('', [Validators.maxLength(this.FILTER_MAX_LENGTH)]);

  /** Valores iniciales desde la URL: la grilla los pasa al montar y al volver atrás/adelante. */
  initialFilters = input<FiltersQuery>({});

  /** Emite el filtro aplicado ya normalizado (trim), como objeto parcial: { name } o { alias }. */
  filtersChange = output<Partial<FiltersQuery>>();

  constructor() {
    // Hidratación desde la URL con emitEvent: false: actualiza el control sin
    // re-disparar valueChanges (no hay loop URL → setValue → emit → navigate).
    // Si el valor ya coincide no se toca, para no pisar lo que el usuario está tipeando.
    effect(() => {
      const initial = this.initialFilters();
      if (this.nameFilter.value !== (initial.name ?? '')) {
        this.nameFilter.setValue(initial.name ?? '', { emitEvent: false });
      }
      if (this.aliasFilter.value !== (initial.alias ?? '')) {
        this.aliasFilter.setValue(initial.alias ?? '', { emitEvent: false });
      }
    });

    this.nameFilter.valueChanges
      .pipe(
        debounceTime(1000),
        map((value) => value?.trim() ?? ''),
        // Se emite el query normalizado siempre que el control sea válido.
        filter(() => this.nameFilter.valid),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((query) => {
        this.filtersChange.emit({ name: query });
      });

    this.aliasFilter.valueChanges
      .pipe(
        debounceTime(1000),
        map((value) => value?.trim() ?? ''),
        // Se emite el query normalizado siempre que el control sea válido
        filter(() => this.aliasFilter.valid),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((query) => {
        this.filtersChange.emit({ alias: query });
      });
  }

  /**
   * Limita la escritura de los inputs a maxLength + 1 caracteres. Al superar el máximo,
   * el validador maxLength invalida el control y la búsqueda no se emite
   * (ver HeroesUtilsService.enforceMaxLength).
   */
  onTextInput(event: Event, control: AbstractControl): void {
    this.heroesUtilsService.enforceMaxLength(event, control, this.FILTER_MAX_LENGTH);
  }
}
