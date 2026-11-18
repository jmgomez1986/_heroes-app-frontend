import { ChangeDetectionStrategy, Component, computed, inject, resource } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

import { firstValueFrom } from 'rxjs';

import { HeroesGrid } from '../../heroes/components/heroes-grid/heroes-grid';
import {
  HeroStats,
  StatCardEntry,
} from '../../heroes/components/hero-stats/hero-stats';
import { HeroesService } from '../../services/heroes';
import { HeroStats as HeroStatsDto } from '../../interfaces/heroes.interface';

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
  private readonly heroStatsResource = resource<HeroStatsDto, unknown>({
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
        icon: 'groups',
        chips: [
          // Mismo estilo de chips de categoría que usan las cards de la grilla.
          { label: `${stats.total_heroes} Héroes`, classes: 'bg-green-100 text-green-700' },
          { label: `${stats.total_villains} Villanos`, classes: 'bg-red-100 text-red-700' },
        ],
      },
    ];
  });
}
