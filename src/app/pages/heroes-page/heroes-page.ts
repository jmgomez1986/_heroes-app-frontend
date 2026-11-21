import { ChangeDetectionStrategy, Component, computed, inject, resource } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

import { firstValueFrom } from 'rxjs';

import { HeroesGrid } from '../../heroes/components/heroes-grid/heroes-grid';
import { HeroesService } from '../../services/heroes';
import { HeroStats } from '../../heroes/components/hero-stats/hero-stats';
import { StatCardEntry, HeroesStatsDTO } from '../../interfaces/heroesStats.interface';

@Component({
  selector: 'app-heroes-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeroesGrid, HeroStats, MatIcon],
  templateUrl: './heroes-page.html',
})

// Para que funcione el import del lazyLoading en el ruteo, la clase hay que exportrla por 'default'
export default class HeroesPage {
  private heroesService = inject(HeroesService);

  /** Datos de GET /heroes/stats vía resource (misma convención que la grilla).
   * En error (endpoint inexistente, servidor caído) no hay hasValue(): la sección
   * de contadores se oculta sin error visible ni console.error. */
  private readonly heroStatsResource = resource<HeroesStatsDTO, unknown>({
    loader: () => firstValueFrom(this.heroesService.getStats()),
  });

  /** La sección de stats solo se muestra con datos reales del backend. */
  readonly showStats = computed(() => this.heroStatsResource.hasValue());

  /** Entradas para el renderer escalable (app-hero-stats): una card "Total de
   * personajes" por ahora; agregar contadores nuevos es agregar entradas acá. */
  readonly statsEntries = computed<StatCardEntry[]>(() => {
    if (!this.heroStatsResource.hasValue()) return [];
    const stats = this.heroStatsResource.value();
    return [
      {
        label: 'Total de personajes',
        value: stats.total_elements,
        sub: 'Total de Héroes del catálogo.',
        icon: 'groups',
        chips: [
          // Mismo estilo de chips de categoría que usan las cards de la grilla.
          { label: `${stats.total_heroes} Héroes`, classes: 'bg-green-100 text-green-700' },
          { label: `${stats.total_villains} Villanos`, classes: 'bg-red-100 text-red-700' },
        ],
      },
      {
        label: 'Total de personajes Activos',
        value: stats.total_active,
        sub: 'Héroes activos al día de la fecha.',
        icon: 'check_circle',
        chips: [],
      },
      {
        label: 'Total de personajes Inactivos',
        sub: 'Héroes que ya no prestan sus servicios.',
        value: stats.total_inactive,
        icon: 'pause',
        chips: [],
      },
      {
        label: 'Total de personajes Fallecidos',
        sub: 'Héroes que ya no están entre nosotros.',
        value: stats.total_deceased,
        icon: 'person_off',
        chips: [],
      },
    ];
  });
}
