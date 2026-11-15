# Heroes App — Frontend

Aplicación para administrar un catálogo de superhéroes: listado paginado con búsqueda, alta, edición, consulta y borrado. Construida con **Angular 21** (standalone + signals), **Angular Material** y **Tailwind CSS 4**, consumiendo la API REST del backend real (`heroes-app-backend`, Express + MongoDB) con imágenes hosteadas en Cloudinary.

## Stack

| Herramienta | Uso |
|---|---|
| Angular 21 | Framework (standalone components, signals: `resource()`, signal `input`/`output`, `effect`, `takeUntilDestroyed`) |
| Angular Material 21 + Tailwind CSS 4 | UI: componentes Material con overrides por Component Tokens + utilidades de Tailwind |
| Reactive Forms | Formularios de alta/edición con validaciones |
| SweetAlert2 (`@sweetalert2/ngx-sweetalert2`) | Diálogos de confirmación, éxito y error |
| Vitest + Testing Library | Tests unitarios con cobertura (`@vitest/coverage-v8`) |
| ESLint (`angular-eslint` flat config) + Prettier | Calidad y formato de código |
| heroes-app-backend | API REST real (Express + MongoDB, repo hermano) con imágenes en Cloudinary |

## Puesta en marcha

1. Instalar dependencias: `npm i`
2. Levantar el backend real (`heroes-app-backend`, escucha en `http://localhost:4000`; ver el README de ese repo)
3. Levantar el frontend: `npm start` (escucha en `http://localhost:4200`)
4. Verificar: abrir `http://localhost:4200` y navegar a la grilla de héroes

El frontend consume la API con URLs absolutas construidas sobre `environment.url` (`http://localhost:4000` en desarrollo, `src/app/environments/environment.ts`); no hay proxy de desarrollo y el backend habilita CORS. El `preconnect` a `res.cloudinary.com` en `index.html` acelera la entrega de las imágenes prioritarias del catálogo.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo (`ng serve`) |
| `npm run build` | Compila la aplicación a `dist/` |
| `npm run watch` | Compilación con recarga (`--configuration development`) |
| `npm test` | Suite de tests unitarios (Vitest) |
| `npm run test:coverage` | Ídem + reporte de cobertura en `coverage/` (abrir `coverage/index.html`) |
| `npm run lint` | Análisis estático (angular-eslint) |

## Decisiones de diseño

