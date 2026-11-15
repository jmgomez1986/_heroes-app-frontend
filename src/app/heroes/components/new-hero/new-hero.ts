import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, switchMap, catchError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

import { HeroesService } from '../../../services/heroes';
import {
  EditHeroResponse,
  Hero,
  NewHeroResponse,
  UploadImageResponse,
} from '../../../interfaces/heroes.interface';
import {
  CustomUploadImage,
  CustomUploadImageSelection,
} from '../../../components/custom-upload-image/custom-upload-image';
import { HeroesUtilsService } from '../../../services/heroes-utils';
import { TransformTextUppercase } from '../../../directives/transform-text-uppercase';
import { HeroErrorStateMatcher } from '../../../shared/error-state-matcher';
import { Mode } from '../../../interfaces/shared.interface';
import { I18N } from '../../../shared/i18n/es';

/** Nombres de los campos de texto con límite de caracteres. */
type TextFieldName = 'name' | 'alias' | 'universe' | 'team' | 'description';

interface HeroeCategory {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-new-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CustomUploadImage,
    TransformTextUppercase,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatRadioModule,
    MatChipsModule,
    MatIconModule,
    MatCardModule,
  ],
  templateUrl: './new-hero.html',
})
export default class NewHero {
  matcher = new HeroErrorStateMatcher();
  // Signals
  hero = input<Hero>();
  mode = input<Mode>('create');
  // Services
  readonly heroesService = inject(HeroesService);
  readonly heroesUtilsService = inject(HeroesUtilsService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  heroForm: FormGroup = new FormGroup({});
  heroeCategories: HeroeCategory[] = [
    { value: 'Hero', viewValue: 'Héroe' },
    { value: 'Villain', viewValue: 'Villano' },
  ];
  /** Máximos de caracteres por campo de texto (única fuente de verdad para validador y template). */
  readonly MAX_LENGTHS: Record<TextFieldName, number> = {
    name: 20,
    alias: 20,
    universe: 10,
    team: 20,
    description: 150,
  };
  readonly reactivePowersWords = signal<string[]>([]);
  /** Archivo de imagen seleccionado: viaja por signal porque el control image solo lleva el nombre. */
  private readonly selectedImageFile = signal<File | null>(null);
  /** Marca que la subida de imagen falló tras crear el héroe (el héroe sí quedó creado). */
  private readonly imageUploadFailed = signal(false);

  constructor() {
    this.buildHeroForm();
    effect(() => {
      const heroData = this.hero();

      if (heroData) {
        this.heroForm.patchValue(heroData);
        this.reactivePowersWords.set(heroData.powers);
        if (this.mode() === 'view') {
          this.heroForm.disable();
        } else if (this.mode() === 'edit') {
          // name es inmutable en el backend: queda read-only y no viaja en el PATCH
          // (un control disabled no entra en el form.value).
          this.heroForm.get('name')?.disable();
        }
      }
    });
  }

  buildHeroForm() {
    this.heroForm = this.fb.group({
      name: [
        '',
        { validators: [Validators.required, Validators.maxLength(this.MAX_LENGTHS.name)] },
      ],
      alias: [
        '',
        { validators: [Validators.required, Validators.maxLength(this.MAX_LENGTHS.alias)] },
      ],
      status: ['Active'],
      category: ['Hero', { validators: [Validators.required, Validators.maxLength(10)] }],
      universe: [
        '',
        { validators: [Validators.required, Validators.maxLength(this.MAX_LENGTHS.universe)] },
      ],
      team: [
        '',
        { validators: [Validators.required, Validators.maxLength(this.MAX_LENGTHS.team)] },
      ],
      description: [
        '',
        { validators: [Validators.required, Validators.maxLength(this.MAX_LENGTHS.description)] },
      ],
      powers: [],
      image: ['', { validators: [Validators.required] }],
    });
  }

  removeReactivePowers(newPower: string): void {
    // Creamos la nueva lista conservando todos los poderes menos el que se quiere eliminar
    // Se usa filter y no splice, para crear un arreglo nuevo, si no se cambiaria el arreglo
    // y el signal no lo detecta al cambio
    const powerFiltered = this.reactivePowersWords().filter((power) => power !== newPower);
    // Se setea el signal con la nueva lista de poderes
    this.reactivePowersWords.set(powerFiltered);
    // Se actualiza el formControl
    this.heroForm.get('powers')?.setValue(powerFiltered);
  }

  addReactivePowers(event: MatChipInputEvent): void {
    // Se eliminan espacios extras en el nuevo poder a agregar
    const value = (event.value || '').trim();
    // Agregamos el nuevo poder
    if (value) {
      this.addPower(value);
    }
    // Se limpia el input
    event.chipInput!.clear();
  }

  addPower(value: string): void {
    // Se agrega el nuevo poder a la lista
    const newPowersList = [...this.reactivePowersWords(), value];
    // Se setea el signal con la nueva lista de poderes
    this.reactivePowersWords.set(newPowersList);
    // Se actualiza el formControl
    this.heroForm.get('powers')?.setValue(newPowersList);
  }

  onSubmit(): void {
    if (this.heroForm.valid) {
      Swal.fire({
        title: I18N.form.confirmSaveTitle,
        text:
          this.mode() === 'create'
            ? I18N.form.confirmSaveCreateText
            : I18N.form.confirmSaveEditText,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: `${this.mode() === 'create' ? I18N.form.confirmCreate : I18N.form.confirmEdit}`,
        cancelButtonText: I18N.form.cancel,
      }).then((result) => {
        if (result.isConfirmed) {
          const newHero: Hero = { ...this.heroForm.value };
          newHero.powers = this.reactivePowersWords();
          // La imagen no viaja en el JSON (el backend limita ese body a 100 KB): se sube aparte como binario.
          newHero.image = '';
          this.imageUploadFailed.set(false);

          const heroSlug = this.hero()?.slug ?? '';
          const heroesServiceObservable$: Observable<
            NewHeroResponse | EditHeroResponse | UploadImageResponse
          > =
            this.mode() === 'create' ? this.createHero(newHero) : this.editHero(newHero, heroSlug);
          heroesServiceObservable$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
              if (this.imageUploadFailed()) {
                // El héroe ya quedó creado/editado: solo falló la imagen, que se puede
                // reintentar desde Editar. Igual se vuelve al listado.
                Swal.fire({
                  title: I18N.form.saveErrorTitle,
                  text:
                    this.mode() === 'create'
                      ? I18N.form.saveImageErrorCreateText
                      : I18N.form.saveImageErrorEditText,
                  icon: 'warning',
                });
              } else {
                Swal.fire({
                  title: I18N.form.saveSuccessTitle,
                  text:
                    this.mode() === 'create'
                      ? I18N.form.saveSuccessCreateText
                      : I18N.form.saveSuccessEditText,
                  icon: 'success',
                });
              }
              this.heroesUtilsService.refreshLoad();
              this.router.navigate(['/heroes']);
            },
            error: (err) => {
              console.error(
                `No se pudo ${this.mode() === 'create' ? 'guardar' : 'editar'} el héroe:`,
                err,
              );
              Swal.fire({
                title: I18N.form.saveErrorTitle,
                text:
                  this.mode() === 'create'
                    ? I18N.form.saveErrorCreateText
                    : I18N.form.saveErrorEditText,
                icon: 'error',
              });
            },
          });
        }
      });
    }
  }

  /**
   * Crea el héroe con el JSON y, si hay imagen seleccionada, la sube aparte con el slug
   * de la respuesta. Si la subida falla, se marca el error y se continúa igual: el héroe
   * ya existe y la imagen se puede reintentar desde Editar.
   */
  private createHero(newHero: Hero): Observable<NewHeroResponse | UploadImageResponse> {
    return this.heroesService.addNewHero(newHero).pipe(
      switchMap((created) => {
        const file = this.selectedImageFile();
        const heroSlug = created.response.slug;

        if (file && heroSlug) {
          return this.heroesService.uploadHeroImage(heroSlug, file).pipe(
            catchError(() => {
              this.imageUploadFailed.set(true);
              return of(created);
            }),
          );
        }
        return of(created);
      }),
    );
  }

  /**
   * Edita el héroe con PATCH por slug y, si el usuario eligió un archivo de imagen nuevo,
   * lo sube aparte con el slug del response (editar el alias regenera el slug). Si la
   * subida falla, se marca el error: el héroe ya quedó editado y la imagen se puede
   * reintentar desde Editar.
   */
  private editHero(
    newHero: Hero,
    heroSlug: string,
  ): Observable<EditHeroResponse | UploadImageResponse> {
    return this.heroesService.editHero(heroSlug, newHero).pipe(
      switchMap((edited) => {
        const file = this.selectedImageFile();
        const newSlug = edited.response.slug;

        if (file && newSlug) {
          return this.heroesService.uploadHeroImage(newSlug, file).pipe(
            catchError(() => {
              this.imageUploadFailed.set(true);
              return of(edited);
            }),
          );
        }
        return of(edited);
      }),
    );
  }

  cancelSubmit() {
    this.router.navigate(['/heroes']);
  }

  /**
   * Limita la escritura de un campo de texto a maxLength + 1 caracteres (ver
   * HeroesUtilsService.enforceMaxLength). Reemplaza al atributo nativo maxlength:
   * se deja escribir un caracter de más para que el validador dispare el error,
   * el formulario quede inválido y el botón Guardar se deshabilite.
   */
  onTextInput(event: Event, controlName: TextFieldName): void {
    this.heroesUtilsService.enforceMaxLength(
      event,
      this.heroForm.get(controlName),
      this.MAX_LENGTHS[controlName],
    );
  }

  /** Se ejecuta cuando el componente de carga de imagen emite una selección. */
  onImageChanged(selection: CustomUploadImageSelection): void {
    // El control solo lleva el nombre (satisface el validador required); el archivo real viaja por signal.
    this.heroForm.get('image')?.setValue(selection.fileName ?? '');
    this.selectedImageFile.set(selection.file);
  }
}
