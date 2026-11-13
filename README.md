# Heroes App — Frontend

Aplicación para administrar un catálogo de superhéroes: listado paginado con búsqueda, alta, edición, consulta y borrado. Construida con **Angular 21** (standalone + signals), **Angular Material** y **Tailwind CSS 4**, consumiendo una API REST de héroes (mockeada con json-server en desarrollo).

## Stack

| Herramienta | Uso |
|---|---|
| Angular 21 | Framework (standalone components, signals: `resource()`, signal `input`/`output`, `effect`, `takeUntilDestroyed`) |
| Angular Material 21 + Tailwind CSS 4 | UI: componentes Material con overrides por Component Tokens + utilidades de Tailwind |
| Reactive Forms | Formularios de alta/edición con validaciones |
| SweetAlert2 (`@sweetalert2/ngx-sweetalert2`) | Diálogos de confirmación, éxito y error |
| Vitest + Testing Library | Tests unitarios con cobertura (`@vitest/coverage-v8`) |
| ESLint (`angular-eslint` flat config) + Prettier | Calidad y formato de código |
| json-server (beta) | Mock API REST sobre `db.json`, levantada con `server.mjs` |

## Puesta en marcha

1. Instalar dependencias: `npm i`
2. Levantar el mock de la API: `npm run api` (escucha en `http://localhost:3000`)
3. Levantar el frontend: `npm start` (escucha en `http://localhost:4200`)
4. Verificar: abrir `http://localhost:4200` y navegar a la grilla de héroes

El frontend usa el proxy de desarrollo (`proxy.conf.json`): toda request a `/api/*` se redirige al mock en el puerto 3000 con `pathRewrite` (el prefijo `/api` se elimina). Esto permite consumir la API con rutas relativas (`/api/heroes`) sin problemas de CORS en desarrollo.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo (`ng serve`) con el proxy a la API |
| `npm run api` | Levanta el mock de la API (`server.mjs`, json-server) |
| `npm run build` | Compila la aplicación a `dist/` |
| `npm run watch` | Compilación con recarga (`--configuration development`) |
| `npm test` | Suite de tests unitarios (Vitest) |
| `npm run test:coverage` | Ídem + reporte de cobertura en `coverage/` (abrir `coverage/index.html`) |
| `npm run lint` | Análisis estático (angular-eslint) |

## Configuración del mock de la API

El `server.mjs` levanta json-server (beta) con una personalización: **eleva el límite del parser de body de 100 KiB a 5 MB**. El parser de json-server (`milliparsec`) corta en 100 KiB por defecto, insuficiente para las imágenes subidas, que viajan en base64 dentro del JSON (un archivo de 1 MB crece ~33% al codificarse). Solo se reemplaza el handler de ese middleware; el resto (rutas REST, paginado) queda intacto.

> **Advertencia**: el reemplazo del middleware usa los internos de json-server **beta** (`findLast` sobre la lista de middlewares de la app). Cualquier actualización mayor del paquete puede romper este punto: revisarlo antes de upgradear.

Los datos viven en `db.json` (catálogo de 25 héroes). Las imágenes estáticas del catálogo están en `public/images/` y se referencian por nombre de archivo (`1.jpeg`); las imágenes subidas por el usuario viajan como data URL (base64) y se guardan en el mismo campo `image`.

## Decisiones de diseño

