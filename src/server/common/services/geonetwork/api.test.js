import { vi } from 'vitest'

const mockRequest = vi.fn()

vi.mock('undici', () => ({
  request: mockRequest
}))

vi.mock('../../../../config/config.js', () => ({
  config: {
    get: vi.fn((key) =>
      key === 'geonetwork.apiUrl'
        ? 'http://geonetwork:8080/geonetwork/srv/api'
        : null
    )
  }
}))

vi.mock('../../helpers/logging/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  })
}))

const { search } = await import('./api.js')

function mockEsResponse (payload) {
  mockRequest.mockResolvedValue({
    statusCode: 200,
    body: { json: () => Promise.resolve(payload) }
  })
}

function mockEmptyResponse () {
  mockEsResponse({ hits: { total: { value: 0 }, hits: [] } })
}

function lastRequestBody () {
  return JSON.parse(mockRequest.mock.calls[0][1].body)
}

const fullHit = {
  _id: 'abc',
  _source: {
    resourceTitleObject: { default: 'Test Title' },
    resourceAbstractObject: { default: 'Test Abstract' },
    OrgForResourceObject: { default: 'Environment Agency' },
    resourceDate: [
      { date: '2024-11-15T00:00:00Z' },
      { date: '2025-07-28T00:00:00Z' },
      { date: '2017-09-14T00:00:00Z' }
    ]
  }
}

