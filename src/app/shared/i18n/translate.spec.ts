import { describe, expect, it } from 'vitest';
import { I18N } from './es';
import { translate } from './translate';

describe('translate', () => {
  it('replaces a single placeholder', () => {
    expect(translate(I18N.maxLengthMessageGeneral, { maxLength: 20 })).toBe(
      'El campo debe tener un máximo de 20 caracteres.',
    );
  });

  it('stringifies numeric values', () => {
    expect(translate('Quedan {{count}} ítems', { count: 3 })).toBe('Quedan 3 ítems');
  });

  it('replaces every occurrence of each placeholder', () => {
    expect(translate('{{a}} y {{b}} y {{a}}', { a: 1, b: 'dos' })).toBe('1 y dos y 1');
  });

  it('returns the text untouched when it has no placeholders', () => {
    expect(translate(I18N.messages.noResults)).toBe('No se encontraron resultados.');
  });

  it('leaves placeholders without a value intact', () => {
    const params: Record<string, string | number> = {};
    expect(translate('Máximo {{max}} caracteres', params)).toBe('Máximo {{max}} caracteres');
  });

  it('rejects a missing parameter at compile time', () => {
    // @ts-expect-error falta { maxLength }
    translate(I18N.maxLengthMessageGeneral, {});
  });

  it('rejects an unknown parameter at compile time', () => {
    // @ts-expect-error maxLenght no existe en el texto
    translate(I18N.maxLengthMessageGeneral, { maxLenght: 20 });
  });
});
