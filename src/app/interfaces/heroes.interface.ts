export interface Filters {
  name?: string;
  alias?: string;
}

export interface Hero {
  _id: string;
  name: string;
  alias: string;
  slug: string;
  powers: string[];
  description: string;
  team: string;
  image: string;
  status: string;
  category: string;
  universe: string;
}

/**
 * Payload editable de un héroe: `_id` y `slug` los genera el backend.
 * En el alta viaja completo; en el PATCH `name` se omite (es inmutable).
 */
export type HeroPayload = Omit<Hero, '_id' | 'slug'>;

export interface HeroesGridResourceParams {
  page: number;
  size: number;
  query: Filters;
  refreshKey: number;
}

// Respuesta real del backend al obtener el catalogo de heroes (GET /heroes)
export interface GetHeroesResponse {
  total_pages: number;
  current_page: number;
  elements_per_page: number;
  total_elements: number;
  data: Hero[];
}

// Respuesta real del backend al crear un héroe (POST /heroes)
export interface NewHeroResponse {
  msg: string;
  response: Hero;
}

// Respuesta real del backend al editar un héroe (PATCH /heroes/:slug)
export interface EditHeroResponse {
  msg: string;
  response: Hero;
}

// Respuesta real del backend al subir la imagen de un héroe (POST /heroes/:slug/image)
export interface UploadImageResponse {
  msg: string;
  response: Hero;
}

// Respuesta real del backend al eliminar un héroe (DELETE /heroes/:slug)
export interface DeleteHeroResponse {
  msg: string;
}

// Respuesta real del backend con los contadores del catalogo (GET /heroes/stats).
// Los totales cuentan por category: total_heroes y total_villains.
export interface HeroStats {
  total_elements: number;
  total_heroes: number;
  total_villains: number;
}
