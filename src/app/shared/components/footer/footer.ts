import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIcon],
  templateUrl: './footer.html',
})
export class Footer {
  // Textos del footer (S4): neutros, sin textos de rolplay.
  protected readonly catalogName = 'Heroes App — Catálogo de Superhéroes';
  protected readonly copyright = '© 2026 Heroes App. Todos los derechos reservados.';
}
