# Heroes App — Frontend

Aplicación para administrar un catálogo de superhéroes: listado paginado con búsqueda, alta, edición, consulta y borrado. Construida con **Angular 21** (standalone + signals), **Angular Material** y **Tailwind CSS 4**, consumiendo la API REST del backend real (`heroes-app-backend`, Express + MongoDB) con imágenes hosteadas en Cloudinary.

## Stack

| Herramienta | Uso |
|---|---|
| Angular 21 | Framework (standalone components, signals: `resource()`, signal `input`/`output`, `effect`, `takeUntilDestroyed`) |
| Angular Material 21 + Tailwind CSS 4 | UI: componentes Material con overrides por Component Tokens + utilidades de Tailwind. En Tailwind v4 el modificador `important` se escribe como **sufijo** (`bg-white!`); el prefijo (`!bg-white`) es la sintaxis legacy |
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
| **Filtros y paginación con estado en la URL** | La URL es la única fuente de verdad de la vista (`heroes-grid`): los query params (`name`, `alias`, `page`, `elements_per_page`) llegan como signal vía `toSignal(queryParamMap)` y alimentan el objeto único `filters` (una *vista* de la URL, no estado duplicado). Aplicar un filtro o paginar escribe la URL con `router.navigate` (`merge` + `replaceUrl: true`: el debounce y la paginación no ensucian el historial). Así compartir el link, recargar el navegador y el botón atrás reproducen exactamente la vista. La política de serialización se decide **una sola vez** en el helper `navigate()` (único punto de escritura): `page` y `elements_per_page` viajan siempre, explícitos también en sus defaults (`page=1`, `size=10`); los filtros de texto solo con valor y recortados. `page`/`size` se sanitizan contra los límites del backend (`shared/pagination.constants.ts`). Agregar un filtro futuro = campo en `Filters` + línea en el mapper del servicio + el param del backend |
| **El modo (`create`/`edit`/`view`) viaja en el `data` de la ruta** | Antes se leía de `router.currentNavigation()?.extras?.state`, que se pierde al recargar el navegador: refrescar `/view-hero/:id` dejaba el formulario editable (bug). Con el modo en la configuración de la ruta (`app.routes.ts`), sobrevive a la recarga. Editar y ver comparten `edit-hero-page` con el modo por signal input |
| **UX de límite de caracteres (aviso antes de cortar)** | Sin atributo nativo `maxlength`: el input deja escribir hasta `maxLength + 1`; al llegar ahí `Validators.maxLength` marca el error y el `mat-error`/`mat-hint` avisan, y por encima de ese tope `HeroesUtilsService.enforceMaxLength` recorta el valor (y el control) preservando el cursor. Así el usuario recibe el aviso del validador antes del corte manual, en lugar de chocar contra un límite silencioso. Centralizado en `heroes-utils.ts` y usado por todos los campos acotados |
| **Carga de imagen aislada en su propio componente** | `load-image-hero` encapsula selección, validación de formato/tamaño, error visible, preview y emisión del archivo crudo; el formulario (`new-hero`) queda con una sola responsabilidad: los campos. En el layout de dos columnas (`lg:grid-cols-2`) la derecha es únicamente este componente. Accesibilidad: un `<label [for]>` con id único por instancia envuelve el dropzone (click y `focus-within` nativos, sin `.click()` por JS), el archivo inválido se anuncia con `role="alert"` en vez de solo `console.warn`, y en `view` desaparecen el prompt y el overlay de reemplazo. El panel tiene **alto fijo** en todos los anchos (`h-131` en la columna derecha de `new-hero`, con `h-full` en el panel): así cargar una imagen o crecer el formulario (chips, mensajes de error) no lo estira. La primera versión usaba `aspect-[3/4]`, que deriva el alto del **ancho** de la columna y en ventanas angostas producía un panel desproporcionadamente alto. El preview se genera con `URL.createObjectURL` revocado al reemplazar y al destruir (no base64: `NgOptimizedImage` no soporta data URLs; las estáticas sí usan `ngSrc`) |
| **Formulario tipado y submit nativo** | `fb.nonNullable` da un `FormGroup` con controles no nulos (`heroForm.invalid` y los valores no arrastran `null`). Los botones viven fuera de la `mat-card` pero dentro del único `<form (ngSubmit)="onSubmit()">`: `Guardar` es `type="submit"`, así Enter en cualquier campo envía, y `Cancelar` es `type="button"` para no disparar el submit |
| **Suscripciones dentro de callbacks de SweetAlert2 con `takeUntilDestroyed`** | El diálogo es asíncrono: el componente puede destruirse entre la confirmación del diálogo y la respuesta HTTP. La suscripción se protege con `takeUntilDestroyed(DestroyRef)` para no operar sobre un contexto destruido |
| **`HeroErrorStateMatcher` única en `shared/`** | Se detectó duplicada en dos componentes y se extrajo a `src/app/shared/error-state-matcher.ts` para reutilizarla |
| **Refresco del grid con un contador (signal), no un booleano** | `HeroesUtilsService.refreshLoad()` incrementa un contador: dos refrescos en el mismo tick nunca se cancelan entre sí (con un booleano `false → true → false` el cambio de señal se pierde y el grid podría no recargar) |
| **Título "Catálogo de Superhéroes" como Home** | El título es clickeable (`cursor-pointer`): con query params en la URL navega a `/heroes` (la limpieza dispara el re-GET del resource); con la URL ya limpia (donde el navigate es no-op) fuerza el refresco vía el contador `refreshLoad()`. En ambos casos es exactamente un GET |
| **Error del GET con aviso y estado vacío (sin spinner infinito)** | Si el GET falla (ej: servidor caído), el `effect` en `heroes-grid` reacciona al signal `error()` del resource: muestra un SweetAlert de error de servidor y la grilla renderiza el estado vacío; el spinner solo corresponde a una carga genuina. Importante: leer `heroesResource.value()` en estado de error lanza `ResourceValueError` — todos los accesos (rollback effect y `length` del paginador) se protegen con `hasValue()` |
| **Paginación al borrar el último elemento de una página > 1** | El `effect` en `heroes-grid` detecta la respuesta con `data` vacía en una página fuera de rango y retrocede a la última página con datos (`Math.max(1, resp.total_pages)`); con catálogo vacío cae a la página 1 (estado vacío legítimo). Conserva el contexto del usuario en borrados sucesivos en lugar de saltar siempre a la página 1 |
| **API con URLs absolutas, sin proxy de desarrollo** | Todas las requests se construyen sobre `environment.url` (`http://localhost:4000`): el backend habilita CORS y no hace falta proxy; una sola fuente de configuración para apuntar a otro entorno |
| **`changeDetection: OnPush` en todos los componentes** | Rendimiento y disciplina de signals: el rendering depende de inputs y señales, no de checks globales |
| **Overrides de Material por Component Tokens** | Los overrides de estilo (`mat.form-field-overrides`, `mat.paginator-overrides`) van por la API oficial de theming en `styles.scss`, en lugar de clases `!important` |
| **Paginador y textos en español** | `MatPaginatorIntl` provisto por `getSpanishPaginatorIntl` (`shared/i18n/spanish-paginator-intl.ts`); textos centralizados en `shared/i18n/es.ts` dejando preparada la centralización para un futuro cambio de idioma (i18n) |
| **Shell único con header, breadcrumb y footer** | `app.html` define la columna `header + main(router-outlet) + footer` (`flex min-h-screen flex-col`): el footer queda al pie incluso en páginas cortas. El header es sticky y agrupa marca, navegación principal y CTA de alta; el breadcrumb vive en el shell, **debajo del header** y alineado al mismo contenedor (`max-w-7xl`) que las páginas, deriva los segmentos de la URL (sin fetch extra, el alias sale del slug) y marca el segmento actual con `aria-current="page"` |
| **Contadores del catálogo con degradación silenciosa** | `GET /heroes/stats` alimenta un `resource()` en `heroes-page`; si falla (endpoint ausente o servidor caído) la sección se oculta sin error visible. El renderer `hero-stats` es genérico: recibe `StatCardEntry[]` y agregar una card nueva es agregar una entrada, no tocar el componente |
| **Selector de items por página arriba, paginador abajo** | `mat-paginator` es un bloque único (selector + rango + flechas), sin API para separar sus partes. Para mover solo el selector se extrajo `hero-count-selector` (pill "Mostrando X de Y" + `mat-select`), reutilizable (todo por `input()`/`output()`) y sin conocimiento del backend ni de la URL. El paginador queda debajo de la grilla con `[hidePageSize]="true"`; cambiar el tamaño vuelve a la página 1 y escribe la URL canónica |
| **Código y UI en español** | Convención del proyecto: comentarios y textos de interfaz en español (`<html lang="es">`); mensajes de la API según el contrato del backend |

