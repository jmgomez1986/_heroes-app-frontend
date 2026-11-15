/** Defaults y límites de paginación. Espejan la validación del backend
 * (page ≥ 1, elements_per_page entre 1 y 50): si el contrato cambia, se
 * ajusta acá solamente. */
export const DEFAULT_PAGE = 1;
export const DEFAULT_ITEMS_PER_PAGE = 10;
export const MAX_ITEMS_PER_PAGE = 50;
