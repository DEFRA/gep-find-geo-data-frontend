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
        resourceDate: [
          { type: 'creation', date: '2024-01-01T00:00:00Z' },
          { type: 'publication', date: '2017-09-14T00:00:00Z' },
          { type: 'revision', date: '2025-04-15T00:00:00Z' }
        ],
        cl_topic: [{ default: 'Environment' }, { default: 'Elevation' }],
        lineageObject: { default: 'Captured using OS MasterMap.' },
        contactForResource: [{ email: 'test@example.gov.uk' }],
        MD_ConstraintsUseLimitationObject: [{ default: 'Open Government Licence' }],
        MD_LegalConstraintsOtherConstraintsObject: [{ default: 'There are no public access constraints to this data.' }],
        mainLanguage: 'eng',
        'th_otherKeywords-theme': [{ default: 'ecology' }, { default: 'landscape' }, { default: 'environment' }, { default: 'elevation' }],
        tag: [{ default: 'ecology' }, { default: 'landscape' }],
        format: ['Shapefile (SHP)', 'GeoPackage (GPKG)'],
        link: [{
          urlObject: { default: 'https://example.com/data.zip' },
          nameObject: { default: 'data.zip' },
          descriptionObject: { default: 'Download' }
        }],
        resourceTemporalExtentDetails: [{
          start: { date: '2020-01-01' },
          end: { date: '2099-12-31' }
        }],
        crsDetails: [{ code: 'http://www.opengis.net/def/crs/EPSG/0/27700' }],
        geom: [{
          type: 'Polygon',
          coordinates: [[[-6, 50], [2, 50], [2, 56], [-6, 56], [-6, 50]]]
        }]
      }

      const mapped = Object.fromEntries(
        Object.entries(fields)
          .filter(([, field]) => field.hitAccessor)
          .map(([name, field]) => [name, field.hitAccessor(src)])
      )

      expect(mapped).toMatchObject({
        title: 'Test Title',
        abstract: 'Test Abstract',
        owner: 'Environment Agency',
        dataType: 'Vector',
        accessLevel: 'Open data',
        updateFrequency: 'Monthly',
        categories: ['Environment', 'Elevation'],
        updatedAt: '2025-04-15T00:00:00Z',
        lineage: 'Captured using OS MasterMap.',
        contactPoint: 'test@example.gov.uk',
        licence: 'Open Government Licence',
        useLimitation: 'There are no public access constraints to this data.',
        language: 'eng',
        keywords: ['Habitats and biotopes', 'ecology', 'landscape'],
        format: ['Shapefile (SHP)', 'GeoPackage (GPKG)'],
        links: [{ url: 'https://example.com/data.zip', name: 'data.zip', description: 'Download' }],
        temporalExtent: { start: '2020-01-01', end: '2099-12-31' },
        coordinateReferenceSystem: 'http://www.opengis.net/def/crs/EPSG/0/27700',
        geographicExtent: { west: -6, south: 50, east: 2, north: 56 },
        publicationDate: '2017-09-14T00:00:00Z',
        creationDate: '2024-01-01T00:00:00Z'
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
            categories: ['Environment'],
            keywords: ['Habitats and biotopes'],
            updatedAtBetween: { from: 'z' }
          },
          facets: ['owner', 'dataType', 'accessLevel', 'updateFrequency', 'categories']
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
