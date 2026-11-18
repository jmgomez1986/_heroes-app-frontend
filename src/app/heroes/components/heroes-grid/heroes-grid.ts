import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  resource,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import {
  Filters as FiltersQuery,
  GetHeroesResponse,
  HeroesGridResourceParams,
} from '../../../interfaces/heroes.interface';
import { HeroesService } from '../../../services/heroes';
import { HeroGridCard } from '../hero-grid-card/hero-grid-card';
import { HeroCountSelector } from '../hero-count-selector/hero-count-selector';
import { HeroesUtilsService } from '../../../services/heroes-utils';
import { Filters } from '../../../components/filters/filters';
import {
  DEFAULT_ITEMS_PER_PAGE,
  DEFAULT_PAGE,
  MAX_ITEMS_PER_PAGE,
} from '../../../shared/pagination.constants';
import { I18N } from '../../../shared/i18n/es';

@Component({
  selector: 'app-heroes-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeroGridCard,
    HeroCountSelector,
    Filters,
    ReactiveFormsModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './heroes-grid.html',
})
export class HeroesGrid {
  // Services
  readonly heroesService = inject(HeroesService);
  readonly heroesUtilsService = inject(HeroesUtilsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  /** La URL es la única fuente de verdad de la vista: filtros y paginación viajan
   * en query params (compartir el link y recargar el navegador reproducen la vista). */
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  /** Objeto único de filtros (vista de la URL): solo los filtros con valor. */
  readonly filters = computed<FiltersQuery>(() => {
    const params = this.queryParams();
    const name = params.get('name')?.trim();
    const alias = params.get('alias')?.trim();
    const filters: FiltersQuery = {};
    if (name) filters.name = name;
    if (alias) filters.alias = alias;
    return filters;
  });

  /** Página y tamaño desde la URL, sanitizados contra los límites del backend
   * (ver shared/pagination.constants.ts). */
  readonly currentPage = computed(() => {
    const page = Number(this.queryParams().get('page'));
    return Number.isInteger(page) && page >= DEFAULT_PAGE ? page : DEFAULT_PAGE;
  });

  readonly pageSize = computed(() => {
    const size = Number(this.queryParams().get('elements_per_page'));
    return Number.isInteger(size) && size >= 1 && size <= MAX_ITEMS_PER_PAGE
      ? size
      : DEFAULT_ITEMS_PER_PAGE;
  });

  /** Límite del backend expuesto al template para las opciones del paginador. */
  protected readonly maxItemsPerPage = MAX_ITEMS_PER_PAGE;

  /** Pill "Mostrando X de Y héroes": X = items de la página actual, Y = total del backend.
   * undefined mientras carga o en error (el pill se oculta en esos estados).
   * hasValue() evita leer value() en estado de error: leerlo ahí lanza un ResourceValueError. */
  readonly countSummary = computed<{ shown: number; total: number } | undefined>(() => {
    if (!this.heroesResource.hasValue() || this.heroesResource.isLoading()) return undefined;
    const resp = this.heroesResource.value();
    return { shown: resp.data.length, total: resp.total_elements };
  });

  /**
   * El resource delega en el servicio: este arma los query params de paginación
   * y filtros (solo los filtros con valor) contra el backend real.
   */
  heroesResource = resource({
    params: (): HeroesGridResourceParams => ({
      page: this.currentPage(),
      size: this.pageSize(),
      query: this.filters(),
      refreshKey: this.heroesUtilsService.refreshHeroesGrid(),
    }),
    loader: async ({ params }): Promise<GetHeroesResponse> => {
      return await firstValueFrom(
        this.heroesService.getHeroes(params.page, params.size, params.query),
      );
    },
  });

  constructor() {
    // Caso límite: al borrar el último elemento de una página avanzada, la página
    // actual puede quedar fuera de rango (respuesta con data vacía pero items > 0).
    // Retrocede a la última página con datos (o a la 1 si no quedan resultados)
    // escribiendo la URL, para que la grilla no muestre "sin resultados" habiendo
    // datos en otras páginas.
    effect(() => {
      // hasValue() evita leer value() en estado de error: leerlo ahí lanza
      // un ResourceValueError y rompería el ciclo de detección de cambios.
      const resp = this.heroesResource.hasValue() ? this.heroesResource.value() : undefined;
      if (resp && resp.data.length === 0 && this.currentPage() > 1) {
        this.goToPage(Math.max(DEFAULT_PAGE, resp.total_pages));
      }
    });

    // Error del GET (ej: servidor caído): aviso con Swal y la grilla cae al estado
    // vacío; el spinner solo corresponde a una carga genuina. El error persiste
    // hasta el próximo reload, así que el aviso se dispara una vez por error.
    effect(() => {
      const error = this.heroesResource.error();
      if (!error) return;
      console.error('No se pudo cargar el catálogo de héroes:', error);
      Swal.fire({
        title: I18N.heroes.grid.loadErrorTitle,
        text: I18N.heroes.grid.loadErrorText,
        icon: 'error',
      });
    });
  }

  /** Escribe los filtros en la URL (la serialización vive en navigate): filtrar
   * vuelve a la página 1, y page/size viajan explícitos (URL canónica). */
  applyFilters(partial: Partial<FiltersQuery>): void {
    this.navigate({ ...partial, page: DEFAULT_PAGE, elements_per_page: this.pageSize() });
  }

  /** Paginación también escribe la URL; los defaults viajan explícitos. */
  handlePageEvent(e: PageEvent): void {
    this.navigate({ page: e.pageIndex + 1, elements_per_page: e.pageSize });
  }

  /** Cambio de tamaño de página desde el selector superior: vuelve a la página 1
   * (un tamaño nuevo invalida la página actual) y escribe la URL canónica. */
  handlePageSizeChange(size: number): void {
    this.navigate({ page: DEFAULT_PAGE, elements_per_page: size });
  }

  refreshHeroes() {
    this.heroesResource.reload();
  }

  private goToPage(page: number): void {
    this.navigate({ page, elements_per_page: this.pageSize() });
  }

  /** Único punto de escritura de la vista en la URL: acá se decide una sola vez cómo
   * se serializa. Los números (page, elements_per_page) viajan siempre, explícitos
   * también en sus defaults; los filtros de texto viajan recortados, y vacíos llegan
   * como undefined al router para que el merge los BORRE de la URL (ej: se limpió
   * el filtro con la X). merge preserva el resto de los params y replaceUrl evita
   * que debounce/paginación ensucien el historial. */
  private navigate(queryParams: Record<string, string | number | undefined>): void {
    const serialized: Record<string, string | number | undefined> = {};
    for (const [key, value] of Object.entries(queryParams)) {
      if (typeof value === 'number') {
        serialized[key] = value;
      } else {
        const trimmed = typeof value === 'string' ? value.trim() : '';
        // Vacío o undefined → borra el param del merge; nunca se "preserva"
        serialized[key] = trimmed || undefined;
      }
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: serialized,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
