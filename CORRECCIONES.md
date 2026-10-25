# Correcciones post-evaluación

Backlog de mejoras derivado de la devolución del proceso de evaluación.

## 1. Requerimientos funcionales (enunciado)

- [x] **Búsqueda con coincidencia parcial en el servicio**
  - `HeroesService.getHeroesPaginated(page, size, query)`: filtra en memoria por nombre
    (y alias) con coincidencia parcial, case-insensitive y trim. La lógica de búsqueda
    ya no se delega al mock, pero se **preserva el contrato de respuesta paginada** de
    json-server (`HeroesResponsePaginated`: first/prev/next/pages/items/data).
  - Se conserva `getHeroesPaginated` como método único de búsqueda+paginación (filtra
    nombre/alias y pagina preservando el contrato json-server).
  - Unit tests de comportamiento: parcial, case-insensitive, trim, sin resultados,
    query vacía, paginación (prev/next/pages/items) y filtro por alias.
- [x] **Quitar el mínimo de 3 caracteres**
  - Se eliminó `Validators.minLength(3)` y la condición `query.length >= 3` de Filters.
  - El debounce de 1000 ms ya controla la cantidad de llamadas.
  - Tests actualizados: 1-2 caracteres ahora sí disparan la búsqueda; el control
    inválido (sup >= 20) sigue sin emitir.
  - Se eliminaron los `mat-error` de "al menos 3 caracteres" de filters.html.
- [x] **Tests de casos límite de la grilla**
  - Test del estado vacío: `@empty` → "No se encontraron resultados.".
  - Paginación al borrar el último elemento: `effect` en HeroesGrid detecta la
    respuesta con `data` vacía estando en una página > 1 (página fuera de rango
    tras el borrado) y retrocede a la última página con datos
    (`Math.max(1, resp.pages)`); con `items: 0` cae a la página 1 (estado vacío
    legítimo). Elegido sobre "ir siempre a página 1" porque conserva el contexto
    del usuario en borrados sucesivos y escala con el crecimiento del dataset.
    Test con mock consciente de la página pedida: página 2 fuera de rango →
    vuelve a la 1 y renderiza los 10 héroes restantes.

## 2. Accesibilidad

- [x] `mat-label` dentro de cada `<mat-form-field>` (Filters y NewHero) para que
      Material asocie programáticamente la etiqueta con el input.
- [x] Revisar `aria-label` del paginador y textos de botones.

## 3. Arquitectura y rendering

- [x] `changeDetection: ChangeDetectionStrategy.OnPush` en los 11 componentes
      (app, home/heroes/new/edit pages, grid, card, filters, new-hero, edit-hero,
      custom-upload-image).
- [x] Corregir ruta comodín: la ruta externa `path: '*'` → `path: '**'` en
      `app.routes.ts` (la interna de children ya era `**`; la externa quedaba
      inactiva como código muerto).
- [x] Eliminar código muerto e imports huérfanos (detectados con ESLint):
      `Validators` sin uso (custom-upload-image), `By`/`Router` + variable `router`
      sin uso (edit-hero-page.spec), `mockHeroBody` sin uso (heroes.spec), parámetro
      `resp` sin usar (hero-grid-card). NOTA: `getHeroes()` y `DestroyRef` NO eran
      código muerto (se usan en `getHeroesPaginated` y `takeUntilDestroyed`).
- [x] Configurar ESLint: `angular-eslint@21.4.0` con flat config (`eslint.config.js`),
      reglas de selectores y `templateAccessibility` para HTML. `ng lint` sin errores.
      Correcciones surgidas del lint: `prefer-inject` en la directiva de mayúsculas
      (spec adaptado a `runInInjectionContext`), selector del host de test con prefijo
      `app`, arrows vacías en specs → `() => undefined`, y label "Estado" asociado
      (`for`/`id` + `aria-labelledby` desde el texto visible).

## 4. Rendimiento

- [x] **NgOptimizedImage** en las cards: `ngSrc` para imágenes de archivo (`/images/*`).
      Las imágenes base64 (subidas) se excluyen de la directiva (data URLs no soportadas).

## 5. Estilos

- [x] Reemplazar overrides con !important (styles.scss, clases !bg-_, !shadow-_, !text-*)
      por la API de overrides de Angular Material (mixins mat.form-field-overrides y
      mat.paginator-overrides incluidos en el selector html del theme global,
      junto a mat.theme, segun la guia theming > "Component Tokens").
- [x] Responsive de:
  - Grilla de heroes
  - Card de cada heroe
  - Filtros en la grilla
  - Formulario de creacion/Edicion/Consulta de heroe

# Extras:

## Traducciones

Se prepara el desarrollo centralizando textos para un futuro agregar cambio de idioma i18n
