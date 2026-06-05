import { vi } from 'vitest'

import { createServer } from '../server.js'
import { statusCodes } from '../common/constants/status-codes.js'
import { mockAuthCredentials } from '../common/test-helpers/auth.js'

const { mockSearch } = vi.hoisted(() => ({
  mockSearch: vi.fn()
}))

vi.mock('../common/services/geonetwork/client.js', () => ({
  search: mockSearch
}))

function emptyResponse (overrides = {}) {
  return {
    total: 0,
    results: [],
    facets: { owner: [], dataType: [], accessLevel: [], updateFrequency: [], categories: [] },
    ...overrides
  }
}

function exampleResult (overrides = {}) {
  return {
    id: 'abc-123',
    title: 'Flood Extents',
    abstract: 'Recorded flood extents for England.',
    owner: 'Environment Agency',
    updatedAt: '2026-04-10T00:00:00Z',
    ...overrides
  }
}

const INVALID_DATE_URL = '/?dateMode=since&sinceDate-day=14&sinceDate-month=4'

describe('#searchController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  beforeEach(() => {
    mockSearch.mockReset()
    mockSearch.mockResolvedValue(emptyResponse())
  })

  describe('backend query', () => {
    test('forwards the parsed query to the client', async () => {
      await server.inject({
        method: 'GET',
        url: '/?q=flood&owner=Natural%20England&owner=Environment%20Agency&dataType=Grid&category=Environment&category=Elevation&keyword=ecology&keyword=landscape&page=3&sort=titleAsc',
        auth: mockAuthCredentials
      })

      expect(mockSearch).toHaveBeenCalledWith({
        query: 'flood',
        from: 40,
        size: 20,
        filters: {
          owner: ['Natural England', 'Environment Agency'],
          dataType: ['Grid'],
          categories: ['Environment', 'Elevation'],
          keywords: ['ecology', 'landscape']
        },
        facets: ['accessLevel', 'categories', 'owner', 'dataType', 'updateFrequency'],
        sort: 'titleAsc'
      })
    })

    test('skips the backend when the query has validation errors', async () => {
      await server.inject({
        method: 'GET',
        url: INVALID_DATE_URL,
        auth: mockAuthCredentials
      })

      expect(mockSearch).not.toHaveBeenCalled()
    })
  })

  describe('HTML rendering', () => {
    test('renders the page heading and search form', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/',
        auth: mockAuthCredentials
      })

      expect(statusCode).toBe(statusCodes.ok)
      expect(result).toContain('Search Defra Data')
      expect(result).toContain('id="search-input"')
    })

    test('renders the totals, result titles and dataset links', async () => {
      mockSearch.mockResolvedValue(
        emptyResponse({ total: 1, results: [exampleResult()] })
      )

      const { result } = await server.inject({
        method: 'GET',
        url: '/?q=flood',
        auth: mockAuthCredentials
      })

      expect(result).toContain('1 result')
      expect(result).toContain('Flood Extents')
      expect(result).toContain('/dataset/abc-123')
    })

    test('renders facet checkboxes with counts and values', async () => {
      mockSearch.mockResolvedValue(
        emptyResponse({
          facets: {
            owner: [{ value: 'Natural England', count: 4 }],
            categories: [{ value: 'Environment', count: 3 }],
            dataType: [{ value: 'Vector', count: 2 }]
          }
        })
      )

      const { result } = await server.inject({
        method: 'GET',
        url: '/',
        auth: mockAuthCredentials
      })

      expect(result).toContain('Natural England')
      expect(result).toContain('Category')
      expect(result).toContain('name="category"')
      expect(result).toContain('Vector')
      expect(result).toContain('value="Vector"')
    })

    test('marks a selected owner as checked and renders the active-filter chip', async () => {
      mockSearch.mockResolvedValue(
        emptyResponse({
          facets: {
            owner: [{ value: 'Natural England', count: 4 }],
            dataType: []
          }
        })
      )

      const { result } = await server.inject({
        method: 'GET',
        url: '/?owner=Natural%20England',
        auth: mockAuthCredentials
      })

      expect(result).toContain('checked')
      expect(result).toContain('app-active-filters__row')
      expect(result).toContain('Data owner')
      expect(result).toContain('Natural England')
    })

    test('renders keyword filters as hidden inputs', async () => {
      const { result } = await server.inject({
        method: 'GET',
        url: '/?keyword=ecology&keyword=landscape',
        auth: mockAuthCredentials
      })

      expect(result).toContain('type="hidden" name="keyword" value="ecology"')
      expect(result).toContain('type="hidden" name="keyword" value="landscape"')
    })

    test('renders an empty-state message when no results match', async () => {
      const { result } = await server.inject({
        method: 'GET',
        url: '/?q=zzznomatch',
        auth: mockAuthCredentials
      })

      expect(result).toContain('No results found')
    })

    test('renders the Date filter with options', async () => {
      const { result } = await server.inject({
        method: 'GET',
        url: '/',
        auth: mockAuthCredentials
      })

      expect(result).toContain('data-filter-group="date"')
      expect(result).toContain('Filter by when the dataset was last updated.')
      expect(result).toContain('Last 30 days')
      expect(result).toContain('Last 12 months')
      expect(result).toContain('Since date')
      expect(result).toContain('Time period')
    })

    test('pre-selects the since radio, preserves day/month/year and renders its chip', async () => {
      const { result } = await server.inject({
        method: 'GET',
        url: '/?dateMode=since&sinceDate-day=14&sinceDate-month=4&sinceDate-year=2024',
        auth: mockAuthCredentials
      })

      expect(result).toMatch(/value="since"[^>]*checked/)
      expect(result).toContain('value="14"')
      expect(result).toContain('value="4"')
      expect(result).toContain('value="2024"')
      expect(result).toContain('Since 14 April 2024')
    })

    test('pre-selects the time period radio, preserves years and renders both chips', async () => {
      const { result } = await server.inject({
        method: 'GET',
        url: '/?dateMode=period&fromYear=2002&toYear=2004',
        auth: mockAuthCredentials
      })

      expect(result).toMatch(/value="period"[^>]*checked/)
      expect(result).toContain('value="2002"')
      expect(result).toContain('value="2004"')
      expect(result).toContain('From 2002')
      expect(result).toContain('To 2004')
    })

    test('renders the error summary and suppresses the results column on validation errors', async () => {
      const { result } = await server.inject({
        method: 'GET',
        url: INVALID_DATE_URL,
        auth: mockAuthCredentials
      })

      expect(result).toContain('There is a problem')
      expect(result).toContain('Date must include a year')
      expect(result).toContain('Fix the problems above to see results')
      expect(result).not.toContain('No results found')
      expect(result).not.toMatch(/>\s*0 results\s*</)
    })
  })

  describe('JSON branch', () => {
    test('returns partials keyed by region id', async () => {
      mockSearch.mockResolvedValue(
        emptyResponse({ total: 1, results: [exampleResult()] })
      )

      const response = await server.inject({
        method: 'GET',
        url: '/?q=flood',
        headers: { accept: 'application/json' },
        auth: mockAuthCredentials
      })

      expect(response.statusCode).toBe(statusCodes.ok)
      expect(response.headers['content-type']).toContain('application/json')

      const body = JSON.parse(response.payload)
      expect(body.url).toBe('/?q=flood')
      expect(body.partials['search-results']).toContain('Flood Extents')
      expect(body.partials['search-results']).toContain('1 result')
      expect(body.partials['search-filters']).toBeDefined()
      expect(body.partials['search-error-summary']).not.toContain('There is a problem')
    })

    test('returns the error summary and skips the backend on validation errors', async () => {
      const response = await server.inject({
        method: 'GET',
        url: INVALID_DATE_URL,
        headers: { accept: 'application/json' },
        auth: mockAuthCredentials
      })

      const body = JSON.parse(response.payload)
      expect(body.partials['search-error-summary']).toContain('There is a problem')
      expect(mockSearch).not.toHaveBeenCalled()
    })
  })

  describe('error path', () => {
    test('returns 500 when the client throws', async () => {
      mockSearch.mockRejectedValueOnce(new Error('GeoNetwork unavailable'))

      const response = await server.inject({
        method: 'GET',
        url: '/',
        auth: mockAuthCredentials
      })

      expect(response.statusCode).toBe(statusCodes.internalServerError)
    })
  })
})