| Decisión | Motivo |
|---|---|
| **Paginación delegada al backend** | `HeroesService.getHeroes(page, size, query)` pagina del lado del servidor con `page`/`elements_per_page` (parametros construidos con `HttpParams`, que es inmutable: cada `.set()` devuelve una instancia nueva) y consume el contrato `GetHeroesResponse` (`total_pages/current_page/elements_per_page/total_elements/data`). El filtrado por nombre/alias viaja como query params (`name`/`alias`, solo si tienen valor); la coincidencia parcial case-insensitive queda a confirmar en el contrato del backend |
| **Filtros y paginación con estado en la URL** | La URL es la única fuente de verdad de la vista (`heroes-grid`): los query params (`name`, `alias`, `page`, `elements_per_page`) llegan como signal vía `toSignal(queryParamMap)` y alimentan el objeto único `filters` (una *vista* de la URL, no estado duplicado). Aplicar un filtro o paginar escribe la URL con `router.navigate` (`merge` + `replaceUrl: true`: el debounce y la paginación no ensucian el historial). Así compartir el link, recargar el navegador y el botón atrás reproducen exactamente la vista. Los valores vacíos y los defaults (`page=1`, `size=10`) no viajan; `page`/`size` se sanitizan contra los límites del backend (`shared/pagination.constants.ts`). Agregar un filtro futuro = campo en `Filters` + línea en el mapper del servicio + el param del backend |
| **El modo (`create`/`edit`/`view`) viaja en el `data` de la ruta** | Antes se leía de `router.currentNavigation()?.extras?.state`, que se pierde al recargar el navegador: refrescar `/view-hero/:id` dejaba el formulario editable (bug). Con el modo en la configuración de la ruta (`app.routes.ts`), sobrevive a la recarga. Editar y ver comparten `edit-hero-page` con el modo por signal input |
| **UX de límite de caracteres (aviso antes de cortar)** | Sin atributo nativo `maxlength`: el input deja escribir hasta `maxLength + 1`; al llegar ahí `Validators.maxLength` marca el error y el `mat-error`/`mat-hint` avisan, y por encima de ese tope `HeroesUtilsService.enforceMaxLength` recorta el valor (y el control) preservando el cursor. Así el usuario recibe el aviso del validador antes del corte manual, en lugar de chocar contra un límite silencioso. Centralizado en `heroes-utils.ts` y usado por todos los campos acotados |
| **Subida de imagen encapsulada en un componente** | `custom-upload-image` aísla toda la complejidad (selección de archivo, preview, emisión del archivo crudo) para no "ensuciar" el formulario de héroe, que ya es extenso. El preview local se genera con `URL.createObjectURL` (revocado al reemplazarlo) en lugar de base64; las imágenes base64 (data URLs) se excluyen de `NgOptimizedImage` (la directiva no soporta data URLs); las estáticas sí la usan (`ngSrc`) |
| **Suscripciones dentro de callbacks de SweetAlert2 con `takeUntilDestroyed`** | El diálogo es asíncrono: el componente puede destruirse entre la confirmación del diálogo y la respuesta HTTP. La suscripción se protege con `takeUntilDestroyed(DestroyRef)` para no operar sobre un contexto destruido |
| **`HeroErrorStateMatcher` única en `shared/`** | Se detectó duplicada en dos componentes y se extrajo a `src/app/shared/error-state-matcher.ts` para reutilizarla |
| **Refresco del grid con un contador (signal), no un booleano** | `HeroesUtilsService.refreshLoad()` incrementa un contador: dos refrescos en el mismo tick nunca se cancelan entre sí (con un booleano `false → true → false` el cambio de señal se pierde y el grid podría no recargar) |
| **Paginación al borrar el último elemento de una página > 1** | El `effect` en `heroes-grid` detecta la respuesta con `data` vacía en una página fuera de rango y retrocede a la última página con datos (`Math.max(1, resp.total_pages)`); con catálogo vacío cae a la página 1 (estado vacío legítimo). Conserva el contexto del usuario en borrados sucesivos en lugar de saltar siempre a la página 1 |
| **API con URLs absolutas, sin proxy de desarrollo** | Todas las requests se construyen sobre `environment.url` (`http://localhost:4000`): el backend habilita CORS y no hace falta proxy; una sola fuente de configuración para apuntar a otro entorno |
| **`changeDetection: OnPush` en todos los componentes** | Rendimiento y disciplina de signals: el rendering depende de inputs y señales, no de checks globales |
| **Overrides de Material por Component Tokens** | Los overrides de estilo (`mat.form-field-overrides`, `mat.paginator-overrides`) van por la API oficial de theming en `styles.scss`, en lugar de clases `!important` |
| **Paginador y textos en español** | `MatPaginatorIntl` provisto por `getSpanishPaginatorIntl` (`shared/i18n/spanish-paginator-intl.ts`); textos centralizados en `shared/i18n/es.ts` dejando preparada la centralización para un futuro cambio de idioma (i18n) |
| **Código y UI en español** | Convención del proyecto: comentarios y textos de interfaz en español (`<html lang="es">`); mensajes de la API según el contrato del backend |

## Edge cases cubiertos con tests

La suite (Vitest + Testing Library) cubre el contrato real del backend entre otros:

