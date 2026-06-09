import { licenceUrl } from './licences.js'

describe('#licenceUrl', () => {
  test('returns URL for Open Government Licence', () => {
    expect(licenceUrl('Open Government Licence')).toBe(
      'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/'
    )
  })

  test('returns URL for Creative Commons Attribution 4.0', () => {
    expect(licenceUrl('Creative Commons Attribution 4.0')).toBe(
      'https://creativecommons.org/licenses/by/4.0/'
    )
  })

  test('matches case-insensitively', () => {
    expect(licenceUrl('OPEN GOVERNMENT LICENCE')).toBe(
      'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/'
    )
  })

  test('returns null for unknown licence', () => {
    expect(licenceUrl('Restricted access - contact publisher')).toBeNull()
  })

  test('returns null for undefined', () => {
    expect(licenceUrl(undefined)).toBeNull()
  })

  test('returns null for empty string', () => {
    expect(licenceUrl('')).toBeNull()
  })
})
