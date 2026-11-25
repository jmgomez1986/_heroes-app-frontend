import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { BreadcrumbSegment } from '../../../interfaces/heroes.interface';
import { I18N } from '../../i18n/es';
import { translate } from '../../i18n/translate';

@Component({
  selector: 'app-breadcrumb',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIcon],
  templateUrl: './breadcrumb.html',
})
export class Breadcrumb {
  readonly i18n = I18N;
  private readonly router = inject(Router);

  // Cada NavigationEnd produce un nuevo valor en la señal: el computed de
  // segmentos se recalcula con la URL vigente (incluye redirects).
  private readonly navigationEnd = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    ),
    { initialValue: null },
  );

  protected readonly segments = computed(() =>
    this.buildSegments(this.navigationEnd()?.urlAfterRedirects ?? this.router.url),
  );

  /**
   * El alias se deriva del slug (capitalizado, guiones por espacios) a
   * propósito: traer el héroe aquí duplicaría la petición que ya hace la
   * página de consulta/edición. Si el slug no distingue el alias al 100%,
   * se acepta la pérdida de precisión a cambio de no duplicar el request.
   */
  private slugToLabel(slug: string): string {
    return slug
      .split('-')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private buildSegments(url: string): BreadcrumbSegment[] {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const parts = cleanUrl.split('/').filter(Boolean);

    // Catálogo = Home (decisión del usuario): '/' y '/heroes' son el mismo segmento.
    if (parts.length === 0 || parts[0] === 'heroes') {
      return [{ label: I18N.breadcrumb.catalogLabel, link: null }];
    }

    const [route, param] = parts;
    const catalog: BreadcrumbSegment = { label: I18N.breadcrumb.catalogLabel, link: '/heroes' };

    switch (route) {
      case 'new-hero':
        return [catalog, { label: I18N.breadcrumb.newHeroLabel, link: null }];
      case 'view-hero':
        return [
          catalog,
          {
            label: translate(I18N.breadcrumb.viewHeroLabel, {
              heroSlug: this.slugToLabel(param ?? ''),
            }),
            link: null,
          },
        ];
      case 'edit-hero':
        return [
          catalog,
          {
            label: translate(I18N.breadcrumb.editHeroLabel, {
              heroSlug: this.slugToLabel(param ?? ''),
            }),
            link: null,
          },
        ];
      default:
        return [{ label: I18N.breadcrumb.catalogLabel, link: null }];
    }
  }
}
