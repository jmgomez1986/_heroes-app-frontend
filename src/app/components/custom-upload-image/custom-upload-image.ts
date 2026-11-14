import { ChangeDetectionStrategy, Component, output, signal, input, effect } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

/** Selección de imagen emitida por el componente: base64 de la imagen y nombre del archivo. */
export interface CustomUploadImageSelection {
  fileName: string | null;
  base64: string | null;
}

@Component({
  selector: 'app-custom-upload-image',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './custom-upload-image.html',
  styleUrl: './custom-upload-image.scss',
})
export class CustomUploadImage {
  // Signals
  mode = input<string>('create');
  heroImage = input<string>('');
  /** Previsualización de la imagen seleccionada (data URL). */
  readonly imagePreview = signal<string | null>(null);
  /** Nombre del archivo seleccionado (nombre.extension). */
  readonly imageFileName = signal<string | null>(null);
  /** Control "solo lectura" del campo: muestra el nombre y maneja los errores de validación. */
  readonly imageNameControl = new FormControl<string>({ value: '', disabled: true });

  /** Formatos de imagen permitidos (JPG, JPEG y PNG). */
  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
  /** Tamaño máximo de la imagen original: 1 MB. */
  private readonly MAX_IMAGE_SIZE = 1 * 1024 * 1024;

  /** Emite la imagen seleccionada (base64 + nombre). Emite con valores null al reiniciar. */
  readonly selectionChange = output<CustomUploadImageSelection>();

  constructor() {
    effect(() => {
      const image = this.heroImage();
      // Imagen existente del backend: secure_url completa de Cloudinary o vacia.
      // La URL va tal cual al preview; el input muestra solo el nombre del archivo.
      // El effect depende unicamente de heroImage: no lee las senales que escribe,
      // para no pisar el estado de una seleccion de archivo en curso.
      if (image) {
        const fileName = decodeURIComponent(image.split('/').pop() ?? 'Imagen existente');
        this.imagePreview.set(image);
        this.imageFileName.set(fileName);
        this.imageNameControl.setValue(fileName);
      } else {
        this.imagePreview.set(null);
        this.imageFileName.set(null);
        this.imageNameControl.setValue('');
      }
    });
  }

  onFileSelect(event: Event): void {
    const element = event.target as HTMLInputElement;
    const file = element.files?.[0];

    // Si se canceló el cuadro de diálogo no hay archivo que procesar
    if (!file) {
      return;
    }

    // Validación de formato: solo JPG, JPEG y PNG
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      console.warn('Formato de imagen no permitido:', file.type);
      element.value = '';
      this.resetImage('invalidType');
      return;
    }

    // Validación de tamaño: máximo 1 MB
    if (file.size > this.MAX_IMAGE_SIZE) {
      console.warn(`La imagen supera el tamaño máximo de 1 MB (${file.size} bytes)`);
      element.value = '';
      this.resetImage('maxSize');
      return;
    }

    // Se guarda el nombre del archivo para mostrarlo en la UI
    this.imageFileName.set(file.name);
    this.imageNameControl.setValue(file.name);
    this.imageNameControl.setErrors(null);
    this.imageNameControl.markAsTouched();

    // Se limpia el input para poder volver a seleccionar el mismo archivo
    element.value = '';

    // Se lee la imagen tal cual con FileReader, se muestra el preview y se emite al padre
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.imagePreview.set(dataUrl);
      this.selectionChange.emit({ fileName: file.name, base64: dataUrl });
    };
    reader.onerror = () => {
      console.error('No se pudo leer el archivo de imagen.');
      this.resetImage(null);
    };
    reader.readAsDataURL(file);
  }

  /**
   * Reinicia el estado de la imagen, opcionalmente marcando un error de validación.
   * @param errorType 'invalidType' (formato no permitido) | 'maxSize' (supera 1 MB) | null (sin error)
   */
  private resetImage(errorType: 'invalidType' | 'maxSize' | null): void {
    this.imageFileName.set(null);
    this.imageNameControl.setValue('');

    if (errorType) {
      this.imageNameControl.setErrors({ [errorType]: true });
      this.imageNameControl.markAsTouched();
    } else {
      this.imageNameControl.setErrors(null);
    }

    this.imagePreview.set(null);
    this.selectionChange.emit({ fileName: null, base64: null });
  }
}