## Edge cases cubiertos con tests

La suite (Vitest + Testing Library) cubre el contrato real del backend entre otros:

- **Formulario de héroe**: campos requeridos con sus `mat-error`, límites por campo (`name`/`alias`/`team` máx 20, `universe` máx 10, `description` máx 150), comportamiento de `enforceMaxLength` (recorte en `max + 1`, `mat-hint` solo al alcanzar el máximo), botón `Guardar` deshabilitado con formulario inválido, envío con Enter sobre el formulario (evento `submit` nativo, no click programático), y no se llama al servicio sin confirmación.
- **Modos create/edit/view**: en `create` llama a `addNewHero`, en `edit` a `editHero`; en `view` el formulario queda deshabilitado y sin botón `Guardar`; títulos por modo (`Ver Héroe` / `Editar Héroe`).
- **Carga por resource**: `edit-hero-page` llama a `getHeroBySlug`, distingue valor cargado de estado de error y muestra el mensaje de carga fallida.
- **Alta con imagen separada**: el payload de `addNewHero` lleva `image: ''`; con archivo seleccionado se sube después con el `slug` de la respuesta (orden create→upload verificado); sin archivo no se sube nada; si la subida falla, aviso con `warning` y navegación al listado igualmente.
- **Edición con imagen condicional**: el PATCH por slug no lleva `name` (control disabled en modo edit); con archivo nuevo se sube después con el slug del response (alias cambiado regenera el slug, orden edit→upload verificado); sin archivo nuevo no se sube nada; fallo de subida → aviso con `warning` (texto por modo) y navegación al listado igualmente.
- **Filtros y paginación con estado en la URL** (`heroes-grid.spec.ts`, nuevo): la consulta toma `page`/`elements_per_page`/filtros de los query params; valores inválidos en la URL caen a los defaults; `applyFilters` escribe la URL con el filtro recortado y la página 1 explícita (los vacíos no viajan); `handlePageEvent` escribe `page` y `elements_per_page` (los defaults viajan explícitos); con data vacía en una página fuera de rango se vuelve a la última página con datos escribiendo la URL.
- **Error del GET** (`heroes-grid.spec.ts`): si la carga falla se muestra el SweetAlert de error de servidor con estado vacío en pantalla (sin spinner colgado); con carga exitosa el SweetAlert no se dispara.
- **Título como Home** (`heroes-page.spec.ts`): el click en el título navega a `/heroes` sin query params (con URL con filtros) y fuerza el refresco del GET solo cuando la URL ya estaba limpia.
- **Hidratación de filtros desde la URL** (`filters.spec.ts`): los controles se precargan con los filtros de la URL y se sincronizan al volver atrás/adelante, sin re-emitir (`emitEvent: false`, no hay loop URL → emit → URL).
- **Pill de conteo y selector de tamaño** (`hero-count-selector.spec.ts`, `heroes-grid.spec.ts`): el pill muestra los items de la página y el total del backend, y se oculta mientras carga o en error; el selector permanece visible; hay un único paginador y queda fuera del selector superior; cambiar el tamaño escribe `page=1` con el `elements_per_page` nuevo.
- **Contadores del catálogo** (`heroes-page.spec.ts`): con `GET /heroes/stats` exitoso la sección muestra total, héroes y villanos; con error la sección no se renderiza (sin excepción ni console.error).
- **Shell y navegación** (`header.spec.ts`, `breadcrumb.spec.ts`, `footer.spec.ts`): estado activo de los links del header según la URL, breadcrumb derivado de la ruta (alias capitalizado desde el slug) con `aria-current="page"` en el segmento actual.
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
│   │   ├── hero-image/            # Imagen del catálogo con fallback a placeholder
│   │   └── load-image-hero/       # Carga + preview de la imagen del héroe (columna derecha del formulario)
│   ├── heroes/
│   │   └── components/
│   │       ├── heroes-grid/           # Grilla paginada: estado de la vista (filtros + paginación) vive en la URL
│   │       ├── hero-grid-card/        # Card individual (consultar, editar, eliminar con confirmación)
│   │       ├── hero-stats/            # Renderer escalable de stat cards (recibe StatCardEntry[])
│   │       ├── hero-count-selector/   # Pill "Mostrando X de Y" + selector de items por página
│   │       ├── new-hero/              # Formulario tipado (reactive forms + chips de poderes) + columna de imagen
│   │       └── edit-hero/             # Wrapper de new-hero para los modos edit/view
│   ├── pages/
│   │   ├── home-page/             # Shell de navegación (router outlet de las páginas internas)
│   │   ├── heroes-page/           # Listado: compone filtros + grilla
│   │   ├── new-hero-page/         # Ruta de alta (mode: 'create')
│   │   └── edit-hero-page/        # Ruta de edición/consulta (mode: 'edit' | 'view', resource por heroSlug)
│   ├── services/
│   │   ├── heroes.ts              # HeroesService: CRUD + paginación/filtros + subida de imagen sobre la API
│   │   └── heroes-utils.ts        # HeroesUtilsService: refresh del grid (contador) y enforceMaxLength
│   ├── interfaces/
│   │   ├── heroes.interface.ts    # Hero + contrato real (GetHeroesResponse, New/Edit/DeleteHeroResponse, UploadImageResponse, HeroStats)
│   │   └── shared.interface.ts
│   ├── directives/
│   │   └── transform-text-uppercase.ts  # Input forzado a mayúsculas preservando el cursor
│   └── shared/
│       ├── components/                  # Shell: header sticky, breadcrumb navegable y footer
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

