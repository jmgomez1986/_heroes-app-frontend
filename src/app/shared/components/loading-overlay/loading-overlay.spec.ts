import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadingOverlay } from './loading-overlay';

describe('LoadingOverlay', () => {
  let fixture: ComponentFixture<LoadingOverlay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingOverlay],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingOverlay);
  });

  it('no renderiza nada cuando show es false', () => {
    fixture.componentRef.setInput('show', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.loading-overlay-backdrop')).toBeNull();
  });

  it('renderiza el backdrop y el spinner cuando show es true', () => {
    fixture.componentRef.setInput('show', true);
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('.loading-overlay-backdrop');
    expect(backdrop).not.toBeNull();
    expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
  });
});
