import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import NewHero from '../../heroes/components/new-hero/new-hero';
import { I18N } from '../../shared/i18n/es';
import { Mode } from '../../constants/defaultValues';

@Component({
  selector: 'app-new-hero-page',
  imports: [NewHero],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './new-hero-page.html',
})
export default class NewHeroPage {
  readonly i18nTexts = I18N;
  mode = input<Mode>('create');
}
