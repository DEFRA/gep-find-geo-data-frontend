import {
  allDefaults,
  boundingBox,
  datedEntry,
  firstDefault,
  firstEmail,
  firstNestedCode,
  keywordDefaults,
  latestNestedDate,
  linkArray,
  mappedValue,
  objectDefault,
  rawArray,
  temporalExtent
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

  describe('firstEmail', () => {
    test('returns the email from the first contact entry', () => {
      expect(firstEmail('contactForResource')({
        contactForResource: [{ email: 'test@example.gov.uk' }]
      })).toBe('test@example.gov.uk')
    })

    test('returns null when the field is missing', () => {
      expect(firstEmail('contactForResource')({})).toBeNull()
    })
  })

  describe('allDefaults', () => {
    test('returns all default values from a multilingual array', () => {
      expect(allDefaults('tag')({
        tag: [
          { default: 'landscape' },
          { default: 'ecology' },
          { default: 'environment' }
        ]
      })).toEqual(['landscape', 'ecology', 'environment'])
    })

    test('filters out entries without a default', () => {
      expect(allDefaults('tag')({
        tag: [{ default: 'landscape' }, {}, { default: null }, { default: 'ecology' }]
      })).toEqual(['landscape', 'ecology'])
    })

    test('returns an empty array when the field is missing', () => {
      expect(allDefaults('tag')({})).toEqual([])
    })
  })

  describe('rawArray', () => {
    test('returns the array as-is', () => {
      expect(rawArray('format')({
        format: ['Shapefile (SHP)', 'GeoPackage (GPKG)']
      })).toEqual(['Shapefile (SHP)', 'GeoPackage (GPKG)'])
    })

    test('returns an empty array when the field is missing', () => {
      expect(rawArray('format')({})).toEqual([])
    })
  })

  describe('linkArray', () => {
    test('maps link entries to url/name/description objects', () => {
      expect(linkArray('link')({
        link: [{
          urlObject: { default: 'https://example.com/data.zip' },
          nameObject: { default: 'data.zip' },
          descriptionObject: { default: 'Download data' }
        }]
      })).toEqual([{
        url: 'https://example.com/data.zip',
        name: 'data.zip',
        description: 'Download data'
      }])
    })

    test('returns an empty array when the field is missing', () => {
      expect(linkArray('link')({})).toEqual([])
    })

    test('defaults missing sub-objects to empty strings', () => {
      expect(linkArray('link')({
        link: [{}]
      })).toEqual([{ url: '', name: '', description: '' }])
    })
  })

  describe('keywordDefaults', () => {
    test('combines INSPIRE theme keywords before other keywords and removes topic duplicates', () => {
      expect(keywordDefaults(
        'th_httpinspireeceuropaeutheme-theme',
        'th_otherKeywords-theme',
        'cl_topic'
      )({
        'th_httpinspireeceuropaeutheme-theme': [{ default: 'Habitats and biotopes' }],
        'th_otherKeywords-theme': [
          { default: 'landscape' },
          { default: 'Habitats' },
          { default: 'environment' }
        ],
        cl_topic: [{ key: 'environment', default: 'Environment' }]
      })).toEqual(['Habitats and biotopes', 'landscape', 'Habitats'])
    })

    test('returns an empty list when structured keyword fields are missing', () => {
      expect(keywordDefaults(
        'th_httpinspireeceuropaeutheme-theme',
        'th_otherKeywords-theme',
        'cl_topic'
      )({
        tag: [{ default: 'landscape' }, { default: 'landscape' }, { default: 'environment' }],
        cl_topic: [{ default: 'Environment' }]
      })).toEqual([])
    })

    test('ignores raw tag values because tags aggregate other keyword sources', () => {
      expect(keywordDefaults(
        'th_httpinspireeceuropaeutheme-theme',
        'th_otherKeywords-theme',
        'cl_topic'
      )({
        tag: [
          { default: 'landscape' },
          { default: 'environment' },
          { default: 'Habitats and biotopes' },
          { default: 'raw tag only' }
        ],
        'th_httpinspireeceuropaeutheme-theme': [{ default: 'Habitats and biotopes' }],
        'th_otherKeywords-theme': [{ default: 'landscape' }],
        cl_topic: [{ key: 'environment', default: 'Environment' }]
      })).toEqual(['Habitats and biotopes', 'landscape'])
    })
  })

  describe('temporalExtent', () => {
    test('extracts start and end dates from the first entry', () => {
      expect(temporalExtent('resourceTemporalExtentDetails')({
        resourceTemporalExtentDetails: [{
          start: { date: '2014-11-24' },
          end: { date: '2099-12-31' }
        }]
      })).toEqual({ start: '2014-11-24', end: '2099-12-31' })
    })

    test('returns null when the field is missing', () => {
      expect(temporalExtent('resourceTemporalExtentDetails')({})).toBeNull()
    })

    test('handles missing start or end', () => {
      expect(temporalExtent('resourceTemporalExtentDetails')({
        resourceTemporalExtentDetails: [{ start: { date: '2020-01-01' } }]
      })).toEqual({ start: '2020-01-01', end: null })

      expect(temporalExtent('resourceTemporalExtentDetails')({
        resourceTemporalExtentDetails: [{ end: { date: '2099-12-31' } }]
      })).toEqual({ start: null, end: '2099-12-31' })
    })
  })

  describe('firstNestedCode', () => {
    test('returns the code from the first CRS entry', () => {
      expect(firstNestedCode('crsDetails')({
        crsDetails: [{ code: 'http://www.opengis.net/def/crs/EPSG/0/27700' }]
      })).toBe('http://www.opengis.net/def/crs/EPSG/0/27700')
    })

    test('returns null when the field is missing', () => {
      expect(firstNestedCode('crsDetails')({})).toBeNull()
    })
  })

  describe('boundingBox', () => {
    test('maps GeoJSON longitude/latitude coordinates to west/south/east/north', () => {
      expect(boundingBox('geom')({
        geom: [{
          type: 'Polygon',
          coordinates: [[
            [-6.375, 49.9],
            [1.79, 49.9],
            [1.79, 55.82],
            [-6.375, 55.82],
            [-6.375, 49.9]
          ]]
        }]
      })).toEqual({ west: -6.375, south: 49.9, east: 1.79, north: 55.82 })
    })

    test('calculates bounds without relying on the polygon ring start point', () => {
      expect(boundingBox('geom')({
        geom: [{
          type: 'Polygon',
          coordinates: [[
            [-8.655, 60.85],
            [-8.655, 49.9],
            [1.79, 49.9],
            [1.79, 60.85],
            [-8.655, 60.85]
          ]]
        }]
      })).toEqual({ west: -8.655, south: 49.9, east: 1.79, north: 60.85 })
    })

    test('returns null when the field is missing', () => {
      expect(boundingBox('geom')({})).toBeNull()
    })

    test('returns null when the ring has fewer than 4 points', () => {
      expect(boundingBox('geom')({
        geom: [{ coordinates: [[[0, 0], [1, 1]]] }]
      })).toBeNull()
    })

    test('returns null when the ring has fewer than 4 valid points', () => {
      expect(boundingBox('geom')({
        geom: [{ coordinates: [[[0, 0], [1, 1], [2], [3, 3]]] }]
      })).toBeNull()
    })
  })

  describe('datedEntry', () => {
    test('finds the date matching the requested type', () => {
      expect(datedEntry('resourceDate', 'publication')({
        resourceDate: [
          { type: 'creation', date: '2024-01-01T00:00:00Z' },
          { type: 'publication', date: '2017-09-14T00:00:00Z' },
          { type: 'revision', date: '2025-04-15T00:00:00Z' }
        ]
      })).toBe('2017-09-14T00:00:00Z')
    })

    test('returns null when no entry matches the type', () => {
      expect(datedEntry('resourceDate', 'publication')({
        resourceDate: [
          { type: 'creation', date: '2024-01-01T00:00:00Z' }
        ]
      })).toBeNull()
    })

    test('returns null when the field is missing', () => {
      expect(datedEntry('resourceDate', 'creation')({})).toBeNull()
    })
  })
})
