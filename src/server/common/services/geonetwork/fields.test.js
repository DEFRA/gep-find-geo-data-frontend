import { fields, validateSearchOptions } from './fields.js'

describe('#fields', () => {
  describe('updatedAt hitAccessor', () => {
    test('picks the latest date across entries', () => {
      expect(fields.updatedAt.hitAccessor({
        resourceDate: [
          { date: '2024-11-15T00:00:00Z' },
          { date: '2026-04-14T12:07:32.271Z' },
          { date: '2017-09-14T00:00:00Z' }
        ]
      })).toBe('2026-04-14T12:07:32.271Z')
    })

    test('returns null when resourceDate is missing', () => {
      expect(fields.updatedAt.hitAccessor({})).toBeNull()
    })

    test('returns null when resourceDate is empty', () => {
      expect(fields.updatedAt.hitAccessor({ resourceDate: [] })).toBeNull()
    })

    test('skips entries without a date', () => {
      expect(
        fields.updatedAt.hitAccessor({
          resourceDate: [{}, { date: '2024-01-01T00:00:00Z' }, { date: null }]
        })
      ).toBe('2024-01-01T00:00:00Z')
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
          filters: { owner: ['x'], dataType: ['y'], updatedAtBetween: { from: 'z' } },
          facets: ['owner', 'dataType']
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
})
