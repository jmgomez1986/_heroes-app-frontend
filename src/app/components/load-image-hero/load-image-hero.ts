import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { Hero } from '../../interfaces/heroes.interface';
import { Mode } from '../../interfaces/shared.interface';

/** Selección de imagen emitida al padre: archivo crudo y nombre del archivo. */
export interface HeroImageSelection {
  fileName: string | null;
  file: File | null;
}

/** Formatos de imagen permitidos (JPG, JPEG y PNG). */
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
/** Tamaño máximo de la imagen original: 1 MB. */
const MAX_IMAGE_SIZE = 1 * 1024 * 1024;

/** Id único por instancia: el componente puede usarse más de una vez en la misma vista. */
let nextImageInputId = 0;

@Component({
  selector: 'app-load-image-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './load-image-hero.html',
})
export class LoadImageHero {
  readonly hero = input<Hero>();
  readonly mode = input<Mode>('create');

  /** Emite la imagen seleccionada (archivo crudo + nombre). Emite con valores null al reiniciar. */
  readonly selectionChange = output<HeroImageSelection>();

  /** Id único del input: permite que el <label> lo asocie sin colisiones entre instancias. */
  readonly inputId = `hero-image-input-${nextImageInputId++}`;

  readonly isView = computed(() => this.mode() === 'view');

  /** Object URL del preview actual; se revoca al reemplazarlo para liberar memoria. */
  private objectUrl: string | null = null;
  /** Imagen local del preview: object URL del archivo seleccionado (vacío si no hay selección). */
  private readonly localPreviewImage = signal('');

  /**
   * Imagen del panel de preview: la selección local tiene prioridad; si no hay, la imagen
   * existente del héroe (edit/view). En create sin selección queda vacía (placeholder).
   */
  readonly previewImage = computed(() => this.localPreviewImage() || this.hero()?.image || '');

  /** Texto alternativo del preview: nombra al héroe cuando se conoce. */
  readonly previewAlt = computed(() => {
    const alias = this.hero()?.alias;
    return alias ? `Vista previa de ${alias}` : 'Vista previa del héroe';
  });

  /** Clases de la dropzone: el hover y el cursor solo aplican cuando se puede elegir archivo. */
  readonly dropzoneClasses = computed(() =>
    this.isView()
      ? 'group relative flex flex-1 min-h-0 flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-4 text-center'
      : 'group relative flex flex-1 min-h-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-4 text-center transition-all hover:border-indigo-600 hover:bg-zinc-100 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2',
  );

  /** Mensaje de error de validación visible (formatos y tamaño); vacío si no hay error. */
  readonly errorMessage = signal('');

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // Libera el object URL pendiente al destruir el componente.
    this.destroyRef.onDestroy(() => {
      if (this.objectUrl) {
        URL.revokeObjectURL(this.objectUrl);
        this.objectUrl = null;
      }
    });
  }

  /** Se ejecuta cuando el usuario selecciona un archivo de imagen. */
  onFileSelect(event: Event): void {
    const element = event.target as HTMLInputElement;
    const file = element.files?.[0];

    // Si se canceló el cuadro de diálogo no hay archivo que procesar.
    if (!file) {
      return;
    }

    // Validación de formato: solo JPG, JPEG y PNG.
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      element.value = '';
      this.failSelection('Formato no permitido: selecciona un archivo PNG o JPG.');
      return;
    }

    // Validación de tamaño: máximo 1 MB.
    if (file.size > MAX_IMAGE_SIZE) {
      element.value = '';
      this.failSelection('La imagen supera el tamaño máximo de 1 MB.');
      return;
    }

    this.errorMessage.set('');
    this.setPreview(file);
    this.selectionChange.emit({ fileName: file.name, file });
  }

  /** Guarda el object URL del archivo y lo usa como preview, revocando el anterior. */
  private setPreview(file: File): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
    this.objectUrl = URL.createObjectURL(file);
    this.localPreviewImage.set(this.objectUrl);
  }

  /** Descarta la selección inválida, limpia el preview y avisa al padre. */
  private failSelection(message: string): void {
    this.errorMessage.set(message);
    this.resetImage();
  }

  /** Reinicia el estado de la imagen y notifica al padre con valores nulos. */
  private resetImage(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.localPreviewImage.set('');
    this.selectionChange.emit({ fileName: null, file: null });
  }
}