> **Estado**: integración completa — listado paginado (`GET /heroes`), consulta por slug (`GET /heroes/:slug`), alta (`POST /heroes` + imagen), edición (`PATCH /heroes/:slug` + imagen condicional), borrado (`DELETE /heroes/:slug`) y contadores (`GET /heroes/stats`).

| Tema | Contrato |
|---|---|
| Identificador | `slug` único (regenerado al cambiar el alias: la URL vieja pasa a `404`) |
| Listado | `GET /heroes` paginado con `page`/`elements_per_page`; responde `total_pages/current_page/elements_per_page/total_elements/data`. El filtrado por nombre/alias queda pendiente de definirse en el contrato |
| Consulta | `GET /heroes/:slug`: 200 con el héroe directo (sin wrapper), 404 si no existe |
| Alta | Doble paso: `POST /heroes` con JSON (`image: ''`, límite del body 100KB) y, con el `slug` de la respuesta, `POST /heroes/:slug/image` con el archivo crudo (máx 1MB). Si la subida falla, el héroe ya quedó creado: se avisa y la imagen se puede reintentar desde Editar |
| Edición | `PATCH /heroes/:slug` con semántica parcial (whitelist del backend). `name` inmutable: queda read-only en el form y no viaja en el PATCH. `alias` editable regenera el slug (la URL vieja pasa a `404`); la imagen se re-sube solo si se eligió archivo nuevo, con el slug del response |
| Borrado | `DELETE /heroes/:slug`: 200 con `{ msg }` (sin `response`); el grid se refresca vía `heroDeleted` |
| Imagen | Endpoint separado `POST /heroes/:slug/image`, binario crudo (`Content-Type: image/png|jpeg`, máx 1MB), hosting en Cloudinary |
| Contadores | `GET /heroes/stats`: `{ total_elements, total_heroes, total_villains }` (snake_case, conteo por `category`). Si falla, el frontend oculta la sección de contadores sin romper el catálogo |
| Errores | `400` con `errors[]` de validación, `409` por unicidad (alias/slug), `404` no encontrado, `403` CORS |
