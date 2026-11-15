import { TestBed } from '@angular/core/testing';

import { HeroImage } from './hero-image';

const CLOUDINARY_URL = 'https://res.cloudinary.com/matiasdev/image/upload/v1/heroes-app/superman.jpg';

describe('HeroImage', () => {
  function setup() {
    const fixture = TestBed.createComponent(HeroImage);
    const el = fixture.nativeElement as HTMLElement;
    const query = (testId: string) => el.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
    return { fixture, component: fixture.componentInstance, query };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroImage],
    }).compileComponents();
  });

  it('renders the placeholder when there is no image', () => {
    const { fixture, query } = setup();
    fixture.detectChanges();

    expect(query('img-placeholder')).toBeTruthy();
    expect(query('img-real')).toBeNull();
    expect(query('img-skeleton')).toBeNull();
  });

  it('shows the skeleton while a real image is loading', () => {
    const { fixture, component, query } = setup();
    fixture.componentRef.setInput('image', CLOUDINARY_URL);
    fixture.detectChanges();

    expect(component.imageState()).toBe('loading');
    expect(query('img-real')).toBeTruthy();
    expect(query('img-skeleton')).toBeTruthy();
    expect(query('img-placeholder')).toBeNull();
  });

  it('hides the skeleton after the image loads', () => {
    const { fixture, query } = setup();
    fixture.componentRef.setInput('image', CLOUDINARY_URL);
    fixture.detectChanges();

    query('img-real')!.dispatchEvent(new Event('load'));
    fixture.detectChanges();

    expect(query('img-skeleton')).toBeNull();
    expect(query('img-placeholder')).toBeNull();
  });

  it('falls back to the placeholder when the image fails to load', () => {
    const { fixture, query } = setup();
    fixture.componentRef.setInput('image', CLOUDINARY_URL);
    fixture.detectChanges();

    query('img-real')!.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(query('img-placeholder')).toBeTruthy();
    expect(query('img-real')).toBeNull();
    expect(query('img-skeleton')).toBeNull();
  });

  it('resets to the skeleton when the image input changes', () => {
    const { fixture, query } = setup();
    fixture.componentRef.setInput('image', CLOUDINARY_URL);
    fixture.detectChanges();

    query('img-real')!.dispatchEvent(new Event('load'));
    fixture.detectChanges();
    expect(query('img-skeleton')).toBeNull();

    fixture.componentRef.setInput('image', CLOUDINARY_URL.replace('superman', 'batman'));
    fixture.detectChanges();
    expect(query('img-skeleton')).toBeTruthy();
  });

  it('builds the alt text from the name input', () => {
    const { fixture, query } = setup();
    fixture.componentRef.setInput('name', 'Clark Kent');
    fixture.detectChanges();
    expect(query('img-placeholder')!.getAttribute('alt')).toBe('Imagen de Clark Kent');

    fixture.componentRef.setInput('name', '');
    fixture.detectChanges();
    expect(query('img-placeholder')!.getAttribute('alt')).toBe('Imagen no disponible');
  });
});
