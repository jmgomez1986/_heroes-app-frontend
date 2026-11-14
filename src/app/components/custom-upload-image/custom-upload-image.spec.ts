import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  CustomUploadImage,
  CustomUploadImageSelection,
} from '../custom-upload-image/custom-upload-image';

describe('CustomUploadImage', () => {
  let component: CustomUploadImage;
  let fixture: ComponentFixture<CustomUploadImage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomUploadImage],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomUploadImage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the Cloudinary image as preview and only the file name in the input', async () => {
    const cloudinaryUrl =
      'https://res.cloudinary.com/matiasdev/image/upload/v1794609048/heroes-app/superman.jpg';

    fixture.componentRef.setInput('heroImage', cloudinaryUrl);
    await fixture.whenStable();

    // La secure_url completa se usa tal cual como src del preview
    expect(component.imagePreview()).toBe(cloudinaryUrl);
    // El input muestra solo el último segmento del path
    expect(component.imageFileName()).toBe('superman.jpg');
    expect(component.imageNameControl.value).toBe('superman.jpg');
  });

  it('resets the preview and the input when the hero has no image', async () => {
    fixture.componentRef.setInput('heroImage', '');
    await fixture.whenStable();

    expect(component.imagePreview()).toBeNull();
    expect(component.imageFileName()).toBeNull();
    expect(component.imageNameControl.value).toBe('');
  });

  it('should emit base64 and fileName after selecting a valid image', async () => {
    let selection: CustomUploadImageSelection | undefined;
    component.selectionChange.subscribe((s) => (selection = s));

    const fileName = 'superman.png';
    const file = new File(['fake-content'], fileName, { type: 'image/png' });
    const event = { target: { files: [file] } } as unknown as Event;

    component.onFileSelect(event);

    // FileReader es asíncrono, esperamos a que termine de leer el archivo
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(selection?.fileName).toBe(fileName);
    expect(selection?.base64).toContain('data:image/png;base64');
    // El preview y el nombre se actualizan internamente
    expect(component.imagePreview()).toContain('data:image/png;base64');
    expect(component.imageFileName()).toBe(fileName);
  });

  it('should reject non-image files, reset the state and emit nulls', () => {
    let selection: CustomUploadImageSelection | undefined;
    component.selectionChange.subscribe((s) => (selection = s));

    const file = new File(['data'], 'notas.txt', { type: 'text/plain' });
    const input = { files: [file], value: '' } as unknown as HTMLInputElement;
    const event = { target: input } as unknown as Event;

    component.onFileSelect(event);

    expect(selection?.fileName).toBeNull();
    expect(selection?.base64).toBeNull();
    expect(component.imagePreview()).toBeNull();
    expect(component.imageFileName()).toBeNull();
    expect(component.imageNameControl.hasError('invalidType')).toBe(true);
  });
});
