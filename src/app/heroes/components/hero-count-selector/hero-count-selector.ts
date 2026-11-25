import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { I18N } from '../../../shared/i18n/es';

/**
 * Componente reutilizable de resumen de catálogo: pill "Mostrando X de Y" +
 * selector de items por página, en una sola fila sobre la grilla.
 * Escalable: recibe los datos por inputs y emite el cambio de tamaño de página;
 * no conoce el backend ni la URL (eso lo hace el contenedor).
 */
@Component({
  selector: 'app-hero-count-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatIconModule, MatSelectModule],
  templateUrl: './hero-count-selector.html',
})
export class HeroCountSelector {
  readonly paginatorTexts = I18N.paginator;
  readonly countPillTexts = I18N.countPill;
  readonly commonText = I18N.common;
  /** Items de la página actual. null mientras carga o en error: el pill se oculta. */
  readonly shown = input<number | null, number | null | undefined>(null, {
    // El binding del padre puede llegar undefined (Angular no siempre lo normaliza):
    // se unifica en null para que el template tenga una sola condición.
    transform: (value) => value ?? null,
  });

  /** Total de resultados del backend (respeta el filtro actual). null mientras carga o en error. */
  readonly total = input<number | null, number | null | undefined>(null, {
    transform: (value) => value ?? null,
  });

  /** Tamaño de página actual y opciones (el contenedor respeta el límite del backend). */
  readonly pageSize = input.required<number>();
  readonly pageSizeOptions = input.required<number[]>();

  /** Emite el nuevo tamaño de página elegido por el usuario. */
  readonly pageSizeChange = output<number>();
}