describe('#api', () => {
  beforeEach(() => {
    mockRequest.mockReset()
  })

  describe('#search request', () => {
    test('POSTs to the search endpoint with JSON headers', async () => {
      mockEmptyResponse()
      await search({ query: 'woodland' })

      expect(mockRequest).toHaveBeenCalledWith(
        'http://geonetwork:8080/geonetwork/srv/api/search/records/_search',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
        })
      )
    })

    test('attaches an AbortSignal', async () => {
      mockEmptyResponse()
      await search({ query: 'woodland' })

      const [, options] = mockRequest.mock.calls[0]
      expect(options.signal).toBeInstanceOf(AbortSignal)
    })

    test('throws on non-200 response', async () => {
      mockRequest.mockResolvedValue({
        statusCode: 500,
        body: { text: () => Promise.resolve('Internal Server Error') }
      })

      await expect(search({ query: 'test' })).rejects.toThrow('GeoNetwork search failed with status 500')
    })

    test('throws on timeout', async () => {
      const err = new Error('The operation was aborted due to timeout')
      err.name = 'TimeoutError'
      mockRequest.mockRejectedValue(err)

      await expect(search({ query: 'test' })).rejects.toThrow('GeoNetwork search timed out')
    })

    test('throws on transport error', async () => {
      mockRequest.mockRejectedValue(new Error('ECONNREFUSED'))

      await expect(search({ query: 'test' })).rejects.toThrow('GeoNetwork search request failed')
    })
  })

  describe('#search Elasticsearch query generation', () => {
    describe('query body snapshots', () => {
      test('empty input', async () => {
        mockEmptyResponse()
        await search({})
        expect(lastRequestBody()).toMatchSnapshot()
      })

      test('combined query, filters, facets and sort', async () => {
        mockEmptyResponse()
        await search({
          query: 'flood',
          filters: {
            owner: ['Environment Agency', 'Natural England'],
            dataType: ['Grid'],
            location: { latitude: 51.501, longitude: -0.142 }
          },
          facets: ['owner', 'dataType'],
          sort: 'newest'
        })
        expect(lastRequestBody()).toMatchSnapshot()
      })

      test('sort by newest', async () => {
        mockEmptyResponse()
        await search({ sort: 'newest' })
        expect(lastRequestBody()).toMatchSnapshot()
      })

      test('sort by titleAsc', async () => {
        mockEmptyResponse()
        await search({ sort: 'titleAsc' })
        expect(lastRequestBody()).toMatchSnapshot()
      })
    })

    test('custom pagination', async () => {
      mockEmptyResponse()
      await search({ query: 'test', from: 20, size: 5 })
      const body = lastRequestBody()
      expect(body.from).toBe(20)
      expect(body.size).toBe(5)
    })

    test('empty filter array is dropped', async () => {
      mockEmptyResponse()
      await search({ query: 'flood', filters: { owner: [] } })
      const body = lastRequestBody()
      expect(body.post_filter).toBeUndefined()
    })

    test('throws on an unknown filter key', async () => {
      // @ts-expect-error verify unknown keys are rejected at runtime
      await expect(search({ filters: { unknown: ['value'] } })).rejects.toThrow('Unknown filter key')
    })

    test('throws on an unknown sort value', async () => {
      // @ts-expect-error verify unknown sort is rejected at runtime
      await expect(search({ sort: 'unknown' })).rejects.toThrow('Unknown sort')
    })

    test('updatedAtBetween emits an ES range clause', async () => {
      mockEmptyResponse()
      await search({
        filters: {
          updatedAtBetween: {
            from: '2024-01-01T00:00:00.000Z',
            to: '2024-02-01T00:00:00.000Z'
          }
        }
      })
      const body = lastRequestBody()
      expect(body.query).toEqual({
        bool: {
          filter: [
            {
              nested: {
                path: 'resourceDate',
                query: {
                  range: {
                    'resourceDate.date': {
                      gte: '2024-01-01T00:00:00.000Z',
                      lt: '2024-02-01T00:00:00.000Z'
                    }
                  }
                }
              }
            }
          ]
        }
      })
    })

    test('updatedAtBetween combined with terms filter and query', async () => {
      mockEmptyResponse()
      await search({
        query: 'flood',
        filters: {
          owner: ['Environment Agency'],
          updatedAtBetween: { from: '2024-01-01T00:00:00.000Z' }
        }
      })
      const body = lastRequestBody()
      expect(body.query.bool.must).toHaveLength(1)
      expect(body.query.bool.filter).toEqual([
        {
          nested: {
            path: 'resourceDate',
            query: { range: { 'resourceDate.date': { gte: '2024-01-01T00:00:00.000Z' } } }
          }
        }
      ])
      expect(body.post_filter).toEqual({
        bool: {
          filter: [
            { terms: { 'OrgForResourceObject.default': ['Environment Agency'] } }
          ]
        }
      })
    })

    test('facet filters go to post_filter so aggregations see the full result set', async () => {
      mockEmptyResponse()
      await search({
        filters: {
          owner: ['Natural England'],
          dataType: ['Grid']
        }
      })
      const body = lastRequestBody()
      expect(body.query).toBeUndefined()
      expect(body.post_filter).toEqual({
        bool: {
          filter: [
            { terms: { 'OrgForResourceObject.default': ['Natural England'] } },
            { terms: { 'cl_spatialRepresentationType.default': ['Grid'] } }
          ]
        }
      })
    })

    test('each facet aggregation applies every other facet filter', async () => {
      mockEmptyResponse()
      await search({
        filters: {
          owner: ['Natural England'],
          dataType: ['Grid'],
          updatedAtBetween: { from: '2024-01-01T00:00:00.000Z' }
        },
        facets: ['owner', 'dataType']
      })
      const body = lastRequestBody()

      expect(body.aggs.owner.filter).toEqual({
        bool: {
          filter: [
            { terms: { 'cl_spatialRepresentationType.default': ['Grid'] } }
          ]
        }
      })
      expect(body.aggs.owner.aggs.owner).toEqual({
        terms: { field: 'OrgForResourceObject.default', size: 50 }
      })

      expect(body.aggs.dataType.filter).toEqual({
        bool: {
          filter: [
            { terms: { 'OrgForResourceObject.default': ['Natural England'] } }
          ]
        }
      })
      expect(body.aggs.dataType.aggs.dataType).toEqual({
        terms: { field: 'cl_spatialRepresentationType.default', size: 50 }
      })
    })

    test('a facet with only its own filter selected wraps in match_all', async () => {
      mockEmptyResponse()
      await search({
        filters: { dataType: ['Grid'] },
        facets: ['dataType']
      })
      const body = lastRequestBody()
      expect(body.aggs.dataType.filter).toEqual({ match_all: {} })
    })

    test('location emits a geo_shape intersects clause', async () => {
      mockEmptyResponse()
      await search({
        filters: {
          location: { latitude: 51.501, longitude: -0.142 }
        }
      })
      const body = lastRequestBody()
      expect(body.query).toEqual({
        bool: {
          filter: [
            {
              geo_shape: {
                geom: {
                  shape: {
                    type: 'point',
                    coordinates: [-0.142, 51.501]
                  },
                  relation: 'intersects'
                }
              }
            }
          ]
        }
      })
    })

    test('empty updatedAtBetween is dropped', async () => {
      mockEmptyResponse()
      await search({ filters: { updatedAtBetween: {} } })
      const body = lastRequestBody()
      expect(body.query).toBeUndefined()
    })

    test('throws on an unknown facet name', async () => {
      await expect(search({ facets: ['unknown'] })).rejects.toThrow('Unknown facet')
    })

    test('throws on a non-facetable field', async () => {
      await expect(search({ facets: ['title'] })).rejects.toThrow('Unknown facet')
    })

    test('full-text query uses multi_match with boosted title', async () => {
      mockEmptyResponse()
      await search({ query: 'flood water' })

      const body = lastRequestBody()
      expect(body.query).toEqual({
        bool: {
          must: [{
            multi_match: {
              query: 'flood water',
              fields: [
                'resourceTitleObject.default^3',
                'resourceAbstractObject.default'
              ],
              type: 'best_fields'
            }
          }]
        }
      })
    })
  })

  describe('#search response mapping', () => {
    test('flattens a fully-populated ES hit into the domain shape', async () => {
      mockEsResponse({ hits: { total: { value: 1 }, hits: [fullHit] } })
      const result = await search({})

      expect(result.total).toBe(1)
      expect(result.results).toHaveLength(1)
      expect(result.results[0]).toEqual({
        id: 'abc',
        title: 'Test Title',
        abstract: 'Test Abstract',
        owner: 'Environment Agency',
        updatedAt: '2025-07-28T00:00:00Z'
      })
    })

    test('handles a response with no hits envelope', async () => {
      mockEsResponse({})
      const result = await search({})

      expect(result).toEqual({ total: 0, results: [], facets: {} })
    })

    test('defaults missing fields', async () => {
      mockEsResponse({
        hits: { total: { value: 1 }, hits: [{ _id: 'id-1' }] }
      })
      const result = await search({})

      expect(result.results[0]).toEqual({
        id: 'id-1',
        title: '',
        abstract: '',
        owner: null,
        updatedAt: null
      })
    })

    test('normalises aggregation buckets into {value, count} facets', async () => {
      mockEsResponse({
        hits: { total: { value: 2 }, hits: [] },
        aggregations: {
          owner: {
            doc_count: 3,
            owner: {
              buckets: [
                { key: 'Environment Agency', doc_count: 2 },
                { key: 'Natural England', doc_count: 1 }
              ]
            }
          }
        }
      })

      const result = await search({ facets: ['owner'] })

      expect(result.facets).toEqual({
        owner: [
          { value: 'Environment Agency', count: 2 },
          { value: 'Natural England', count: 1 }
        ]
      })
    })

    test('returns an empty facets map when no aggregations are requested', async () => {
      mockEmptyResponse()
      const result = await search({})

      expect(result.facets).toEqual({})
    })
  })
})
