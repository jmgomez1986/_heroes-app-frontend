/**
 * Textos de la aplicación en español, centralizados para facilitar la internacionalización (i18n).
 */
export const I18N = {
  heroes: {
    grid: {
      empty: 'No se encontraron resultados.',
      loadErrorTitle: 'Error de servidor',
      loadErrorText: 'No se pudo cargar el catálogo. Intente nuevamente.',
    },
    card: {
      confirmDeleteTitle: '¿Está seguro que desea eliminar el héroe',
      confirmDeleteText: 'Se eliminará de la base de datos el héroe elegido',
      confirmButton: 'Eliminar',
      cancelButton: 'Cancelar',
      deleteSuccessTitle: 'Se eliminó el héroe con éxito',
      deleteSuccessText: 'El Héroe ha sido eliminado.',
      deleteErrorTitle: 'Error',
      deleteErrorText: 'No se pudo eliminar el héroe. Intente nuevamente.',
      editButton: 'Editar héroe',
      viewButton: 'Ver héroe',
      deleteButton: 'Eliminar héroe',
      imageAlt: 'Imagen de ',
      powersTitle: 'Poderes',
      more: ' más',
    },
  },
  form: {
    confirmSaveTitle: '¿Está seguro que desea guardar los cambios realizados?',
    confirmSaveCreateText: 'Se creará un nuevo Héroe con los datos cargados.',
    confirmSaveEditText: 'Se guardarán los cambios realizados.',
    saveSuccessTitle: 'Se guardó con éxito',
    saveSuccessCreateText: 'Tú nuevo Héroe ha sido creado.',
    saveSuccessEditText: 'El Héroe ha sido editado',
    saveErrorTitle: 'Error',
    saveErrorCreateText: 'No se pudo guardar el héroe. Intente nuevamente.',
    saveErrorEditText: 'No se pudo editar el héroe. Intente nuevamente.',
    // El héroe ya quedó creado: solo falló la subida de la imagen (se puede reintentar desde Editar).
    saveImageErrorCreateText:
      'El héroe se creó correctamente, pero no se pudo subir la imagen. Intente nuevamente desde Editar.',
    // El héroe ya quedó editado: solo falló la subida de la imagen (se puede reintentar desde Editar).
    saveImageErrorEditText:
      'El héroe se editó correctamente, pero no se pudo subir la imagen. Intente nuevamente desde Editar.',
    confirmCreate: 'Crear',
    confirmEdit: 'Editar',
    cancel: 'Cancelar',
    save: 'Guardar',
    fieldRequired: 'El campo es obligatorio',
    discardChangesTitle: '¿Descartar cambios sin guardar?',
    discardChangesText:
      'Tienes cambios sin guardar en el formulario. ¿Estás seguro de que quieres salir?',
    discardConfirm: 'Sí, salir',
    discardCancel: 'No, quedarme',
  },
  upload: {
    selectFile: 'Seleccionar archivo de imagen',
    choose: 'Elegir imagen',
    noImage: 'Ninguna imagen seleccionada',
    loaded: 'Imagen cargada con éxito',
    existing: 'Imagen existente',
    maxSizeError: 'La imagen debe pesar como máximo 1 MB.',
    invalidTypeError: 'Solo se permiten imágenes JPG, JPEG o PNG.',
    maxSizeHint: 'Tamaño máximo: 1 MB · Formatos: JPG, JPEG, PNG',
    previewAlt: 'Previsualización de la imagen del Héroe',
    label: 'Imagen del Héroe',
  },
  paginator: {
    itemsPerPageLabel: 'Ítems por página:',
    nextPageLabel: 'Página siguiente',
    previousPageLabel: 'Página anterior',
    firstPageLabel: 'Primera página',
    lastPageLabel: 'Última página',
    ofLabel: 'de',
  },
  common: {
    addHero: 'Agregar un nuevo héroe',
    filters: 'Filtros',
    cancel: 'Cancelar',
  },
} as const;