| Decisión | Motivo |
|---|---|
| **Búsqueda en el servicio, no en el mock** | `HeroesService.getHeroesPaginated(page, size, query)` filtra en memoria por nombre y alias con coincidencia parcial, case-insensitive y trim, y pagina preservando el contrato de respuesta de json-server (`HeroesResponsePaginated`: `first/prev/next/last/pages/items/data`). La lógica de negocio vive en la app, no en el mock |
| **El modo (`create`/`edit`/`view`) viaja en el `data` de la ruta** | Antes se leía de `router.currentNavigation()?.extras?.state`, que se pierde al recargar el navegador: refrescar `/view-hero/:id` dejaba el formulario editable (bug). Con el modo en la configuración de la ruta (`app.routes.ts`), sobrevive a la recarga. Editar y ver comparten `edit-hero-page` con el modo por signal input |
| **UX de límite de caracteres (aviso antes de cortar)** | Sin atributo nativo `maxlength`: el input deja escribir hasta `maxLength + 1`; al llegar ahí `Validators.maxLength` marca el error y el `mat-error`/`mat-hint` avisan, y por encima de ese tope `HeroesUtilsService.enforceMaxLength` recorta el valor (y el control) preservando el cursor. Así el usuario recibe el aviso del validador antes del corte manual, en lugar de chocar contra un límite silencioso. Centralizado en `heroes-utils.ts` y usado por todos los campos acotados |
| **Subida de imagen encapsulada en un componente** | `custom-upload-image` aísla toda la complejidad (selección de archivo, preview, emisión del base64) para no "ensuciar" el formulario de héroe, que ya es extenso. Las imágenes base64 (data URLs) se excluyen de `NgOptimizedImage` (la directiva no soporta data URLs); las estáticas sí la usan (`ngSrc`) |
| **Suscripciones dentro de callbacks de SweetAlert2 con `takeUntilDestroyed`** | El diálogo es asíncrono: el componente puede destruirse entre la confirmación del diálogo y la respuesta HTTP. La suscripción se protege con `takeUntilDestroyed(DestroyRef)` para no operar sobre un contexto destruido |
| **`HeroErrorStateMatcher` única en `shared/`** | Se detectó duplicada en dos componentes y se extrajo a `src/app/shared/error-state-matcher.ts` para reutilizarla |
| **Refresco del grid con un contador (signal), no un booleano** | `HeroesUtilsService.refreshLoad()` incrementa un contador: dos refrescos en el mismo tick nunca se cancelan entre sí (con un booleano `false → true → false` el cambio de señal se pierde y el grid podría no recargar) |
| **Paginación al borrar el último elemento de una página > 1** | El `effect` en `heroes-grid` detecta la respuesta con `data` vacía en una página fuera de rango y retrocede a la última página con datos (`Math.max(1, resp.pages)`); con `items: 0` cae a la página 1 (estado vacío legítimo). Conserva el contexto del usuario en borrados sucesivos en lugar de saltar siempre a la página 1 |
| **Proxy en desarrollo** | Rutas relativas (`/api/heroes`), cero CORS en dev y una sola fuente de configuración (`proxy.conf.json`) |
| **`changeDetection: OnPush` en todos los componentes** | Rendimiento y disciplina de signals: el rendering depende de inputs y señales, no de checks globales |
| **Overrides de Material por Component Tokens** | Los overrides de estilo (`mat.form-field-overrides`, `mat.paginator-overrides`) van por la API oficial de theming en `styles.scss`, en lugar de clases `!important` |
| **Paginador y textos en español** | `MatPaginatorIntl` provisto por `getSpanishPaginatorIntl` (`shared/i18n/spanish-paginator-intl.ts`); textos centralizados en `shared/i18n/es.ts` dejando preparada la centralización para un futuro cambio de idioma (i18n) |
| **Código y UI en español** | Convención del proyecto: comentarios y textos de interfaz en español (`<html lang="es">`); mensajes de API/mocks según el contrato del backend |

## Edge cases cubiertos con tests

La suite (Vitest + Testing Library) cubre entre otros:

- **Búsqueda**: coincidencia parcial, case-insensitive, trim, sin resultados, query vacía y filtro por alias; el control inválido no emite, y el debounce controla la frecuencia de llamadas.
- **Grilla**: estado vacío (`@empty` → "No se encontraron resultados.") y retroceso de página tras borrar el último elemento de una página fuera de rango.
- **Formulario de héroe**: campos requeridos con sus `mat-error`, límites por campo (`name`/`alias`/`team` máx 20, `universe` máx 10, `description` máx 150), comportamiento de `enforceMaxLength` (recorte en `max + 1`, `mat-hint` solo al alcanzar el máximo), botón `Guardar` deshabilitado con formulario inválido, y no se llama al servicio sin confirmación.
- **Modos create/edit/view**: en `create` llama a `addNewHero`, en `edit` a `editHero`; en `view` el formulario queda deshabilitado y sin botón `Guardar`; títulos por modo (`Ver Héroe` / `Editar Héroe`).
- **Carga por resource**: `edit-hero-page` llama a `getHeroById`, distingue valor cargado de estado de error y muestra el mensaje de carga fallida.
- **Poderes (chips)**: agregar con trim, ignorar valor compuesto solo de espacios, eliminar actualiza signal y FormControl.
- **Directiva `transform-text-uppercase`**: transformación a mayúsculas, posición del cursor restaurada tras editar en el medio, texto pegado, integración con el DOM real.
- **Navegación**: `Cancelar` vuelve a `/heroes`; errores del servicio muestran diálogo de error sin romper la página.

