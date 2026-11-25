import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { StatCardEntry } from '../../../interfaces/heroesStats.interface';
import { I18N } from '../../../shared/i18n/es';

@Component({
  selector: 'app-hero-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './hero-stats.html',
})

/** Renderer genérico de stat cards: una card por entrada del input, sin lógica de
 * negocio adentro (los datos ya llegan armados, incluidas las clases de los chips).
 * Grilla responsive: 1 columna en mobile, 3 desde sm. */
export class HeroStats {
  readonly i18nTexts = I18N;
  readonly stats = input<StatCardEntry[]>([]);
  
  formatCompactChip = (label: string): string => {
    const [count, word] = label.trim().split(/\s+/);
    const initial = word?.[0]?.toUpperCase() ?? '';
    return `${count}${initial}`;
  };
}
