import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import NewHero from '../../heroes/components/new-hero/new-hero';
import { canDeactivateGuard } from './can-deactivate.guard';

describe('canDeactivateGuard', () => {
  const emptyRoute = null as unknown as ActivatedRouteSnapshot;
  const emptyState = null as unknown as RouterStateSnapshot;

  it('permite salir cuando el componente retorna true', () => {
    const component = { canDeactivate: () => true } as unknown as NewHero;
    expect(canDeactivateGuard(component, emptyRoute, emptyState, emptyState)).toBe(true);
  });

  it('no permite salir cuando el componente retorna false', () => {
    const component = { canDeactivate: () => false } as unknown as NewHero;
    expect(canDeactivateGuard(component, emptyRoute, emptyState, emptyState)).toBe(false);
  });

  it('delegue la decisión al componente', () => {
    let calls = 0;
    const component = {
      canDeactivate: () => {
        calls++;
        return true;
      },
    } as unknown as NewHero;
    canDeactivateGuard(component, emptyRoute, emptyState, emptyState);
    expect(calls).toBe(1);
  });
});
