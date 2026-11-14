import { ChangeDetectionStrategy, Component, inject, input, resource } from '@angular/core';
import { HeroesService } from '../../services/heroes';
import { firstValueFrom } from 'rxjs';
import EditHero from '../../heroes/components/edit-hero/edit-hero';
import { Mode } from '../../interfaces/shared.interface';

@Component({
  selector: 'app-edit-hero-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EditHero],
  templateUrl: './edit-hero-page.html',
})
export default class EditHeroPage {
  heroSlug = input.required<string>();
  /** El modo ('edit' | 'view') es enlazado por el router (withComponentInputBinding)
   * desde el data de la ruta. */
  mode = input<Mode>('edit');
  // Services
  readonly heroesService = inject(HeroesService);

  heroeResource = resource({
    params: (): { heroSlug: string } => ({
      heroSlug: this.heroSlug(),
    }),
    loader: async () => {
      return await firstValueFrom(this.heroesService.getHeroBySlug(this.heroSlug()));
    },
  });
}
