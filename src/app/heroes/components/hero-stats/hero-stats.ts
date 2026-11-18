import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Chip dentro de una stat card: el color viaja en los datos (classes de Tailwind). */
export interface StatCardChip {
  label: string;
  classes: string;
}

/** Entrada de datos de una stat card. Todos los campos salvo label/value son opcionales:
 * agregar una card nueva es solo agregar una entrada al array (renderer escalable). */
export interface StatCardEntry {
  label: string;
  value: string | number;
  icon?: string;
  chips?: StatCardChip[];
  sub?: string;
}

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
  readonly stats = input<StatCardEntry[]>([]);
}
