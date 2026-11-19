import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroStats } from './hero-stats';
import { StatCardEntry } from '../../../interfaces/heroesStats.interface';

const createEntry = (
  overrides: Partial<StatCardEntry> = {},
  label = 'Total de personajes',
): StatCardEntry => ({
  label,
  value: 42,
  icon: 'groups',
  chips: [
    { label: '30 Héroes', classes: 'bg-green-100 text-green-700' },
    { label: '12 Villanos', classes: 'bg-red-100 text-red-700' },
  ],
  ...overrides,
});

// Contrato del renderer: escalar a N cards a partir del input de datos,
// sin lógica de negocio adentro (los datos ya vienen armados desde afuera).
describe('HeroStats', () => {
  let fixture: ComponentFixture<HeroStats>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroStats],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroStats);
  });

  it('renderiza una card por entrada: escala a N cards desde el input', async () => {
    fixture.componentRef.setInput('stats', [
      createEntry(),
      createEntry({ icon: undefined, chips: undefined }, 'Otra métrica'),
      createEntry({ chips: undefined, icon: undefined }, 'Tercera métrica'),
    ]);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('.stat-card').length).toBe(3);
  });

  it('renderiza label, valor, icono, chips (con sus clases) y sub de cada entrada', async () => {
    fixture.componentRef.setInput('stats', [createEntry({ sub: 'Dataset completo' })]);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('Total de personajes');
    expect(host.textContent).toContain('42');
    expect(host.querySelector('mat-icon')?.textContent).toContain('groups');
    expect(host.textContent).toContain('30 Héroes');
    expect(host.textContent).toContain('12 Villanos');
    expect(host.textContent).toContain('Dataset completo');

    // Las clases del chip viajan en los datos: el renderer no decide colores.
    const heroChip = [...host.querySelectorAll('.stat-card span')].find(
      (el) => el.textContent?.trim() === '30 Héroes',
    );
    expect(heroChip?.className).toContain('bg-green-100');
    expect(heroChip?.className).toContain('text-green-700');
  });

  it('acepta entradas sin icono, chips ni sub (todos los campos opcionales)', async () => {
    fixture.componentRef.setInput('stats', [createEntry({ icon: undefined, chips: undefined, sub: undefined })]);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('.stat-card').length).toBe(1);
    expect(host.querySelector('mat-icon')).toBeNull();
  });

  it('sin entradas no renderiza cards', async () => {
    fixture.componentRef.setInput('stats', []);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('.stat-card').length).toBe(0);
  });
});
