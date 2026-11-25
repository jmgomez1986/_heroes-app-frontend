/** Máximos de caracteres por campo de texto (única fuente de verdad para validador y template). */
export type Mode = 'create' | 'edit' | 'view';
/** Nombres de los campos de texto con límite de caracteres. */
export type TextFieldName = 'name' | 'alias' | 'universe' | 'team' | 'description';

export const MAX_LENGTHS: Record<TextFieldName, number> = {
  name: 20,
  alias: 20,
  universe: 10,
  team: 20,
  description: 150,
};

/** Formatos de imagen permitidos (JPG, JPEG y PNG). */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
/** Tamaño máximo de la imagen original: 1 MB. */
export const MAX_IMAGE_SIZE = 1 * 1024 * 1024;

/** Imagen de reserva para hero sin imagen o con URL rota (servida desde public/images). */
export const PLACEHOLDER_IMAGE = '/images/placeholder.svg';

export type ImageState = 'loading' | 'loaded' | 'error';
