import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, switchMap, catchError, filter } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import Swal from 'sweetalert2';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

import { HeroesService } from '../../../services/heroes';
import {
  EditHeroResponse,
  Hero,
  HeroPayload,
  NewHeroResponse,
  UploadImageResponse,
} from '../../../interfaces/heroes.interface';
import { HeroImageSelection, LoadImageHero } from '../../../components/load-image-hero/load-image-hero';
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
    LoadImageHero,
    TransformTextUppercase,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    MatCardModule,
  ],
  templateUrl: './new-hero.html',
})
export default class NewHero {
  // Signals
  readonly hero = input<Hero>();
  readonly mode = input<Mode>('create');
  readonly isView = computed(() => this.mode() === 'view');
  // Services
  readonly heroesService = inject(HeroesService);
  readonly heroesUtilsService = inject(HeroesUtilsService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  /** Máximos de caracteres por campo de texto (única fuente de verdad para validador y template). */
  readonly MAX_LENGTHS: Record<TextFieldName, number> = {
    name: 20,
    alias: 20,
    universe: 10,
    team: 20,
    description: 150,
  };
  /** Etiqueta de cada campo para construir el mensaje de maxlength sin duplicar textos. */
  private readonly MAX_MESSAGE_LABELS: Record<TextFieldName, string> = {
    name: 'El nombre debe tener un máximo de',
    alias: 'El alias debe tener un máximo de',
    universe: 'El universo debe tener un máximo de',
    team: 'El equipo del héroe debe tener un máximo de',
    description: 'La descripción del Héroe debe tener un máximo de',
  };
  /** Mensaje de campo requerido (se muestra uno solo por campo, igual que antes). */
  private readonly REQUIRED_MESSAGES: Record<TextFieldName, string> = {
    name: 'El nombre es obligatorio',
    alias: 'El alias es obligatorio',
    universe: 'El universo es obligatorio',
    team: 'El equipo del héroe es obligatorio',
    description: 'La descripción del Héroe es obligatoria.',
  };

  readonly matcher = new HeroErrorStateMatcher();

  readonly heroCategories: HeroeCategory[] = [
    { value: 'Hero', viewValue: 'Héroe' },
    { value: 'Villain', viewValue: 'Villano' },
  ];
  readonly heroStatus: HeroeCategory[] = [
    { value: 'Active', viewValue: 'Activo' },
    { value: 'Inactive', viewValue: 'Inactivo' },
  ];

  readonly reactivePowersWords = signal<string[]>([]);
  /** Archivo de imagen seleccionado: viaja por signal porque el control image solo lleva el nombre. */
  private readonly selectedImageFile = signal<File | null>(null);
  /** Marca que la subida de imagen falló tras crear el héroe (el héroe sí quedó creado). */
  private readonly imageUploadFailed = signal(false);

  /** Formulario tipado: `readonly` y sembrado en el inicializador (sin el placeholder vacío). */
  readonly heroForm = this.buildHeroForm();

  constructor() {
    // El héroe recibido (edit/view) precarga el formulario. `toObservable` reemplaza al
    // effect: reacciona solo al input `hero` y se desuscribe con el componente.
    toObservable(this.hero)
      .pipe(
        filter((hero): hero is Hero => hero !== undefined),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((hero) => this.patchForm(hero));
  }

  private buildHeroForm() {
    return this.fb.nonNullable.group({
      name: ['', [Validators.required, Validators.maxLength(this.MAX_LENGTHS.name)]],
      alias: ['', [Validators.required, Validators.maxLength(this.MAX_LENGTHS.alias)]],
      status: ['Active'],
      category: ['Hero', [Validators.required, Validators.maxLength(10)]],
      universe: ['', [Validators.required, Validators.maxLength(this.MAX_LENGTHS.universe)]],
      team: ['', [Validators.required, Validators.maxLength(this.MAX_LENGTHS.team)]],
      description: [
        '',
        [Validators.required, Validators.maxLength(this.MAX_LENGTHS.description)],
      ],
      powers: this.fb.nonNullable.control<string[]>([]),
      image: ['', [Validators.required]],
    });
  }

  /** Precarga el formulario con el héroe recibido y aplica las restricciones del modo. */
  private patchForm(hero: Hero): void {
    this.heroForm.patchValue(hero);
    this.reactivePowersWords.set(hero.powers);

    if (this.isView()) {
      this.heroForm.disable();
    } else if (this.mode() === 'edit') {
      // name es inmutable en el backend: queda read-only y no viaja en el PATCH
      // (un control disabled no entra en el form.value).
      this.heroForm.controls.name.disable();
    }
  }

  /** Mensaje de error del campo, o null si no hay error que mostrar. */
  fieldErrorMessage(controlName: TextFieldName): string | null {
    const control = this.heroForm.controls[controlName];
    if (control.hasError('required')) {
      return this.REQUIRED_MESSAGES[controlName];
    }
    if (control.hasError('maxlength')) {
      return `${this.MAX_MESSAGE_LABELS[controlName]} ${this.MAX_LENGTHS[controlName]} caracteres.`;
    }
    return null;
  }

  /**
   * El aviso de límite se muestra SOLO al alcanzar exactamente el máximo (comportamiento
   * documentado y pineado por tests): ni por debajo ni al superarlo.
   */
  showLimitHint(controlName: TextFieldName): boolean {
    return this.heroForm.controls[controlName].value.length === this.MAX_LENGTHS[controlName];
  }

  removeReactivePowers(newPower: string): void {
    // Creamos la nueva lista conservando todos los poderes menos el que se quiere eliminar
    // Se usa filter y no splice, para crear un arreglo nuevo, si no se cambiaria el arreglo
    // y el signal no lo detecta al cambio
    const powerFiltered = this.reactivePowersWords().filter((power) => power !== newPower);
    // Se setea el signal con la nueva lista de poderes
    this.reactivePowersWords.set(powerFiltered);
    // Se actualiza el formControl
    this.heroForm.controls.powers.setValue(powerFiltered);
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
    this.heroForm.controls.powers.setValue(newPowersList);
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
          const payload = this.buildPayload();
          this.imageUploadFailed.set(false);

          const heroSlug = this.hero()?.slug ?? '';
          const heroesServiceObservable$: Observable<
            NewHeroResponse | EditHeroResponse | UploadImageResponse
          > =
            this.mode() === 'create'
              ? this.createHero(payload)
              : this.editHero(this.buildEditPayload(payload), heroSlug);
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
   * Payload del formulario: la imagen no viaja en el JSON (el backend limita ese body a
   * 100 KB), se sube aparte como binario.
   */
  private buildPayload(): HeroPayload {
    const raw = this.heroForm.getRawValue();
    return {
      name: raw.name,
      alias: raw.alias,
      status: raw.status,
      category: raw.category,
      universe: raw.universe,
      team: raw.team,
      description: raw.description,
      powers: this.reactivePowersWords(),
      image: '',
    };
  }

  /** En el PATCH `name` no viaja: es inmutable en el backend. */
  private buildEditPayload(payload: HeroPayload): Partial<HeroPayload> {
    const editable: Partial<HeroPayload> = { ...payload };
    delete editable.name;
    return editable;
  }

  /**
   * Crea el héroe con el JSON y, si hay imagen seleccionada, la sube aparte con el slug
   * de la respuesta. Si la subida falla, se marca el error y se continúa igual: el héroe
   * ya existe y la imagen se puede reintentar desde Editar.
   */
  private createHero(newHero: HeroPayload): Observable<NewHeroResponse | UploadImageResponse> {
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
    newHero: Partial<HeroPayload>,
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

  cancelSubmit(): void {
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
      this.heroForm.controls[controlName],
      this.MAX_LENGTHS[controlName],
    );
  }

  /** Se ejecuta cuando el componente de carga de imagen emite una selección. */
  onImageChanged(selection: HeroImageSelection): void {
    // El control solo lleva el nombre (satisface el validador required); el archivo real viaja por signal.
    // El preview lo administra `load-image-hero` (object URL propio, revocado al reemplazarse).
    this.heroForm.controls.image.setValue(selection.fileName ?? '');
    this.selectedImageFile.set(selection.file);
  }
}
