import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  imports: [HeroesGrid, HeroStats],
  templateUrl: './heroes-page.html',
})

// Para que funcione el import del lazyLoading en el ruteo, la clase hay que exportrla por 'default'
export default class HeroesPage {
  private heroesService = inject(HeroesService);

  /** Datos de GET /heroes/stats. null = request falló o el endpoint no existe
   * todavía: la sección de contadores se oculta (degradación silenciosa). */
  private readonly heroStatsData = signal<HeroStatsDto | null>(null);

  /** La sección de stats solo se muestra con datos reales del backend. */
  readonly showStats = computed(() => this.heroStatsData() !== null);

  /** Entradas para el renderer escalable (app-hero-stats): una card "Total de
   * personajes" por ahora; agregar contadores nuevos es agregar entradas acá. */
  readonly statsEntries = computed<StatCardEntry[]>(() => {
    const stats = this.heroStatsData();
    if (!stats) return [];
    return [
      {
        label: 'Total de personajes',
        value: stats.total,
        icon: 'groups',
        chips: [
          // Mismo estilo de chips de categoría que usan las cards de la grilla.
          { label: `${stats.heroes} Héroes`, classes: 'bg-green-100 text-green-700' },
          { label: `${stats.villains} Villanos`, classes: 'bg-red-100 text-red-700' },
        ],
      },
    ];
  });

  constructor() {
    // Si el GET /heroes/stats falla (endpoint inexistente, servidor caído) la sección
    // se oculta sin error visible ni console.error: el fallo queda solo en la request.
    this.heroesService
      .getStats()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (stats) => this.heroStatsData.set(stats),
        // Degradación silenciosa: no hay datos, no hay sección.
        error: () => {},
      });
  }
}
