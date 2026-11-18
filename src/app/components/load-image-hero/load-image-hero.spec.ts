import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadImageHero } from './load-image-hero';
import { Hero } from '../../interfaces/heroes.interface';

// URL de imagen existente tal como la devuelve el backend (secure_url de Cloudinary).
const CLOUDINARY_IMAGE =
  'https://res.cloudinary.com/matiasdev/image/upload/v1794609048/heroes-app/superman.jpg';

const createMockHero = (overrides: Partial<Hero> = {}): Hero => ({
  _id: '1',
  slug: 'superman',
  name: 'Clark Kent',
  alias: 'Superman',
  powers: [],
  description: '',
  team: 'Liga de la Justicia',
  image: CLOUDINARY_IMAGE,
  status: 'Active',
  category: 'Hero',
  universe: 'DC',
  ...overrides,
});

describe('LoadImageHero', () => {
  let component: LoadImageHero;
  let fixture: ComponentFixture<LoadImageHero>;
  let host: HTMLElement;

  const getInput = () => host.querySelector('input[type="file"]') as HTMLInputElement;

  const selectFile = (file: File | null) => {
    const input = getInput();
    Object.defineProperty(input, 'files', { value: file ? [file] : null, configurable: true });
    input.dispatchEvent(new Event('change'));
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadImageHero],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadImageHero);
    component = fixture.componentInstance;
    host = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit selectionChange with fileName and file when a valid image is selected', () => {
    const file = new File(['fake'], 'superman.png', { type: 'image/png' });
    const emitSpy = vi.spyOn(component.selectionChange, 'emit');

    selectFile(file);

    expect(emitSpy).toHaveBeenCalledWith({ fileName: 'superman.png', file });
    expect(component.previewImage()).toMatch(/^blob:/);
  });

  it('should not emit when the file dialog is cancelled (no file)', () => {
    const emitSpy = vi.spyOn(component.selectionChange, 'emit');

    selectFile(null);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should disable the file input in view mode', () => {
    fixture.componentRef.setInput('mode', 'view');
    fixture.detectChanges();

    expect(getInput().disabled).toBe(true);
  });

  it('should show a visible alert (role="alert") for a non allowed format', () => {
    const emitSpy = vi.spyOn(component.selectionChange, 'emit');

    selectFile(new File(['fake'], 'hero.gif', { type: 'image/gif' }));
    fixture.detectChanges();

    const alert = host.querySelector('[data-testid="image-error"]');
    expect(alert?.getAttribute('role')).toBe('alert');
    expect(alert?.textContent).toContain('Formato no permitido');
    // La selección inválida descarta el archivo y notifica al padre con null.
    expect(emitSpy).toHaveBeenCalledWith({ fileName: null, file: null });
  });

  it('should show a visible alert when the image exceeds 1 MB', () => {
    const bigFile = new File([new Uint8Array(1024 * 1024 + 1)], 'big.png', { type: 'image/png' });

    selectFile(bigFile);
    fixture.detectChanges();

    expect(host.querySelector('[data-testid="image-error"]')?.textContent).toContain(
      'tamaño máximo de 1 MB',
    );
    expect(component.previewImage()).toBe('');
  });

  it('should clear the error alert after a valid selection', () => {
    selectFile(new File(['fake'], 'hero.gif', { type: 'image/gif' }));
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="image-error"]')).not.toBeNull();

    selectFile(new File(['fake'], 'superman.png', { type: 'image/png' }));
    fixture.detectChanges();
    expect(host.querySelector('[data-testid="image-error"]')).toBeNull();
  });

  it('should fall back to the existing hero image in edit/view mode', () => {
    fixture.componentRef.setInput('hero', createMockHero());
    fixture.detectChanges();

    const img = host.querySelector('[data-testid="preview-image"]') as HTMLImageElement;
    expect(img.src).toContain(CLOUDINARY_IMAGE);
    expect(img.alt).toBe('Vista previa de Superman');
  });

  it('should show the placeholder when there is no image yet', () => {
    fixture.detectChanges();

    expect(host.querySelector('[data-testid="preview-placeholder"]')).not.toBeNull();
  });

  it('should associate the label with the file input through a unique id', () => {
    fixture.detectChanges();

    const label = host.querySelector('label') as HTMLLabelElement;
    expect(label.getAttribute('for')).toBe(getInput().id);
    expect(getInput().id).not.toBe('');
  });
});
