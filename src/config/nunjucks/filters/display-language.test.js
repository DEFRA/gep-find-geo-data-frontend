import { displayLanguage } from './display-language.js'

describe('#displayLanguage', () => {
  test('maps ISO 639-2/B code to English name', () => {
    expect(displayLanguage('eng')).toBe('English')
  })

  test('maps French code', () => {
    expect(displayLanguage('fre')).toBe('French')
  })

  test('passes through an unrecognised code', () => {
    expect(displayLanguage('zzz')).toBe('zzz')
  })

  test('returns empty string for null', () => {
    expect(displayLanguage(null)).toBe('')
  })

  test('returns empty string for undefined', () => {
    expect(displayLanguage(undefined)).toBe('')
  })
})
