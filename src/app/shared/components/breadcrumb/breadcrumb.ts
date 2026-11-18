import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { MatIcon } from '@angular/material/icon';

/**
 * Segmento del breadcrumb: los anteriores son links navegables y el actual
 * (link null) se muestra como texto plano.
 */
interface BreadcrumbSegment {
  label: string;
  link: string | null;
}

@Component({
  selector: 'app-breadcrumb',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIcon],
  templateUrl: './breadcrumb.html',
})
export class Breadcrumb {
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
      return [{ label: 'Catálogo', link: null }];
    }

    const [route, param] = parts;
    const catalog: BreadcrumbSegment = { label: 'Catálogo', link: '/heroes' };

    switch (route) {
      case 'new-hero':
        return [catalog, { label: 'Nuevo Héroe', link: null }];
      case 'view-hero':
        return [catalog, { label: `Consultar: ${this.slugToLabel(param ?? '')}`, link: null }];
      case 'edit-hero':
        return [catalog, { label: `Editar: ${this.slugToLabel(param ?? '')}`, link: null }];
      default:
        return [{ label: 'Catálogo', link: null }];
    }
  }
}