## Estructura del proyecto

```text
src/
├── app/
│   ├── app.config.ts          # Providers: router (con ComponentInputBinding), http, SweetAlert2, paginator en español
│   ├── app.routes.ts          # Rutas: shell (home-page) + heroes / new-hero / edit-hero / view-hero con mode en route data
│   ├── app.ts / app.html      # Shell de la aplicación
│   ├── components/
│   │   ├── filters/               # Filtros de búsqueda (nombre/alias) con debounce, Signal Outputs
│   │   └── custom-upload-image/   # Subida de imagen encapsulada (selección, preview, base64)
│   ├── heroes/
│   │   └── components/
│   │       ├── heroes-grid/           # Grilla paginada con resource() y rollback de página
│   │       ├── hero-grid-card/        # Card individual (consultar, editar, eliminar con confirmación)
│   │       ├── new-hero/              # Formulario de alta (reactive forms + chips de poderes)
│   │       └── edit-hero/             # Formulario de edición
│   ├── pages/
│   │   ├── home-page/             # Shell de navegación (router outlet de las páginas internas)
│   │   ├── heroes-page/           # Listado: compone filtros + grilla
│   │   ├── new-hero-page/         # Ruta de alta (mode: 'create')
│   │   └── edit-hero-page/        # Ruta de edición/consulta (mode: 'edit' | 'view', resource por heroId)
│   ├── services/
│   │   ├── heroes.ts              # HeroesService: CRUD + búsqueda/paginación sobre la API
│   │   └── heroes-utils.ts        # HeroesUtilsService: refresh del grid (contador) y enforceMaxLength
│   ├── interfaces/
│   │   ├── heroes.interface.ts    # Hero, Filters, HeroesResponsePaginated, NewHeroResponse
│   │   └── shared.interface.ts
│   ├── directives/
│   │   └── transform-text-uppercase.ts  # Input forzado a mayúsculas preservando el cursor
│   └── shared/
│       ├── error-state-matcher.ts       # HeroErrorStateMatcher (única, compartida)
│       └── i18n/
│           ├── es.ts                    # Textos centralizados (preparado para i18n)
│           └── spanish-paginator-intl.ts # MatPaginatorIntl en español
├── index.html                 # <html lang="es">
├── main.ts
└── styles.scss                # Theme de Material + overrides por Component Tokens + Tailwind

public/
└── images/                    # Imágenes estáticas del catálogo

server.mjs                     # Mock API (json-server + límite de payload 5 MB)
db.json                        # Datos del mock (25 héroes)
proxy.conf.json                # Proxy /api → localhost:3000
```

## Integración con el backend real (pendiente)

El proyecto surgió de un challenge contra un mock (json-server); el backend final (`heroes-app-backend`, Express + MongoDB) expone un **contrato distinto** que la integración deberá absorber:

| Tema | Mock actual | Backend real |
|---|---|---|
| Identificador | `id` | `slug` (regenerado al cambiar el alias: la URL vieja pasa a `404`) |
| Edición | `PUT` con el objeto completo | `PATCH` con whitelist de campos (`name` inmutable) |
| Paginación | `first/prev/next/last/pages/items/data` | `total_pages/current_page/elements_per_page/total_elements/data` con `page` y `elements_per_page` |
| Búsqueda | Filtrada en memoria en el servicio | A definir en el contrato (`/api/heroes` paginado) |
| Imagen | Base64 dentro del JSON del héroe | Endpoint separado `POST /heroes/:slug/image`, binario crudo (`Content-Type: image/png|jpeg`, máx 1MB), hosting en Cloudinary |
| Errores | `400`/`404` genéricos | `400` con `errors[]` de validación, `409` por unicidad (alias/slug), `403` CORS |
