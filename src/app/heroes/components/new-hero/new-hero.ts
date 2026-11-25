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
  HeroeCategory,
  HeroImageSelection,
  HeroPayload,
  NewHeroResponse,
  UploadImageResponse,
} from '../../../interfaces/heroes.interface';
import {
  LoadImageHero,
} from '../../../components/load-image-hero/load-image-hero';
import { HeroesUtilsService } from '../../../services/heroes-utils';
import { TransformTextUppercase } from '../../../directives/transform-text-uppercase';
import { HeroErrorStateMatcher } from '../../../shared/error-state-matcher';
import { LoadingOverlay } from '../../../shared/components/loading-overlay/loading-overlay';
import { I18N } from '../../../shared/i18n/es';
import { translate } from '../../../shared/i18n/translate';
import { MAX_LENGTHS, Mode, TextFieldName } from '../../../constants/defaultValues';

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
    LoadingOverlay,
  ],
  templateUrl: './new-hero.html',
})
export default class NewHero {
  readonly i18nTexts = I18N;
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

  // Sin anotación Record<..., string>: el ensanchamiento a string borra los literales y
  // translate() deja de validar los placeholders. Con los literales, el helper exige
  // exactamente { maxLength }.
  private readonly maxLengthText = this.i18nTexts.maxLengthMessage;
  private readonly requiredMessages = this.i18nTexts.requiredMessages;

  readonly matcher = new HeroErrorStateMatcher();

  readonly heroCategories: HeroeCategory[] = [
    { value: 'Hero', viewValue: this.i18nTexts.heroCategory.hero },
    { value: 'Villain', viewValue: this.i18nTexts.heroCategory.villain },
    { value: 'anti-hero', viewValue: this.i18nTexts.heroCategory.antiHero },
  ];
  readonly heroStatus: HeroeCategory[] = [
    { value: 'Active', viewValue: this.i18nTexts.heroStatus.active },
    { value: 'Inactive', viewValue: this.i18nTexts.heroStatus.inactive },
    { value: 'Deceased', viewValue: this.i18nTexts.heroStatus.deceased },
  ];

  readonly reactivePowersWords = signal<string[]>([]);
  /** Archivo de imagen seleccionado: viaja por signal porque el control image solo lleva el nombre. */
  private readonly selectedImageFile = signal<File | null>(null);
  /** Marca que la subida de imagen falló tras crear el héroe (el héroe sí quedó creado). */
  private readonly imageUploadFailed = signal(false);
  /** Marca que hay un request de guardar en vuelo: bloquea el formulario y muestra el overlay. */
  readonly isSaving = signal(false);

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
      name: ['', [Validators.required, Validators.maxLength(MAX_LENGTHS.name)]],
      alias: ['', [Validators.required, Validators.maxLength(MAX_LENGTHS.alias)]],
      status: ['Active'],
      category: ['Hero', [Validators.required, Validators.maxLength(10)]],
      universe: ['', [Validators.required, Validators.maxLength(MAX_LENGTHS.universe)]],
      team: ['', [Validators.required, Validators.maxLength(MAX_LENGTHS.team)]],
      description: ['', [Validators.required, Validators.maxLength(MAX_LENGTHS.description)]],
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
      return this.requiredMessages[controlName];
    }
    if (control.hasError('maxlength')) {
      return translate(this.maxLengthText[controlName], {
        maxLength: MAX_LENGTHS[controlName],
      });
    }
    return null;
  }

  /**
   * El aviso de límite se muestra SOLO al alcanzar exactamente el máximo (comportamiento
   * documentado y pineado por tests): ni por debajo ni al superarlo.
   */
  showLimitHint(controlName: TextFieldName): boolean {
    return this.heroForm.controls[controlName].value.length === MAX_LENGTHS[controlName];
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
        title: I18N.alerts.confirmSaveTitle,
        text:
          this.mode() === 'create'
            ? I18N.alerts.confirmSaveCreateText
            : I18N.alerts.confirmSaveEditText,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: `${this.mode() === 'create' ? I18N.buttons.create : I18N.buttons.edit}`,
        cancelButtonText: I18N.buttons.cancel,
      }).then((result) => {
        if (result.isConfirmed) {
          this.isSaving.set(true);
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
              this.isSaving.set(false);
              if (this.imageUploadFailed()) {
                // El héroe ya quedó creado/editado: solo falló la imagen, que se puede
                // reintentar desde Editar. Igual se vuelve al listado.
                Swal.fire({
                  title: I18N.messages.saveErrorTitle,
                  text:
                    this.mode() === 'create'
                      ? I18N.image.saveImageErrorCreateText
                      : I18N.image.saveImageErrorEditText,
                  icon: 'warning',
                });
              } else {
                Swal.fire({
                  title: I18N.alerts.saveSuccessTitle,
                  text:
                    this.mode() === 'create'
                      ? I18N.alerts.saveSuccessCreateText
                      : I18N.alerts.saveSuccessEditText,
                  icon: 'success',
                });
              }
              this.heroesUtilsService.refreshLoad();
              this.router.navigate(['/heroes']);
            },
            error: (err) => {
              this.isSaving.set(false);
              console.error(
                `No se pudo ${this.mode() === 'create' ? 'guardar' : 'editar'} el héroe:`,
                err,
              );
              Swal.fire({
                title: I18N.messages.saveErrorTitle,
                text:
                  this.mode() === 'create'
                    ? I18N.messages.saveErrorCreateText
                    : I18N.messages.saveErrorEditText,
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
      MAX_LENGTHS[controlName],
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
