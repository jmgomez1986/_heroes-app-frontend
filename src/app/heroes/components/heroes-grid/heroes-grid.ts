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
import { HeroesUtilsService } from '../../../services/heroes-utils';
import { Filters } from '../../../components/filters/filters';
import {
  DEFAULT_ITEMS_PER_PAGE,
  DEFAULT_PAGE,
  MAX_ITEMS_PER_PAGE,
} from '../../../shared/pagination.constants';

@Component({
  selector: 'app-heroes-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeroGridCard,
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
      const resp = this.heroesResource.value();
      if (resp && resp.data.length === 0 && this.currentPage() > 1) {
        this.goToPage(Math.max(DEFAULT_PAGE, resp.total_pages));
      }
    });
  }

  /** Escribe los filtros en la URL: los vacíos no viajan y al filtrar se vuelve a la página 1. */
  applyFilters(partial: Partial<FiltersQuery>): void {
    const queryParams: Record<string, string | number | undefined> = {};
    for (const [key, value] of Object.entries(partial)) {
      queryParams[key] = value?.trim() || undefined; // vacío → fuera de la URL
    }
    queryParams['page'] = undefined; // nuevo filtro → página 1 (default, no viaja)
    this.navigate(queryParams);
  }

  /** Paginación también escribe la URL; page=1 y el size default no viajan. */
  handlePageEvent(e: PageEvent): void {
    const page = e.pageIndex + 1;
    this.navigate({
      page: page > DEFAULT_PAGE ? page : undefined,
      elements_per_page: e.pageSize !== DEFAULT_ITEMS_PER_PAGE ? e.pageSize : undefined,
    });
  }

  refreshHeroes() {
    this.heroesResource.reload();
  }

  private goToPage(page: number): void {
    this.navigate({ page: page > DEFAULT_PAGE ? page : undefined });
  }

  /** Único punto de escritura de la vista en la URL: merge para no perder el resto
   * de los params y replaceUrl para que debounce/paginación no ensucien el historial. */
  private navigate(queryParams: Record<string, string | number | undefined>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
