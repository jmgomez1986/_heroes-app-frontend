import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideSweetAlert2 } from '@sweetalert2/ngx-sweetalert2';
import { MatPaginatorIntl } from '@angular/material/paginator';

import { routes } from './app.routes';
import { getSpanishPaginatorIntl } from './shared/i18n/spanish-paginator-intl';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
    provideSweetAlert2({
      // Optional configuration
      fireOnInit: false,
      dismissOnDestroy: true,
    }),
    // Paginador de Angular Material en español
    { provide: MatPaginatorIntl, useFactory: getSpanishPaginatorIntl },
    // Loader de imágenes no-op: el backend guarda la secure_url COMPLETA de Cloudinary
    // (con base incluida) y los loaders built-in de CDN de Angular rechazan ngSrc
    // absolutos (NG02959, esperan paths relativos a su base). El contrato de
    // IMAGE_LOADER recibe un ImageLoaderConfig y devuelve config.src: usar el src
    // tal cual silencia NG02962 sin alterar la URL guardada. Si en el futuro se
    // decide almacenar solo el path relativo (ej: v<version>/heroes-app/<slug>.jpg)
    // para habilitar srcset, migrar a provideCloudinaryLoader(environment.cloudinaryBaseUrl).
    { provide: IMAGE_LOADER, useValue: (config: ImageLoaderConfig) => config.src },
  ],
};
