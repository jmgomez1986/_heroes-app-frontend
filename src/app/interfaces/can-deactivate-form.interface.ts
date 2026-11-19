/** Componente que puede preguntar al usuario si quiere descartar cambios no guardados
 * antes de navegar fuera de la ruta. */
export interface CanDeactivateForm {
  canDeactivate(): boolean | Promise<boolean>;
}
