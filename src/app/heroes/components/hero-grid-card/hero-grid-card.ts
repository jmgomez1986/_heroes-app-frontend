import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';

import { Hero } from '../../../interfaces/heroes.interface';
import { HeroesService } from '../../../services/heroes';
import { HeroImage } from '../../../components/hero-image/hero-image';
import { MatIcon } from '@angular/material/icon';
import { LoadingOverlay } from '../../../shared/components/loading-overlay/loading-overlay';
import { I18N } from '../../../shared/i18n/es';

/** Claves válidas del diccionario de estados. */
type HeroStatusKey = keyof typeof I18N.heroStatus;
/** Claves válidas del diccionario de categorias. */
type HeroCategoryKey = keyof typeof I18N.heroCategory;

@Component({
  selector: 'app-hero-grid-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatButtonModule, MatChipsModule, MatIcon, HeroImage, LoadingOverlay],
  templateUrl: './hero-grid-card.html',
})
export class HeroGridCard {
  readonly i18n = I18N;
  hero = input.required<Hero>();
  isPriorityImg = input<boolean>(false);
  heroDeleted = output<void>();
  /** Marca que hay un DELETE en vuelo: bloquea el botón Eliminar y muestra el overlay. */
  readonly isDeleting = signal(false);
  // Services
  readonly heroesService = inject(HeroesService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  deleteHero() {
    Swal.fire({
      title: I18N.alerts.confirmDeleteTitle,
      text: I18N.alerts.confirmDeleteText,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: this.i18n.buttons.delete,
      cancelButtonText: this.i18n.buttons.cancel,
    }).then((result) => {
      if (result.isConfirmed) {
        this.isDeleting.set(true);
        this.heroesService
          .deleteHero(this.hero().slug)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.isDeleting.set(false);
              Swal.fire({
                title: I18N.alerts.deleteSuccessTitle,
                text: I18N.alerts.deleteSuccessText,
                icon: 'success',
              });
              this.heroDeleted.emit();
            },
            error: (err) => {
              this.isDeleting.set(false);
              console.error('No se pudo eliminar el héroe:', err);
              Swal.fire({
                title: I18N.alerts.deleteErrorTitle,
                text: I18N.alerts.deleteErrorText,
                icon: 'error',
              });
            },
          });
      }
    });
  }

  editHero() {
    this.router.navigate([`/edit-hero/${this.hero().slug}`]);
  }
  viewHero() {
    this.router.navigate([`/view-hero/${this.hero().slug}`]);
  }
  /**
   * Devuelve el texto traducido del estado del héroe.
   * Normaliza a minúsculas para coincidir con las claves de heroStatusTexts
   * y hace fallback al valor crudo si no encuentra coincidencia.
   */
  getStatusText(status: string): string {
    const key = status.toLowerCase() as HeroStatusKey;
    return key in this.i18n.heroStatus ? this.i18n.heroStatus[key] : status;
  }
  /**
   * Devuelve el texto traducido de la categoría del héroe.
   * Normaliza a minúsculas para coincidir con las claves de heroCategoryTexts
   * y hace fallback al valor crudo si no encuentra coincidencia.
   */
  getCategoryText(category: string): string {
    const key = category.toLowerCase() as HeroCategoryKey;
    return key in this.i18n.heroCategory ? this.i18n.heroCategory[key] : category;
  }
}
