import { CanDeactivateFn } from '@angular/router';

import NewHero from '../../heroes/components/new-hero/new-hero';

/** Delega en el componente la decisión de permitir salir de la ruta.
 * El componente conoce su propio estado (formulario sucio o no). */
export const canDeactivateGuard: CanDeactivateFn<NewHero> = (component) =>
  component.canDeactivate();
