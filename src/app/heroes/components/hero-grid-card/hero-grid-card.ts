import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
} from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';

import { HeroV2 } from '../../../interfaces/heroes.interface';
import { HeroesService } from '../../../services/heroes';
import { HeroImage } from '../../../components/hero-image/hero-image';
import { MatIcon } from '@angular/material/icon';
import { I18N } from '../../../shared/i18n/es';

@Component({
  selector: 'app-hero-grid-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatButtonModule, MatChipsModule, MatIcon, HeroImage],
  templateUrl: './hero-grid-card.html',
})
export class HeroGridCard {
  hero = input.required<HeroV2>();
  isPriorityImg = input<boolean>(false);
  heroDeleted = output<void>();
  // Services
  readonly heroesService = inject(HeroesService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  deleteHero() {
    Swal.fire({
      title: I18N.heroes.card.confirmDeleteTitle,
      text: I18N.heroes.card.confirmDeleteText,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: I18N.heroes.card.confirmButton,
      cancelButtonText: I18N.heroes.card.cancelButton,
    }).then((result) => {
      if (result.isConfirmed) {
        this.heroesService
          .deleteHero(this.hero()._id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              Swal.fire({
                title: I18N.heroes.card.deleteSuccessTitle,
                text: I18N.heroes.card.deleteSuccessText,
                icon: 'success',
              });
              this.heroDeleted.emit();
            },
            error: (err) => {
              console.error('No se pudo eliminar el héroe:', err);
              Swal.fire({
                title: I18N.heroes.card.deleteErrorTitle,
                text: I18N.heroes.card.deleteErrorText,
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
}
