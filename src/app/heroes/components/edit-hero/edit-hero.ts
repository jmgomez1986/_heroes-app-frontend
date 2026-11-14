import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import NewHero from '../new-hero/new-hero';
import { HeroV2 } from '../../../interfaces/heroes.interface';
import { Mode } from '../../../interfaces/shared.interface';

@Component({
  selector: 'app-edit-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NewHero],
  templateUrl: './edit-hero.html',
})
export default class EditHero {
  hero = input<HeroV2>();
  mode = input<Mode>('edit');
}
