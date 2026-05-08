import {
  facetLabelValue,
  facetValueLabel,
  fields,
  validateSearchOptions
} from './fields.js'

describe('#fields', () => {
  describe('field registry', () => {
    test('maps representative GeoNetwork source fields into domain values', () => {
      const src = {
        resourceTitleObject: { default: 'Test Title' },
        resourceAbstractObject: { default: 'Test Abstract' },
        OrgForResourceObject: { default: 'Environment Agency' },
        cl_spatialRepresentationType: [{ default: 'Vector' }],
        isOpenData: 'true',
        cl_maintenanceAndUpdateFrequency: [{ default: 'Monthly' }],
        'th_httpinspireeceuropaeutheme-theme': [{ default: 'Habitats and biotopes' }],
        resourceDate: [{ date: '2024-01-01T00:00:00Z' }]
      }

      expect(Object.fromEntries(
        Object.entries(fields).map(([name, field]) => [name, field.hitAccessor(src)])
      )).toMatchObject({
        title: 'Test Title',
        abstract: 'Test Abstract',
        owner: 'Environment Agency',
        dataType: 'Vector',
        accessLevel: 'Open data',
        updateFrequency: 'Monthly',
        category: 'Habitats and biotopes',
        updatedAt: '2024-01-01T00:00:00Z'
      })
    })
  })

  describe('validateSearchOptions', () => {
    test('accepts an empty options object', () => {
      expect(() => validateSearchOptions({})).not.toThrow()
    })

    test('accepts known sort, filter keys and facet names', () => {
      expect(() =>
        validateSearchOptions({
          sort: 'titleAsc',
          filters: {
            owner: ['x'],
            dataType: ['Vector'],
            accessLevel: ['true'],
            updateFrequency: ['Monthly'],
            category: ['Elevation'],
            updatedAtBetween: { from: 'z' }
          },
          facets: ['owner', 'dataType', 'accessLevel', 'updateFrequency', 'category']
        })
      ).not.toThrow()
    })

    test('throws on an unknown sort value', () => {
      expect(() => validateSearchOptions({ sort: 'unknown' })).toThrow('Unknown sort')
    })

    test('throws on an unknown filter key', () => {
      expect(() => validateSearchOptions({ filters: { unknown: [] } })).toThrow('Unknown filter key')
    })

    test('throws on an unknown facet name', () => {
      expect(() => validateSearchOptions({ facets: ['unknown'] })).toThrow('Unknown facet')
    })

    test('throws on a non-facetable field passed as a facet', () => {
      expect(() => validateSearchOptions({ facets: ['title'] })).toThrow('Unknown facet')
    })
  })

  describe('facetValueLabel', () => {
    test('passes through dataType labels from GeoNetwork', () => {
      expect(facetValueLabel('dataType', 'Vector')).toBe('Vector')
    })

    test('passes through updateFrequency labels from GeoNetwork', () => {
      expect(facetValueLabel('updateFrequency', 'As needed')).toBe('As needed')
    })

    test('passes through values without a label map', () => {
      expect(facetValueLabel('owner', 'Natural England')).toBe('Natural England')
    })
  })

  describe('facetLabelValue', () => {
    test('maps accessLevel display labels back to filter values', () => {
      expect(facetLabelValue('accessLevel', 'Open data')).toBe('true')
    })

    test('passes through dataType labels from GeoNetwork', () => {
      expect(facetLabelValue('dataType', 'Grid')).toBe('Grid')
    })

    test('passes through updateFrequency labels from GeoNetwork', () => {
      expect(facetLabelValue('updateFrequency', 'As needed')).toBe('As needed')
    })

    test('passes through labels without a label map', () => {
      expect(facetLabelValue('owner', 'Natural England')).toBe('Natural England')
    })
  })
})
