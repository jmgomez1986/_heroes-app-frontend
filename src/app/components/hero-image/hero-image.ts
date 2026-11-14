import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

/** Imagen de reserva para hero sin imagen o con URL rota (servida desde public/images). */
const PLACEHOLDER_IMAGE = '/images/placeholder.svg';

type ImageState = 'loading' | 'loaded' | 'error';

/**
 * Componente de solo lectura para mostrar la imagen de un hero (secure_url completa de Cloudinary o vacía).
 * Estados: skeleton mientras carga, imagen al cargar, y placeholder ante URL rota o imagen vacía.
 * El contenedor padre debe tener tamaño definido (ej: `aspect-[3/4]`), este componente lo llena.
 * Para la subida/preview de un archivo local usar `custom-upload-image` (responsabilidad distinta).
 */
@Component({
  selector: 'app-hero-image',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage],
  templateUrl: './hero-image.html',
})
export class HeroImage {
  /** Imagen del hero: secure_url completa de Cloudinary o string vacío. */
  image = input<string>('');
  /** Nombre del hero para el texto alternativo. */
  name = input<string>('');
  /** Prioriza la carga (preconnect) para las imágenes visibles en el primer render. */
  priority = input<boolean>(false);

  readonly placeholder = PLACEHOLDER_IMAGE;

  /**
   * Estado de la imagen, reiniciado a `loading` cada vez que cambia la imagen de entrada
   * (linkedSignal): al reciclar una card para otro hero no se conserva el estado anterior.
   */
  imageState = linkedSignal<string, ImageState>({
    source: this.image,
    computation: () => 'loading',
  });

  altText = computed(() => (this.name() ? `Imagen de ${this.name()}` : 'Imagen no disponible'));

  /** Placeholder si no hay imagen o si la carga falló. */
  showPlaceholder = computed(() => !this.image() || this.imageState() === 'error');

  /** Skeleton solo mientras una imagen real está en curso de carga. */
  showSkeleton = computed(() => !!this.image() && this.imageState() === 'loading');
}