- **Formulario de héroe**: campos requeridos con sus `mat-error`, límites por campo (`name`/`alias`/`team` máx 20, `universe` máx 10, `description` máx 150), comportamiento de `enforceMaxLength` (recorte en `max + 1`, `mat-hint` solo al alcanzar el máximo), botón `Guardar` deshabilitado con formulario inválido, y no se llama al servicio sin confirmación.
- **Modos create/edit/view**: en `create` llama a `addNewHero`, en `edit` a `editHero`; en `view` el formulario queda deshabilitado y sin botón `Guardar`; títulos por modo (`Ver Héroe` / `Editar Héroe`).
- **Carga por resource**: `edit-hero-page` llama a `getHeroBySlug`, distingue valor cargado de estado de error y muestra el mensaje de carga fallida.
- **Alta con imagen separada**: el payload de `addNewHero` lleva `image: ''`; con archivo seleccionado se sube después con el `slug` de la respuesta (orden create→upload verificado); sin archivo no se sube nada; si la subida falla, aviso con `warning` y navegación al listado igualmente.
- **Edición con imagen condicional**: el PATCH por slug no lleva `name` (control disabled en modo edit); con archivo nuevo se sube después con el slug del response (alias cambiado regenera el slug, orden edit→upload verificado); sin archivo nuevo no se sube nada; fallo de subida → aviso con `warning` (texto por modo) y navegación al listado igualmente.
- **Filtros y paginación con estado en la URL** (`heroes-grid.spec.ts`, nuevo): la consulta toma `page`/`elements_per_page`/filtros de los query params; valores inválidos en la URL caen a los defaults; `applyFilters` escribe la URL con el filtro (vacíos fuera, página reseteada); `handlePageEvent` escribe `page` y `elements_per_page` (defaults fuera); con data vacía en una página fuera de rango se vuelve a la última página con datos escribiendo la URL.
- **Hidratación de filtros desde la URL** (`filters.spec.ts`): los controles se precargan con los filtros de la URL y se sincronizan al volver atrás/adelante, sin re-emitir (`emitEvent: false`, no hay loop URL → emit → URL).
- **Borrado por slug**: `deleteHero` viaja con el slug del héroe (ya no `_id`); la cancelación no llama al servicio, el éxito muestra el diálogo y emite `heroDeleted`, y el error muestra el diálogo de fallo.
- **Servicio HTTP** (`heroes.spec.ts`): `getHeroes` (paginación + filtros como query params, solo los que tienen valor), `getHeroBySlug` (GET por slug), `addNewHero` (URL y body), `editHero` (PATCH por slug), `deleteHero` (DELETE por slug) y `uploadHeroImage` (URL, archivo crudo como body y `Content-Type` del archivo).
- **Poderes (chips)**: agregar con trim, ignorar valor compuesto solo de espacios, eliminar actualiza signal y FormControl.
- **Directiva `transform-text-uppercase`**: transformación a mayúsculas, posición del cursor restaurada tras editar en el medio, texto pegado, integración con el DOM real.
- **Navegación**: `Cancelar` vuelve a `/heroes`; errores del servicio muestran diálogo de error sin romper la página.

## Estructura del proyecto

