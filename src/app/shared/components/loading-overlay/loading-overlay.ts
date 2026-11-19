import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/** Overlay con spinner: bloquea la interacción sobre el contenido debajo mientras
 * se muestra. Se usa durante requests en vuelo (guardar, eliminar, etc.) para
 * evitar que el usuario dispare acciones concurrentes. */
@Component({
  selector: 'app-loading-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule],
  templateUrl: './loading-overlay.html',
  styleUrl: './loading-overlay.scss',
})
export class LoadingOverlay {
  readonly show = input<boolean>(false);
}
