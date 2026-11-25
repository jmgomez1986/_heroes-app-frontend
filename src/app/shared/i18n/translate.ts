/** Nombres de los placeholders {{nombre}} presentes en el texto. */
type Placeholders<S extends string> = S extends `${string}{{${infer Name}}}${infer Rest}`
  ? Name | Placeholders<Rest>
  : never;

/**
 * Traduce un texto reemplazando sus placeholders {{nombre}} por los valores recibidos.
 * Los placeholders sin valor se dejan intactos para detectarlos fácilmente.
 *
 * @example
 * translate(I18N.maxLengthMessageGeneral, { maxLength: 20 });
 * // 'El campo debe tener un máximo de 20 caracteres.'
 */
export const translate = <S extends string>(
  template: S,
  params?: Record<Placeholders<S>, string | number>,
): string => {
  let text: string = template;
  const values: Record<string, string | number> = params ?? {};

  for (const [name, value] of Object.entries(values)) {
    text = text.replaceAll(`{{${name}}}`, String(value));
  }

  return text;
};
