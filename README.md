## Juan Matias Gomez Andersen

## Instalar dependencias

```bash
npm i
```

## Development server

Para correr el servidor de desarrollo del frontend

```bash
ng serve
```

or

```bash
npm run start
```

## Levantar Servidor mockeado con json-server

Para correr el servidor de desarrollo del backtend

```bash
npm run api
```

Una vez que el servidor esta en ejecucion, en el navegador usar `http://localhost:4200/`

## Running unit tests

Para los test unitarios, se usa Vitest

```bash
ng test
```

Para ejecutar los test y que se genere el reporte del coverage

```bash
npm run test:coverage
```

## NOTAS

- Se configura un proxy por ser una buena practica para json-serve, no es necesario, pero evita problemas de CORS y el uso de rutas relativas como /api/heroes, y queria hacer una implementacion lo mas completa posible
- Se crea el archivo server.mjs para aumentar el limite los endpoints, y se cambio el script para levantar el backend, informacion sacada de documentacion y pos, esto es para poder permitir la subida de imagenes, aunque esta limitada a 1mb, al hacer el POS por ejemplo como para la imagen se guarda en base64, daba un error 500
- Por otro lado se encapsulo todo lo relativo a subida de imagen en un componente para que no "ensucie" el resto del formulario ya que termino siendo complejo y extens
- Para el backend se utiliza json-server
- Se utiliza Reactive forms
- Para la UI, se usa Angular Material
