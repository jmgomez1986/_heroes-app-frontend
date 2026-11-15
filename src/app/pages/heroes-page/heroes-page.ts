import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { HeroesGrid } from '../../heroes/components/heroes-grid/heroes-grid';
import { HeroesUtilsService } from '../../services/heroes-utils';

@Component({
  selector: 'app-heroes-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeroesGrid, MatButtonModule],
  templateUrl: './heroes-page.html',
})

// Para que funcione el import del lazyLoading en el ruteo, la clase hay que exportrla por 'default'
export default class HeroesPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private heroesUtilsService = inject(HeroesUtilsService);

  navigateToNewHero() {
    this.router.navigate(['/new-hero']);
  }

  /** El título actúa como Home: limpia los query params (filtros y paginación
   * vuelven a sus defaults) y la grilla vuelve a consultar al backend. */
  goToCatalogHome() {
    const urlIsClean = Object.keys(this.route.snapshot.queryParams).length === 0;
    this.router.navigate(['/heroes']);
    // Con la URL ya limpia el navigate es un no-op: el refresco forzado
    // re-dispara el GET (reutiliza el contador que ya usa el borrado de héroes).
    if (urlIsClean) {
      this.heroesUtilsService.refreshLoad();
    }
  }
}
