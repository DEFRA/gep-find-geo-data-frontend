import {
  firstDefault,
  latestNestedDate,
  mappedValue,
  objectDefault
} from './field-accessors.js'

describe('#field-accessors', () => {
  describe('objectDefault', () => {
    test('returns the default value from a GeoNetwork multilingual object', () => {
      expect(objectDefault('resourceTitleObject')({
        resourceTitleObject: { default: 'Test Title' }
      })).toBe('Test Title')
    })

    test('returns the configured fallback when the field is missing', () => {
      expect(objectDefault('resourceTitleObject', '')({})).toBe('')
    })
  })

  describe('firstDefault', () => {
    test('returns the default value from the first array entry', () => {
      expect(firstDefault('cl_maintenanceAndUpdateFrequency')({
        cl_maintenanceAndUpdateFrequency: [{ default: 'Monthly' }]
      })).toBe('Monthly')
    })

    test('returns null when the field is missing', () => {
      expect(firstDefault('cl_maintenanceAndUpdateFrequency')({})).toBeNull()
    })
  })

  describe('mappedValue', () => {
    test('maps a raw source value to its display value', () => {
      const accessLevel = mappedValue('isOpenData', {
        true: 'Open data',
        false: 'Restricted access'
      })

      expect(accessLevel({ isOpenData: 'true' })).toBe('Open data')
    })

    test('returns null when the raw value is missing from the map', () => {
      const accessLevel = mappedValue('isOpenData', {
        true: 'Open data',
        false: 'Restricted access'
      })

      expect(accessLevel({ isOpenData: 'unknown' })).toBeNull()
    })
  })

  describe('latestNestedDate', () => {
    test('picks the latest date across entries', () => {
      expect(latestNestedDate('resourceDate')({
        resourceDate: [
          { date: '2024-11-15T00:00:00Z' },
          { date: '2026-04-14T12:07:32.271Z' },
          { date: '2017-09-14T00:00:00Z' }
        ]
      })).toBe('2026-04-14T12:07:32.271Z')
    })

    test('returns null when the field is missing', () => {
      expect(latestNestedDate('resourceDate')({})).toBeNull()
    })

    test('returns null when the field is empty', () => {
      expect(latestNestedDate('resourceDate')({ resourceDate: [] })).toBeNull()
    })

    test('skips entries without a date', () => {
      expect(latestNestedDate('resourceDate')({
        resourceDate: [{}, { date: '2024-01-01T00:00:00Z' }, { date: null }]
      })).toBe('2024-01-01T00:00:00Z')
    })
  })
})
