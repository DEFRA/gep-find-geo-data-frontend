import {
  DEFAULT_PAGE_SIZE,
  buildViewModel,
  parseQuery,
  toSearchRequest
} from './view-model.js'

const basePath = '/'

const emptyResponse = (overrides = {}) => ({
  total: 0,
  results: [],
  facets: { owner: [], dataType: [] },
  ...overrides
})

const exampleResult = (overrides = {}) => ({
  id: 'abc-123',
  title: 'Flood Extents',
  abstract: 'Recorded flood extents for England.',
  owner: 'Environment Agency',
  updatedAt: '2026-04-10T00:00:00Z',
  ...overrides
})

const viewModel = (rawQuery = {}, responseOverrides = {}) =>
  buildViewModel({
    parsed: parseQuery(rawQuery),
    response: emptyResponse(responseOverrides),
    basePath
  })

describe('#search view-model', () => {
  describe('toSearchRequest', () => {
    test('translates a parsed query into a geonetwork search request', () => {
      expect(toSearchRequest(parseQuery({ q: 'flood', page: '3', size: '50', sort: 'titleAsc' })))
        .toEqual({
          query: 'flood',
          from: 100,
          size: 50,
          filters: {},
          facets: ['owner', 'dataType'],
          sort: 'titleAsc'
        })
    })

    test('offsets from zero and applies defaults when no query is given', () => {
      expect(toSearchRequest(parseQuery({}))).toMatchObject({
        query: '',
        from: 0,
        size: DEFAULT_PAGE_SIZE,
        sort: 'relevance'
      })
    })
  })

  describe('parseQuery', () => {
    const emptyDateInput = {
      mode: null,
      exactDate: { day: '', month: '', year: '' },
      afterDate: { day: '', month: '', year: '' },
      beforeDate: { day: '', month: '', year: '' }
    }
    const emptyLocationInput = { latitude: '', longitude: '' }

    test('defaults for an empty query', () => {
      expect(parseQuery({})).toEqual({
        q: '',
        sort: 'relevance',
        page: 1,
        size: DEFAULT_PAGE_SIZE,
        filters: {},
        dateInput: emptyDateInput,
        dateErrors: {},
        locationInput: emptyLocationInput,
        locationErrors: {},
        hasErrors: false
      })
    })

    test('reads q, sort and page when valid', () => {
      const parsed = parseQuery({ q: 'flood', sort: 'titleAsc', page: '3' })
      expect(parsed).toMatchObject({ q: 'flood', sort: 'titleAsc', page: 3 })
    })

    test('clamps invalid sort to relevance', () => {
      expect(parseQuery({ sort: 'nonsense' }).sort).toBe('relevance')
    })

    test('clamps invalid page to 1', () => {
      expect(parseQuery({ page: 'abc' }).page).toBe(1)
      expect(parseQuery({ page: '0' }).page).toBe(1)
      expect(parseQuery({ page: '-5' }).page).toBe(1)
    })

    test('accepts valid page sizes, falls back otherwise', () => {
      expect(parseQuery({ size: '50' }).size).toBe(50)
      expect(parseQuery({ size: '7' }).size).toBe(DEFAULT_PAGE_SIZE)
      expect(parseQuery({ size: 'abc' }).size).toBe(DEFAULT_PAGE_SIZE)
    })

    test('parses filters from single, repeated, and mixed values', () => {
      expect(parseQuery({ owner: 'Natural England' }).filters).toEqual({
        owner: ['Natural England']
      })
      expect(parseQuery({ owner: ['A', 'B'] }).filters).toEqual({
        owner: ['A', 'B']
      })
      expect(parseQuery({ owner: ['A', 'A', 'B'] }).filters).toEqual({
        owner: ['A', 'B']
      })
      expect(parseQuery({ owner: ['A', ''] }).filters).toEqual({
        owner: ['A']
      })
    })

    test('omits unknown and empty filter keys', () => {
      expect(parseQuery({ owner: '' }).filters).toEqual({})
      expect(parseQuery({ madeUp: 'x' }).filters).toEqual({})
    })

    test('parses an exact date into a from/to range inclusive of that day', () => {
      const parsed = parseQuery({
        dateMode: 'exact',
        'exactDate-day': '14',
        'exactDate-month': '4',
        'exactDate-year': '2024'
      })
      expect(parsed.filters.updatedAtBetween).toEqual({
        from: '2024-04-14T00:00:00.000Z',
        to: '2024-04-15T00:00:00.000Z'
      })
      expect(parsed.dateInput.exactDate).toEqual({ day: '14', month: '4', year: '2024' })
    })

    test('parses a range into from/to inclusive of both endpoints', () => {
      const parsed = parseQuery({
        dateMode: 'range',
        'afterDate-day': '1',
        'afterDate-month': '1',
        'afterDate-year': '2024',
        'beforeDate-day': '31',
        'beforeDate-month': '12',
        'beforeDate-year': '2024'
      })
      expect(parsed.filters.updatedAtBetween).toEqual({
        from: '2024-01-01T00:00:00.000Z',
        to: '2025-01-01T00:00:00.000Z'
      })
    })

    test('parses a range with only after or only before', () => {
      expect(parseQuery({
        dateMode: 'range',
        'afterDate-day': '1',
        'afterDate-month': '1',
        'afterDate-year': '2024'
      }).filters.updatedAtBetween).toEqual({
        from: '2024-01-01T00:00:00.000Z'
      })
      expect(parseQuery({
        dateMode: 'range',
        'beforeDate-day': '31',
        'beforeDate-month': '12',
        'beforeDate-year': '2024'
      }).filters.updatedAtBetween).toEqual({
        to: '2025-01-01T00:00:00.000Z'
      })
    })

    test('rejects an invalid calendar date but preserves raw parts', () => {
      const parsed = parseQuery({
        dateMode: 'exact',
        'exactDate-day': '30',
        'exactDate-month': '2',
        'exactDate-year': '2024'
      })
      expect(parsed.filters.updatedAtBetween).toBeUndefined()
      expect(parsed.dateInput.exactDate).toEqual({ day: '30', month: '2', year: '2024' })
      expect(parsed.dateErrors.exactDate.message).toBe('Enter a valid date')
    })

    test('ignores an unknown dateMode', () => {
      const parsed = parseQuery({ dateMode: 'weekly' })
      expect(parsed.dateInput.mode).toBeNull()
      expect(parsed.filters.updatedAtBetween).toBeUndefined()
    })

    test('flags partial and empty exact dates', () => {
      const partial = parseQuery({
        dateMode: 'exact',
        'exactDate-day': '14',
        'exactDate-month': '4'
      })
      expect(partial.dateErrors.exactDate.missing).toEqual(['year'])
      expect(partial.filters.updatedAtBetween).toBeUndefined()

      expect(parseQuery({ dateMode: 'exact' }).dateErrors.exactDate.message).toBe('Enter a date')
    })

    test('does not flag an empty range but flags partial endpoints', () => {
      expect(parseQuery({ dateMode: 'range' }).dateErrors).toEqual({})

      const partial = parseQuery({
        dateMode: 'range',
        'afterDate-day': '1'
      })
      expect(partial.dateErrors.afterDate.missing).toEqual(['month', 'year'])
    })

    test('flags a range where after is later than before', () => {
      const parsed = parseQuery({
        dateMode: 'range',
        'afterDate-day': '1',
        'afterDate-month': '6',
        'afterDate-year': '2024',
        'beforeDate-day': '1',
        'beforeDate-month': '1',
        'beforeDate-year': '2024'
      })
      expect(parsed.dateErrors.beforeDate.message).toContain('on or after')
      expect(parsed.filters.updatedAtBetween).toBeUndefined()
    })

    test('parses valid coordinates into a location filter', () => {
      const parsed = parseQuery({ latitude: '51.501', longitude: '-0.142' })
      expect(parsed.filters.location).toEqual({ latitude: 51.501, longitude: -0.142 })
      expect(parsed.locationInput).toEqual({ latitude: '51.501', longitude: '-0.142' })
      expect(parsed.locationErrors).toEqual({})
    })

    test('trims whitespace from coordinate inputs', () => {
      const parsed = parseQuery({ latitude: '  51.5  ', longitude: '  -0.1  ' })
      expect(parsed.filters.location).toEqual({ latitude: 51.5, longitude: -0.1 })
    })

    test('flags missing counterpart when only one coordinate is provided', () => {
      expect(parseQuery({ latitude: '51.5' }).locationErrors.longitude).toBeDefined()
      expect(parseQuery({ longitude: '-0.1' }).locationErrors.latitude).toBeDefined()
    })

    test('flags non-numeric or out-of-range coordinates', () => {
      expect(parseQuery({ latitude: 'abc', longitude: '-0.1' }).locationErrors.latitude.message)
        .toContain('number')
      expect(parseQuery({ latitude: '91', longitude: '-0.1' }).locationErrors.latitude.message)
        .toContain('-90')
      expect(parseQuery({ latitude: '51.5', longitude: '181' }).locationErrors.longitude.message)
        .toContain('-180')
    })
  })

  describe('buildViewModel', () => {
    describe('top-level shape', () => {
      test('sensible defaults for an empty query and response', () => {
        expect(viewModel()).toMatchObject({
          pageTitle: 'Search Defra Data',
          heading: 'Search Defra Data',
          searchQuery: '',
          selectedSort: 'relevance',
          selectedPageSize: DEFAULT_PAGE_SIZE,
          totalResults: 0,
          results: [],
          activeFilterGroups: [],
          pagination: null,
          resultRange: null,
          errorSummary: null,
          currentUrl: '/'
        })
      })

      test('exposes facetGroups as one entry per facet config', () => {
        expect(viewModel().facetGroups.map((g) => g.name)).toEqual([
          'owner',
          'dataType'
        ])
      })
    })

    describe('sortOptions and pageSizeOptions', () => {
      test('marks the selected sort option', () => {
        const selected = viewModel({ sort: 'titleAsc' }).sortOptions.find((o) => o.selected)
        expect(selected.value).toBe('titleAsc')
      })

      test('marks the selected page size', () => {
        const vm = viewModel({ size: '50' })
        expect(vm.selectedPageSize).toBe(50)
        expect(vm.pageSizeOptions.find((o) => o.selected).value).toBe('50')
        expect(vm.pageSizeOptions.map((o) => o.value)).toEqual(['10', '20', '50', '100'])
      })
    })

    describe('results', () => {
      test('maps API results to the template shape with detail href', () => {
        const vm = viewModel({}, { total: 1, results: [exampleResult()] })
        expect(vm.results).toEqual([{
          id: 'abc-123',
          title: 'Flood Extents',
          href: '/dataset/abc-123',
          abstract: 'Recorded flood extents for England.',
          owner: 'Environment Agency',
          updatedAt: '2026-04-10T00:00:00Z'
        }])
      })

      test('truncates abstracts beyond the word limit', () => {
        const longAbstract = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ')
        const vm = viewModel({}, {
          total: 1,
          results: [exampleResult({ abstract: longAbstract })]
        })
        expect(vm.results[0].abstract.endsWith('...')).toBe(true)
        expect(vm.results[0].abstract.split(' ')).toHaveLength(50)
      })

      test('passes short abstracts through unchanged', () => {
        const vm = viewModel({}, {
          total: 1,
          results: [exampleResult({ abstract: 'Short.' })]
        })
        expect(vm.results[0].abstract).toBe('Short.')
      })
    })

    describe('facetGroups', () => {
      test('shapes buckets into checkbox items with counts', () => {
        const vm = viewModel({}, {
          facets: {
            owner: [
              { value: 'Natural England', count: 5 },
              { value: 'Environment Agency', count: 3 }
            ],
            dataType: []
          }
        })
        expect(vm.facetGroups[0].items).toEqual([
          { value: 'Natural England', text: 'Natural England', checked: false, hint: { text: '5' } },
          { value: 'Environment Agency', text: 'Environment Agency', checked: false, hint: { text: '3' } }
        ])
      })

      test('marks selected values as checked and counts them', () => {
        const vm = viewModel(
          { owner: 'Natural England' },
          { facets: { owner: [{ value: 'Natural England', count: 5 }], dataType: [] } }
        )
        expect(vm.facetGroups[0].items[0].checked).toBe(true)
        expect(vm.facetGroups[0].selectedCount).toBe(1)
      })

      test('renders a selected value with zero hint even if absent from response', () => {
        const vm = viewModel({ owner: 'Natural England' })
        expect(vm.facetGroups[0].items).toEqual([{
          value: 'Natural England',
          text: 'Natural England',
          checked: true,
          hint: { text: '0' }
        }])
      })
    })

    describe('activeFilterGroups', () => {
      test('groups selected values under their facet legend', () => {
        const vm = viewModel({ owner: ['Natural England', 'Environment Agency'] })
        expect(vm.activeFilterGroups).toHaveLength(1)
        expect(vm.activeFilterGroups[0].legend).toBe('Data owner')
        expect(vm.activeFilterGroups[0].items.map((i) => i.label)).toEqual([
          'Natural England',
          'Environment Agency'
        ])
      })

      test('produces separate groups per facet in facet order', () => {
        const vm = viewModel({ dataType: 'Vector', owner: 'Natural England' })
        expect(vm.activeFilterGroups.map((g) => g.name)).toEqual(['owner', 'dataType'])
      })

      test('chip removeHref drops only the targeted value and always drops page', () => {
        const vm = viewModel({ q: 'flood', owner: ['A', 'B'], dataType: 'Grid', page: '5' })
        const firstChip = vm.activeFilterGroups[0].items[0]
        expect(firstChip.removeHref).toContain('q=flood')
        expect(firstChip.removeHref).toContain('owner=B')
        expect(firstChip.removeHref).not.toContain('owner=A')
        expect(firstChip.removeHref).toContain('dataType=Grid')
        expect(firstChip.removeHref).not.toContain('page=')
      })

      test('chip removeHref drops the filter key when no values remain', () => {
        const vm = viewModel({ q: 'flood', owner: 'Natural England' })
        expect(vm.activeFilterGroups[0].items[0].removeHref).toBe('/?q=flood')
      })

      test('adds a Date group for an exact date and omits when invalid', () => {
        const valid = viewModel({
          dateMode: 'exact',
          'exactDate-day': '14',
          'exactDate-month': '4',
          'exactDate-year': '2024'
        })
        const dateGroup = valid.activeFilterGroups.find((g) => g.name === 'updatedAt')
        expect(dateGroup.legend).toBe('Date')
        expect(dateGroup.items[0].label).toBe('14 April 2024')

        const invalid = viewModel({
          dateMode: 'exact',
          'exactDate-day': '30',
          'exactDate-month': '2',
          'exactDate-year': '2024'
        })
        expect(invalid.activeFilterGroups.find((g) => g.name === 'updatedAt')).toBeUndefined()
      })

      test('adds two chips for a range with both endpoints', () => {
        const vm = viewModel({
          dateMode: 'range',
          'afterDate-day': '1',
          'afterDate-month': '1',
          'afterDate-year': '2024',
          'beforeDate-day': '31',
          'beforeDate-month': '12',
          'beforeDate-year': '2024'
        })
        const dateGroup = vm.activeFilterGroups.find((g) => g.name === 'updatedAt')
        expect(dateGroup.items.map((i) => i.label)).toEqual([
          'After 1 January 2024',
          'Before 31 December 2024'
        ])
      })

      test('omits Date chips when a range endpoint is invalid', () => {
        const vm = viewModel({
          dateMode: 'range',
          'afterDate-day': '10',
          'afterDate-month': '1',
          'afterDate-year': '2024',
          'beforeDate-day': '5',
          'beforeDate-month': '1',
          'beforeDate-year': '2024'
        })
        expect(vm.activeFilterGroups.find((g) => g.name === 'updatedAt')).toBeUndefined()
      })

      test('range chips clear only their own endpoint', () => {
        const vm = viewModel({
          dateMode: 'range',
          'afterDate-day': '1',
          'afterDate-month': '1',
          'afterDate-year': '2024',
          'beforeDate-day': '31',
          'beforeDate-month': '12',
          'beforeDate-year': '2024'
        })
        const dateGroup = vm.activeFilterGroups.find((g) => g.name === 'updatedAt')
        const [after, before] = dateGroup.items
        expect(after.removeHref).toContain('beforeDate-year=2024')
        expect(after.removeHref).not.toContain('afterDate')
        expect(before.removeHref).toContain('afterDate-year=2024')
        expect(before.removeHref).not.toContain('beforeDate')
      })

      test('date chip removeHref preserves q and other filters', () => {
        const vm = viewModel({
          q: 'flood',
          owner: 'Natural England',
          dateMode: 'exact',
          'exactDate-day': '14',
          'exactDate-month': '4',
          'exactDate-year': '2024'
        })
        const dateGroup = vm.activeFilterGroups.find((g) => g.name === 'updatedAt')
        const href = dateGroup.items[0].removeHref
        expect(href).toContain('q=flood')
        expect(href).toContain('owner=Natural+England')
        expect(href).not.toContain('dateMode')
        expect(href).not.toContain('exactDate')
      })

      test('adds a Location group with valid coordinates and omits when invalid', () => {
        const valid = viewModel({ latitude: '51.5', longitude: '-0.1' })
        const locationGroup = valid.activeFilterGroups.find((g) => g.name === 'location')
        expect(locationGroup.legend).toBe('Location')
        expect(locationGroup.items[0].label).toBe('51.5, -0.1')

        const invalid = viewModel({ latitude: 'abc', longitude: '-0.1' })
        expect(invalid.activeFilterGroups.find((g) => g.name === 'location')).toBeUndefined()
      })

      test('omits Location chips when only one coordinate is provided', () => {
        const vm = viewModel({ latitude: '51.5' })
        expect(vm.activeFilterGroups.find((g) => g.name === 'location')).toBeUndefined()
      })

      test('location chip removeHref clears coordinates and preserves q', () => {
        const vm = viewModel({ q: 'flood', latitude: '51.5', longitude: '-0.1' })
        const locationGroup = vm.activeFilterGroups.find((g) => g.name === 'location')
        const href = locationGroup.items[0].removeHref
        expect(href).toContain('q=flood')
        expect(href).not.toContain('latitude')
      })
    })

    describe('pagination', () => {
      test('null when total fits in one page', () => {
        expect(viewModel({}, { total: 5 }).pagination).toBeNull()
        expect(viewModel({}, { total: 20 }).pagination).toBeNull()
      })

      test('first page has next but not previous', () => {
        const vm = viewModel({}, { total: 50 })
        expect(vm.pagination.previous).toBeUndefined()
        expect(vm.pagination.next).toEqual({ href: '/?page=2' })
      })

      test('last page has previous but not next', () => {
        const vm = viewModel({ page: '3' }, { total: 60 })
        expect(vm.pagination.previous).toEqual({ href: '/?page=2' })
        expect(vm.pagination.next).toBeUndefined()
      })

      test('marks the current page', () => {
        const vm = viewModel({ page: '2' }, { total: 60 })
        expect(vm.pagination.items.find((i) => i.current)).toEqual({
          number: 2,
          href: '/?page=2',
          current: true
        })
      })

      test('inserts ellipsis between distant page numbers', () => {
        const vm = viewModel({ page: '5' }, { total: 200 })
        expect(vm.pagination.items.some((i) => i.ellipsis)).toBe(true)
      })

      test('clamps a page beyond totalPages', () => {
        const vm = viewModel({ page: '99' }, { total: 40 })
        expect(vm.pagination.items.find((i) => i.current).number).toBe(2)
      })

      test('respects the selected page size when paginating', () => {
        expect(viewModel({ size: '50' }, { total: 40 }).pagination).toBeNull()
        const vm = viewModel({ size: '50' }, { total: 120 })
        expect(vm.pagination.items.filter((i) => !i.ellipsis)).toHaveLength(3)
      })
    })

    describe('resultRange', () => {
      const resultsOfLength = (n) =>
        Array.from({ length: n }, (_, i) => exampleResult({ id: String(i) }))

      test('first page range', () => {
        const vm = viewModel({}, { total: 50, results: resultsOfLength(20) })
        expect(vm.resultRange).toEqual({ from: 1, to: 20, total: 50 })
      })

      test('partial final page range', () => {
        const vm = viewModel({ page: '3' }, { total: 45, results: resultsOfLength(5) })
        expect(vm.resultRange).toEqual({ from: 41, to: 45, total: 45 })
      })
    })

    describe('dateFilter', () => {
      test('has mode null and no errors by default', () => {
        expect(viewModel().dateFilter).toMatchObject({
          mode: null,
          selected: false,
          hasErrors: false
        })
      })

      test('exposes exact date input params with current values', () => {
        const vm = viewModel({
          dateMode: 'exact',
          'exactDate-day': '14',
          'exactDate-month': '4',
          'exactDate-year': '2024'
        })
        expect(vm.dateFilter.mode).toBe('exact')
        expect(vm.dateFilter.selected).toBe(true)
        expect(vm.dateFilter.exactDateInput.items.map((i) => i.value))
          .toEqual(['14', '4', '2024'])
      })

      test('marks error class on only the missing parts', () => {
        const vm = viewModel({
          dateMode: 'exact',
          'exactDate-day': '14',
          'exactDate-month': '4'
        })
        expect(vm.dateFilter.hasErrors).toBe(true)
        const items = vm.dateFilter.exactDateInput.items
        expect(items.find((i) => i.name === 'day').classes).not.toContain('govuk-input--error')
        expect(items.find((i) => i.name === 'year').classes).toContain('govuk-input--error')
      })

      test('exposes after/before input params for range mode', () => {
        const vm = viewModel({
          dateMode: 'range',
          'afterDate-day': '1',
          'afterDate-month': '1',
          'afterDate-year': '2024'
        })
        expect(vm.dateFilter.afterDateInput.items.map((i) => i.value))
          .toEqual(['1', '1', '2024'])
        expect(vm.dateFilter.beforeDateInput.items.map((i) => i.value))
          .toEqual(['', '', ''])
      })
    })

    describe('locationFilter', () => {
      test('empty by default', () => {
        expect(viewModel().locationFilter).toMatchObject({
          selected: false,
          hasErrors: false
        })
      })

      test('exposes input params with the entered values', () => {
        const vm = viewModel({ latitude: '51.5', longitude: '-0.1' })
        expect(vm.locationFilter.selected).toBe(true)
        expect(vm.locationFilter.latitudeInput.value).toBe('51.5')
        expect(vm.locationFilter.longitudeInput.value).toBe('-0.1')
      })

      test('sets errorMessage on only the offending input', () => {
        const vm = viewModel({ latitude: 'abc', longitude: '-0.1' })
        expect(vm.locationFilter.hasErrors).toBe(true)
        expect(vm.locationFilter.latitudeInput.errorMessage.text).toContain('number')
        expect(vm.locationFilter.longitudeInput.errorMessage).toBeUndefined()
      })
    })

    describe('errorSummary', () => {
      test('lists date errors anchored to the first missing field', () => {
        const vm = viewModel({
          dateMode: 'exact',
          'exactDate-day': '14',
          'exactDate-month': '4'
        })
        expect(vm.errorSummary.titleText).toBe('There is a problem')
        expect(vm.errorSummary.errorList[0].href).toBe('#exactDate-year')
      })

      test('lists location errors with the correct anchors', () => {
        const vm = viewModel({ latitude: 'abc' })
        const anchors = vm.errorSummary.errorList.map((e) => e.href)
        expect(anchors).toContain('#latitude')
        expect(anchors).toContain('#longitude')
      })
    })

    describe('currentUrl', () => {
      test('includes q and non-default sort/size/page', () => {
        expect(viewModel({ q: 'flood' }).currentUrl).toBe('/?q=flood')
        expect(viewModel({ sort: 'titleAsc' }).currentUrl).toBe('/?sort=titleAsc')
        expect(viewModel({ size: '50' }).currentUrl).toBe('/?size=50')
        expect(viewModel({ page: '3' }).currentUrl).toBe('/?page=3')
      })

      test('omits default sort, size and page 1', () => {
        expect(viewModel({ sort: 'relevance' }).currentUrl).toBe('/')
        expect(viewModel({ size: '20' }).currentUrl).toBe('/')
        expect(viewModel({ page: '1' }).currentUrl).toBe('/')
      })

      test('appends repeated filter values', () => {
        expect(viewModel({ owner: ['A', 'B'] }).currentUrl).toBe('/?owner=A&owner=B')
      })

      test('encodes special characters in filter values', () => {
        const vm = viewModel({
          owner: 'Centre for Environment, Fisheries and Aquaculture Science'
        })
        expect(vm.currentUrl).toContain(
          'owner=Centre+for+Environment%2C+Fisheries+and+Aquaculture+Science'
        )
      })

      test('serialises an exact date and a date range', () => {
        const exact = viewModel({
          dateMode: 'exact',
          'exactDate-day': '14',
          'exactDate-month': '4',
          'exactDate-year': '2024'
        })
        expect(exact.currentUrl).toContain('dateMode=exact')
        expect(exact.currentUrl).toContain('exactDate-day=14')

        const range = viewModel({
          dateMode: 'range',
          'afterDate-day': '1',
          'afterDate-month': '1',
          'afterDate-year': '2024',
          'beforeDate-day': '31',
          'beforeDate-month': '12',
          'beforeDate-year': '2024'
        })
        expect(range.currentUrl).toContain('dateMode=range')
        expect(range.currentUrl).toContain('afterDate-year=2024')
        expect(range.currentUrl).toContain('beforeDate-year=2024')
      })

      test('serialises location coordinates', () => {
        const vm = viewModel({ latitude: '51.5', longitude: '-0.1' })
        expect(vm.currentUrl).toContain('latitude=51.5')
        expect(vm.currentUrl).toContain('longitude=-0.1')
      })
    })
  })
})