```text
src/
├── app/
│   ├── app.config.ts          # Providers: router (con ComponentInputBinding), http, SweetAlert2, paginator en español, image loader (Cloudinary)
│   ├── app.routes.ts          # Rutas: shell (home-page) + heroes / new-hero / edit-hero / view-hero con mode en route data
│   ├── environments/
│   │   └── environment.ts     # url de la API (http://localhost:4000) y base de Cloudinary
│   ├── app.ts / app.html      # Shell de la aplicación
│   ├── components/
│   │   ├── filters/               # Filtros de búsqueda (nombre/alias) con debounce, hidratación desde la URL y output único
│   │   └── custom-upload-image/   # Subida de imagen encapsulada (selección, preview con object URL, emisión del archivo crudo)
│   ├── heroes/
│   │   └── components/
│   │       ├── heroes-grid/           # Grilla paginada: estado de la vista (filtros + paginación) vive en la URL
│   │       ├── hero-grid-card/        # Card individual (consultar, editar, eliminar con confirmación)
│   │       ├── new-hero/              # Formulario de alta (reactive forms + chips de poderes)
│   │       └── edit-hero/             # Formulario de edición
│   ├── pages/
│   │   ├── home-page/             # Shell de navegación (router outlet de las páginas internas)
│   │   ├── heroes-page/           # Listado: compone filtros + grilla
│   │   ├── new-hero-page/         # Ruta de alta (mode: 'create')
│   │   └── edit-hero-page/        # Ruta de edición/consulta (mode: 'edit' | 'view', resource por heroSlug)
│   ├── services/
│   │   ├── heroes.ts              # HeroesService: CRUD + paginación/filtros + subida de imagen sobre la API
│   │   └── heroes-utils.ts        # HeroesUtilsService: refresh del grid (contador) y enforceMaxLength
│   ├── interfaces/
│   │   ├── heroes.interface.ts    # Hero + respuestas del contrato real (GetHeroesResponse, New/Edit/DeleteHeroResponse, UploadImageResponse)
│   │   └── shared.interface.ts
│   ├── directives/
│   │   └── transform-text-uppercase.ts  # Input forzado a mayúsculas preservando el cursor
│   └── shared/
│       ├── error-state-matcher.ts       # HeroErrorStateMatcher (única, compartida)
│       ├── pagination.constants.ts      # Defaults y límites de paginación (espejan la validación del backend)
│       └── i18n/
│           ├── es.ts                    # Textos centralizados (preparado para i18n)
│           └── spanish-paginator-intl.ts # MatPaginatorIntl en español
├── index.html                 # <html lang="es">
├── main.ts
└── styles.scss                # Theme de Material + overrides por Component Tokens + Tailwind

public/
└── images/
    └── placeholder.svg        # Imagen de reserva (héroe sin imagen o URL rota)
```

## Contrato del backend consumido

El backend (`heroes-app-backend`, Express + MongoDB) es la única fuente de datos de la app. El contrato que consume el frontend:

> **Estado**: integración completa — listado paginado (`GET /heroes`), consulta por slug (`GET /heroes/:slug`), alta (`POST /heroes` + imagen), edición (`PATCH /heroes/:slug` + imagen condicional) y borrado (`DELETE /heroes/:slug`).

| Tema | Contrato |
|---|---|
| Identificador | `slug` único (regenerado al cambiar el alias: la URL vieja pasa a `404`) |
| Listado | `GET /heroes` paginado con `page`/`elements_per_page`; responde `total_pages/current_page/elements_per_page/total_elements/data`. El filtrado por nombre/alias queda pendiente de definirse en el contrato |
| Consulta | `GET /heroes/:slug`: 200 con el héroe directo (sin wrapper), 404 si no existe |
| Alta | Doble paso: `POST /heroes` con JSON (`image: ''`, límite del body 100KB) y, con el `slug` de la respuesta, `POST /heroes/:slug/image` con el archivo crudo (máx 1MB). Si la subida falla, el héroe ya quedó creado: se avisa y la imagen se puede reintentar desde Editar |
| Edición | `PATCH /heroes/:slug` con semántica parcial (whitelist del backend). `name` inmutable: queda read-only en el form y no viaja en el PATCH. `alias` editable regenera el slug (la URL vieja pasa a `404`); la imagen se re-sube solo si se eligió archivo nuevo, con el slug del response |
| Borrado | `DELETE /heroes/:slug`: 200 con `{ msg }` (sin `response`); el grid se refresca vía `heroDeleted` |
| Imagen | Endpoint separado `POST /heroes/:slug/image`, binario crudo (`Content-Type: image/png|jpeg`, máx 1MB), hosting en Cloudinary |
| Errores | `400` con `errors[]` de validación, `409` por unicidad (alias/slug), `404` no encontrado, `403` CORS |
