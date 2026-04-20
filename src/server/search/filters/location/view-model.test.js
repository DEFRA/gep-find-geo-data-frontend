import { locationFilter } from './view-model.js'

const chipHref = (overrides) => JSON.stringify(overrides)

describe('#locationFilter', () => {
  describe('parse', () => {
    test('trims whitespace from coordinates', () => {
      expect(locationFilter.parse({ latitude: ' 51.5 ', longitude: '-0.1 ' }))
        .toEqual({ latitude: '51.5', longitude: '-0.1' })
    })

    test('defaults to empty strings when missing or non-string', () => {
      expect(locationFilter.parse({})).toEqual({ latitude: '', longitude: '' })
      expect(locationFilter.parse({ latitude: 5 })).toEqual({ latitude: '', longitude: '' })
    })
  })

  describe('validate', () => {
    test('no errors when both coordinates are empty', () => {
      expect(locationFilter.validate({ latitude: '', longitude: '' })).toEqual({})
    })

    test('flags missing counterpart when only one is provided', () => {
      expect(locationFilter.validate({ latitude: '51.5', longitude: '' })).toEqual({
        longitude: { message: 'Enter a longitude' }
      })
    })

    test('flags non-numeric coordinates', () => {
      expect(locationFilter.validate({ latitude: 'north', longitude: 'west' })).toEqual({
        latitude: { message: 'Latitude must be a number' },
        longitude: { message: 'Longitude must be a number' }
      })
    })

    test('flags out-of-range coordinates', () => {
      expect(locationFilter.validate({ latitude: '91', longitude: '181' })).toEqual({
        latitude: { message: 'Latitude must be between -90 and 90' },
        longitude: { message: 'Longitude must be between -180 and 180' }
      })
    })

    test('accepts coordinates at the bounds', () => {
      expect(locationFilter.validate({ latitude: '-90', longitude: '180' })).toEqual({})
    })
  })

  describe('applyFilter', () => {
    test('sets location with numeric values when valid', () => {
      const filters = {}
      locationFilter.applyFilter(filters, { latitude: '51.5', longitude: '-0.1' }, {})
      expect(filters.location).toEqual({ latitude: 51.5, longitude: -0.1 })
    })

    test('leaves filters untouched on errors', () => {
      const filters = {}
      locationFilter.applyFilter(filters, { latitude: 'x', longitude: 'y' }, { latitude: { message: 'e' } })
      expect(filters).toEqual({})
    })

    test('leaves filters untouched when either coordinate is empty', () => {
      const filters = {}
      locationFilter.applyFilter(filters, { latitude: '51', longitude: '' }, {})
      expect(filters).toEqual({})
    })
  })

  describe('appendToParams', () => {
    test('writes both coordinates when set', () => {
      const params = new URLSearchParams()
      locationFilter.appendToParams(params, { latitude: '51.5', longitude: '-0.1' })
      expect(params.get('latitude')).toBe('51.5')
      expect(params.get('longitude')).toBe('-0.1')
    })

    test('writes nothing for empty input', () => {
      const params = new URLSearchParams()
      locationFilter.appendToParams(params, { latitude: '', longitude: '' })
      expect(params.toString()).toBe('')
    })
  })

  describe('toChipItems', () => {
    test('one chip with combined label when valid', () => {
      const chips = locationFilter.toChipItems({
        locationInput: { latitude: '51.5', longitude: '-0.1' },
        locationErrors: {}
      }, chipHref)
      expect(chips).toHaveLength(1)
      expect(chips[0].label).toBe('51.5, -0.1')
    })

    test('no chip when any error is present', () => {
      expect(locationFilter.toChipItems({
        locationInput: { latitude: '91', longitude: '-0.1' },
        locationErrors: { latitude: { message: 'e' } }
      }, chipHref)).toEqual([])
    })

    test('no chip when both coordinates are empty', () => {
      expect(locationFilter.toChipItems({
        locationInput: { latitude: '', longitude: '' },
        locationErrors: {}
      }, chipHref)).toEqual([])
    })
  })

  describe('toErrorItems', () => {
    test('anchors each error to its input id', () => {
      expect(locationFilter.toErrorItems({
        latitude: { message: 'Latitude must be a number' },
        longitude: { message: 'Enter a longitude' }
      })).toEqual([
        { text: 'Latitude must be a number', href: '#latitude' },
        { text: 'Enter a longitude', href: '#longitude' }
      ])
    })

    test('empty for no errors', () => {
      expect(locationFilter.toErrorItems({})).toEqual([])
    })
  })

  describe('toFormViewModel', () => {
    test('exposes selected flag and input params for each coordinate', () => {
      const vm = locationFilter.toFormViewModel({
        locationInput: { latitude: '51.5', longitude: '-0.1' },
        locationErrors: {}
      })
      expect(vm).toMatchObject({
        selected: true,
        hasErrors: false,
        latitudeInput: { id: 'latitude', value: '51.5' },
        longitudeInput: { id: 'longitude', value: '-0.1' }
      })
    })

    test('attaches errorMessage only to the offending input', () => {
      const vm = locationFilter.toFormViewModel({
        locationInput: { latitude: '91', longitude: '-0.1' },
        locationErrors: { latitude: { message: 'Latitude must be between -90 and 90' } }
      })
      expect(vm.latitudeInput.errorMessage).toEqual({ text: 'Latitude must be between -90 and 90' })
      expect(vm.longitudeInput.errorMessage).toBeUndefined()
    })
  })
})
