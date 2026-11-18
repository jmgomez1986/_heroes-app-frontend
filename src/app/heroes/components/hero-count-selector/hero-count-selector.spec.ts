import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatSelect } from '@angular/material/select';

import { HeroCountSelector } from './hero-count-selector';

describe('HeroCountSelector', () => {
  let fixture: ComponentFixture<HeroCountSelector>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroCountSelector],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroCountSelector);
    fixture.componentRef.setInput('shown', 9);
    fixture.componentRef.setInput('total', 42);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.componentRef.setInput('pageSizeOptions', [5, 10, 25]);
    host = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('muestra el pill "Mostrando X de Y héroes" con los valores recibidos', () => {
    const pill = host.querySelector('[data-testid="count-pill"]')!;
    expect(pill.textContent).toContain('Mostrando');
    expect(pill.textContent).toContain('9');
    expect(pill.textContent).toContain('42');
    expect(pill.textContent).toContain('héroes');
  });

  it('renderiza el selector con las opciones recibidas y el valor actual', async () => {
    // Los mat-option son lazy en esta versión de Material: se instancian al abrir el panel.
    const selector = host.querySelector('[data-testid="page-size-selector"]')!;
    expect(selector).not.toBeNull();
    (selector.querySelector('mat-select') as HTMLElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    const options = document.querySelectorAll('mat-option');
    expect(options.length).toBe(3);
    expect(options[1].textContent?.trim()).toBe('10');
  });

  it('oculta el pill cuando shown/total llegan undefined (carga o error)', () => {
    fixture.componentRef.setInput('shown', undefined);
    fixture.componentRef.setInput('total', undefined);
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="count-pill"]')).toBeNull();
    // El selector permanece: permite cambiar el tamaño apenas haya datos.
    expect(host.querySelector('[data-testid="page-size-selector"]')).not.toBeNull();
  });

  it('forwards el valor elegido del selectionChange al output pageSizeChange', () => {
    // Los tests de interacción del select son de Angular Material (el overlay lazy de esta
    // versión no es interactivable en el entorno de test). Este spec pinea el wiring de
    // NUESTRA plantilla: (selectionChange)="pageSizeChange.emit($event.value)".
    const emitted: number[] = [];
    fixture.componentInstance.pageSizeChange.subscribe((size) => emitted.push(size));
    const matSelect = fixture.debugElement.query(By.directive(MatSelect)).injector.get(MatSelect);
    matSelect.selectionChange.emit({ value: 10 } as never);
    expect(emitted).toEqual([10]);
  });
});
