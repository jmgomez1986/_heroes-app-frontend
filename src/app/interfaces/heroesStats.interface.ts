import { HeroStatsResponse } from './heroes.interface';

export type HeroesStatsDTO = HeroStatsResponse;

/** Chip dentro de una stat card: el color viaja en los datos (classes de Tailwind). */
export interface StatCardChip {
  label: string;
  classes: string;
}

/** Entrada de datos de una stat card. Todos los campos salvo label/value son opcionales:
 * agregar una card nueva es solo agregar una entrada al array (renderer escalable). */
export interface StatCardEntry {
  id: number;
  title: string;
  titleMobile?: string;
  subtitle: string;
  value: string | number;
  icon?: string;
  chips?: StatCardChip[];
}
