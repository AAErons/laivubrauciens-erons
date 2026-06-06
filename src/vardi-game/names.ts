import type { NameCell } from './types';

export const NAMES: readonly string[] = [
  'Mārcis',
  'Ēriks',
  'Ilona',
  'Laura',
  'Reinis',
  'Kristīne',
  'Silvija',
  'Mārtiņš',
  'Annija',
  'Kristiāns',
  'Linards',
  'Elvijs',
  'Emīls',
  'Laine',
  'Ernests',
  'Inga',
  'Renārs',
  'Zane',
  'Mārtiņš',
  'Elīna',
  'Ketija',
  'Ruta',
  'Madars',
  'Jānis',
  'Renāte',
  'Aivars',
  'Mairis',
  'Aiva',
  'Ģirts',
  'Lelde',
  'Elizabete',
  'Agris',
  'Anete',
  'Anita',
  'Rainers',
  'Anna',
  'Gunārs',
  'Lana',
  'Sigurds',
  'Rinalds',
  'Zane',
  'Salvis',
  'Laura',
  'Toms',
  'Elīna',
  'Juris',
  'Krista',
  'Oskars',
] as const;

/** Unicode-aware letter test that includes Latvian diacritics. */
const LETTER_REGEX = /\p{L}/u;

export const isLetterChar = (char: string): boolean => LETTER_REGEX.test(char);

/** Case-insensitive, Latvian-aware normalization for letter comparison. */
export const normalizeLetter = (char: string): string => char.toLocaleUpperCase('lv-LV');

export const splitNameIntoCells = (name: string): NameCell[] =>
  Array.from(name).map((char, index) => ({
    index,
    char,
    isLetter: isLetterChar(char),
  }));

/** Distinct uppercase letters that appear across all names, sorted for display. */
export const AVAILABLE_LETTERS: string[] = Array.from(
  new Set(
    NAMES.flatMap((name) =>
      Array.from(name)
        .filter((char) => isLetterChar(char))
        .map((char) => normalizeLetter(char)),
    ),
  ),
).sort((a, b) => a.localeCompare(b, 'lv'));
