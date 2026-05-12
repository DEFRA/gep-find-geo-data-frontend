import { iso6392 } from 'iso-639-2'

const languageByCode = new Map(iso6392.map((lang) => [lang.iso6392B, lang.name]))

/**
 * @param {string | null} code
 * @returns {string}
 */
export function displayLanguage (code) {
  if (!code) {
    return ''
  }
  return languageByCode.get(code) ?? code
}
