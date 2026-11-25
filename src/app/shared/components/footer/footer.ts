import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { I18N } from '../../i18n/es';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIcon],
  templateUrl: './footer.html',
})
export class Footer {
  // Textos del footer (S4): neutros, sin textos de rolplay.
  protected readonly catalogName = I18N.footer.catalogName;
  protected readonly copyright = I18N.footer.copyright;
}
