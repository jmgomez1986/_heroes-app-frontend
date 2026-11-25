import { ChangeDetectionStrategy, Component, computed, inject, resource } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

import { firstValueFrom } from 'rxjs';

import { HeroesGrid } from '../../heroes/components/heroes-grid/heroes-grid';
import { HeroesService } from '../../services/heroes';
import { HeroStats } from '../../heroes/components/hero-stats/hero-stats';
import { StatCardEntry, HeroesStatsDTO } from '../../interfaces/heroesStats.interface';
import { I18N } from '../../shared/i18n/es';

@Component({
  selector: 'app-heroes-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeroesGrid, HeroStats, MatIcon],
  templateUrl: './heroes-page.html',
})

// Para que funcione el import del lazyLoading en el ruteo, la clase hay que exportrla por 'default'
export default class HeroesPage {
  readonly i18nTexts = I18N;

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
        id: 1,
        title: this.i18nTexts.stats.totalTitle,
        titleMobile: this.i18nTexts.stats.totalMobileTitle,
        subtitle: this.i18nTexts.stats.totalSubtitle,
        value: stats.total_elements,
        icon: 'groups',
        chips: [
          // Mismo estilo de chips de categoría que usan las cards de la grilla.
          {
            label: `${stats.total_heroes} ${this.i18nTexts.stats.totalHeroes}`,
            classes: 'bg-green-100 text-green-700',
          },
          {
            label: `${stats.total_villains} ${this.i18nTexts.stats.totalVillains}`,
            classes: 'bg-red-100 text-red-700',
          },
        ],
      },
      {
        id: 2,
        title: this.i18nTexts.stats.totalActiveTitle,
        titleMobile: this.i18nTexts.stats.totalActiveMobileTitle,
        subtitle: this.i18nTexts.stats.totalActiveSubtitle,
        value: stats.total_active,
        icon: 'check_circle',
        chips: [],
      },
      {
        id: 3,
        title: this.i18nTexts.stats.totalInactiveTitle,
        titleMobile: this.i18nTexts.stats.totalInactiveMobileTitle,
        subtitle: this.i18nTexts.stats.totalInactiveSubtitle,
        value: stats.total_inactive,
        icon: 'pause',
        chips: [],
      },
      {
        id: 4,
        title: this.i18nTexts.stats.totalDeceasedTitle,
        titleMobile: this.i18nTexts.stats.totalDeceasedMobileTitle,
        subtitle: this.i18nTexts.stats.totalDeceasedSubtitle,
        value: stats.total_deceased,
        icon: 'person_off',
        chips: [],
      },
    ];
  });
}
