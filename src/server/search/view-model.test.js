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
  facets: { owner: [], dataType: [], accessLevel: [], updateFrequency: [], categories: [] },
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
      expect(toSearchRequest(parseQuery({
        q: 'flood',
        page: '3',
        size: '50',
        sort: 'titleAsc',
        category: 'Environment',
        keyword: 'ecology'
      })))
        .toEqual({
          query: 'flood',
          from: 100,
          size: 50,
          filters: { categories: ['Environment'], keywords: ['ecology'] },
          facets: ['accessLevel', 'categories', 'owner', 'dataType', 'updateFrequency'],
          sort: 'titleAsc'
        })
    })

    test('offsets from zero and applies defaults when no query is given', () => {
      expect(toSearchRequest(parseQuery({}))).toMatchObject({
        query: '',
        from: 0,
        size: DEFAULT_PAGE_SIZE,
        sort: 'newest'
      })
    })
  })

  describe('parseQuery', () => {
    const emptyDateInput = {
      mode: null,
      sinceDate: { day: '', month: '', year: '' },
      fromYear: '',
      toYear: ''
    }

    test('defaults for an empty query', () => {
      expect(parseQuery({})).toEqual({
        q: '',
        sort: 'newest',
        page: 1,
        size: DEFAULT_PAGE_SIZE,
        filters: {},
        dateInput: emptyDateInput,
        dateErrors: {},
        hasErrors: false
      })
    })

    test('reads q, sort and page when valid', () => {
      const parsed = parseQuery({ q: 'flood', sort: 'titleAsc', page: '3' })
      expect(parsed).toMatchObject({ q: 'flood', sort: 'titleAsc', page: 3 })
    })

    test('clamps invalid sort to newest', () => {
      expect(parseQuery({ sort: 'nonsense' }).sort).toBe('newest')
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

    test.each([
      ['accessLevel', 'true'],
      ['category', 'Environment', 'categories'],
      ['dataType', 'Vector'],
      ['owner', 'Natural England'],
      ['updateFrequency', 'Monthly'],
      ['keyword', 'ecology', 'keywords']
    ])('parses supported filter %s', (name, value, filterName = name) => {
      expect(parseQuery({ [name]: value }).filters).toEqual({
        [filterName]: [value]
      })
    })

    test('parses filters from repeated and mixed values', () => {
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
      expect(parseQuery({ category: ['Environment', 'Elevation'] }).filters).toEqual({
        categories: ['Environment', 'Elevation']
      })
      expect(parseQuery({ keyword: ['ecology', 'ecology', 'landscape'] }).filters).toEqual({
        keywords: ['ecology', 'landscape']
      })
    })

    test('omits unknown and empty filter keys', () => {
      expect(parseQuery({ owner: '' }).filters).toEqual({})
      expect(parseQuery({ madeUp: 'x' }).filters).toEqual({})
    })

    test('parses a since date into an open-ended from range', () => {
      const parsed = parseQuery({
        dateMode: 'since',
        'sinceDate-day': '14',
        'sinceDate-month': '4',
        'sinceDate-year': '2024'
      })
      expect(parsed.filters.updatedAtBetween).toEqual({ from: '2024-04-14T00:00:00.000Z' })
      expect(parsed.dateInput.sinceDate).toEqual({ day: '14', month: '4', year: '2024' })
    })

    test('parses a period into year boundaries inclusive of both years', () => {
      const parsed = parseQuery({ dateMode: 'period', fromYear: '2002', toYear: '2004' })
      expect(parsed.filters.updatedAtBetween).toEqual({
        from: '2002-01-01T00:00:00.000Z',
        to: '2005-01-01T00:00:00.000Z'
      })
    })

    test('parses a period with only a from or only a to year', () => {
      expect(parseQuery({ fromYear: '2002' }).filters.updatedAtBetween).toEqual({
        from: '2002-01-01T00:00:00.000Z'
      })
      expect(parseQuery({ toYear: '2004' }).filters.updatedAtBetween).toEqual({
        to: '2005-01-01T00:00:00.000Z'
      })
    })

    test('parses relative modes against the current clock', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'))
      try {
        expect(parseQuery({ dateMode: 'last30Days' }).filters.updatedAtBetween).toEqual({
          from: '2024-05-16T12:00:00.000Z'
        })
        expect(parseQuery({ dateMode: 'last12Months' }).filters.updatedAtBetween).toEqual({
          from: '2023-06-15T12:00:00.000Z'
        })
      } finally {
        vi.useRealTimers()
      }
    })

    test('rejects an invalid calendar date but preserves raw parts', () => {
      const parsed = parseQuery({
        dateMode: 'since',
        'sinceDate-day': '30',
        'sinceDate-month': '2',
        'sinceDate-year': '2024'
      })
      expect(parsed.filters.updatedAtBetween).toBeUndefined()
      expect(parsed.dateInput.sinceDate).toEqual({ day: '30', month: '2', year: '2024' })
      expect(parsed.dateErrors.sinceDate.message).toBe('Date must be a real date')
    })

    test('ignores an unknown dateMode', () => {
      const parsed = parseQuery({ dateMode: 'weekly' })
      expect(parsed.dateInput.mode).toBeNull()
      expect(parsed.filters.updatedAtBetween).toBeUndefined()
    })

    test('flags partial and empty since dates', () => {
      const partial = parseQuery({
        dateMode: 'since',
        'sinceDate-day': '14',
        'sinceDate-month': '4'
      })
      expect(partial.dateErrors.sinceDate.missing).toEqual(['year'])
      expect(partial.filters.updatedAtBetween).toBeUndefined()

      expect(parseQuery({ dateMode: 'since' }).dateErrors.sinceDate.message).toBe('Enter a date')
    })

    test('does not flag an empty period but flags an invalid year', () => {
      expect(parseQuery({ dateMode: 'period' }).dateErrors).toEqual({})

      const invalid = parseQuery({ fromYear: '20x4' })
      expect(invalid.dateErrors.fromYear.message).toContain('from 1900 onwards')
    })

    test('flags a period where the from year is later than the to year', () => {
      const parsed = parseQuery({ dateMode: 'period', fromYear: '2024', toYear: '2020' })
      expect(parsed.dateErrors.toYear.message).toContain('same as or after')
      expect(parsed.filters.updatedAtBetween).toBeUndefined()
    })
  })

  describe('buildViewModel', () => {
    describe('top-level shape', () => {
      test('sensible defaults for an empty query and response', () => {
        expect(viewModel()).toMatchObject({
          pageTitle: 'Search Defra Group Land Data',
          heading: 'Search Defra Group Land Data',
          searchQuery: '',
          selectedSort: 'newest',
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

      test('sidebarItems contains facets and filters in declared order', () => {
        const items = viewModel().sidebarItems.map((i) => i.type === 'facet' ? i.name : i.type)
        expect(items).toEqual([
          'accessLevel', 'categories', 'owner', 'dataType', 'date', 'updateFrequency'
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

    describe('sidebarItems facets', () => {
      const findFacet = (vm, name) =>
        vm.sidebarItems.find((i) => i.type === 'facet' && i.name === name)

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
        expect(findFacet(vm, 'owner').items).toEqual([
          { value: 'Natural England', text: 'Natural England', checked: false, hint: { text: '5' } },
          { value: 'Environment Agency', text: 'Environment Agency', checked: false, hint: { text: '3' } }
        ])
      })

      test('marks selected values as checked and counts them', () => {
        const vm = viewModel(
          { owner: 'Natural England' },
          { facets: { owner: [{ value: 'Natural England', count: 5 }], dataType: [] } }
        )
        expect(findFacet(vm, 'owner').items[0].checked).toBe(true)
        expect(findFacet(vm, 'owner').selectedCount).toBe(1)
      })

      test('renders a selected value with zero hint even if absent from response', () => {
        const vm = viewModel({ owner: 'Natural England' })
        expect(findFacet(vm, 'owner').items).toEqual([{
          value: 'Natural England',
          text: 'Natural England',
          checked: true,
          hint: { text: '0' }
        }])
      })

      test('uses facet labels for checkbox text', () => {
        const vm = viewModel(
          { accessLevel: 'true' },
          { facets: { accessLevel: [{ value: 'true', label: 'Open data', count: 2 }] } }
        )
        expect(findFacet(vm, 'accessLevel').items).toEqual([{
          value: 'true',
          text: 'Open data',
          checked: true,
          hint: { text: '2' }
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

      test('uses facet labels for active filter chips', () => {
        const vm = viewModel({ accessLevel: 'true' })
        const group = vm.activeFilterGroups.find((g) => g.name === 'accessLevel')
        expect(group.items[0].label).toBe('Open data')
        expect(group.items[0].removeHref).toBe('/')
      })

      test('produces separate groups per facet in sidebar order', () => {
        const vm = viewModel({ dataType: 'Vector', owner: 'Natural England' })
        expect(vm.activeFilterGroups.map((g) => g.name)).toEqual(['owner', 'dataType'])
      })

      test('adds keyword chips without adding a sidebar facet', () => {
        const vm = viewModel({ keyword: ['ecology', 'landscape'] })
        const group = vm.activeFilterGroups.find((g) => g.name === 'keywords')

        expect(group.legend).toBe('Keyword')
        expect(group.items.map((item) => item.label)).toEqual(['ecology', 'landscape'])
        expect(vm.sidebarItems.some((item) => item.name === 'keywords')).toBe(false)
      })

      test('adds keyword values as hidden filters for form serialisation', () => {
        expect(viewModel({ keyword: ['ecology', 'landscape'] }).hiddenFilters).toEqual([
          { name: 'keyword', value: 'ecology' },
          { name: 'keyword', value: 'landscape' }
        ])
      })

      test('chip removeHref drops only the targeted value and always drops page', () => {
        const vm = viewModel({ q: 'flood', owner: ['A', 'B'], dataType: 'Grid', page: '5' })
        const ownerGroup = vm.activeFilterGroups.find((g) => g.name === 'owner')
        const firstChip = ownerGroup.items[0]
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

      test('adds a Date group for a since date and omits when invalid', () => {
        const valid = viewModel({
          dateMode: 'since',
          'sinceDate-day': '14',
          'sinceDate-month': '4',
          'sinceDate-year': '2024'
        })
        const dateGroup = valid.activeFilterGroups.find((g) => g.name === 'updatedAt')
        expect(dateGroup.legend).toBe('Date')
        expect(dateGroup.items[0].label).toBe('Since 14 April 2024')

        const invalid = viewModel({
          dateMode: 'since',
          'sinceDate-day': '30',
          'sinceDate-month': '2',
          'sinceDate-year': '2024'
        })
        expect(invalid.activeFilterGroups.find((g) => g.name === 'updatedAt')).toBeUndefined()
      })

      test('adds a single chip for a relative mode', () => {
        const vm = viewModel({ dateMode: 'last30Days' })
        const dateGroup = vm.activeFilterGroups.find((g) => g.name === 'updatedAt')
        expect(dateGroup.items.map((i) => i.label)).toEqual(['Last 30 days'])
      })

      test('adds two chips for a period with both years', () => {
        const vm = viewModel({ dateMode: 'period', fromYear: '2002', toYear: '2004' })
        const dateGroup = vm.activeFilterGroups.find((g) => g.name === 'updatedAt')
        expect(dateGroup.items.map((i) => i.label)).toEqual(['From 2002', 'To 2004'])
      })

      test('omits Date chips when a period year is invalid', () => {
        const vm = viewModel({ dateMode: 'period', fromYear: '20x2', toYear: '2004' })
        expect(vm.activeFilterGroups.find((g) => g.name === 'updatedAt')).toBeUndefined()
      })

      test('period chips clear only their own endpoint', () => {
        const vm = viewModel({ dateMode: 'period', fromYear: '2002', toYear: '2004' })
        const dateGroup = vm.activeFilterGroups.find((g) => g.name === 'updatedAt')
        const [from, to] = dateGroup.items
        expect(from.removeHref).toContain('toYear=2004')
        expect(from.removeHref).not.toContain('fromYear')
        expect(to.removeHref).toContain('fromYear=2002')
        expect(to.removeHref).not.toContain('toYear')
      })

      test('date chip removeHref preserves q and other filters', () => {
        const vm = viewModel({
          q: 'flood',
          owner: 'Natural England',
          dateMode: 'since',
          'sinceDate-day': '14',
          'sinceDate-month': '4',
          'sinceDate-year': '2024'
        })
        const dateGroup = vm.activeFilterGroups.find((g) => g.name === 'updatedAt')
        const href = dateGroup.items[0].removeHref
        expect(href).toContain('q=flood')
        expect(href).toContain('owner=Natural+England')
        expect(href).not.toContain('dateMode')
        expect(href).not.toContain('sinceDate')
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

      test('exposes since date input params with current values', () => {
        const vm = viewModel({
          dateMode: 'since',
          'sinceDate-day': '14',
          'sinceDate-month': '4',
          'sinceDate-year': '2024'
        })
        expect(vm.dateFilter.mode).toBe('since')
        expect(vm.dateFilter.selected).toBe(true)
        expect(vm.dateFilter.sinceDateInput.items.map((i) => i.value))
          .toEqual(['14', '4', '2024'])
      })

      test('marks error class on only the missing parts', () => {
        const vm = viewModel({
          dateMode: 'since',
          'sinceDate-day': '14',
          'sinceDate-month': '4'
        })
        expect(vm.dateFilter.hasErrors).toBe(true)
        const items = vm.dateFilter.sinceDateInput.items
        expect(items.find((i) => i.name === 'day').classes).not.toContain('govuk-input--error')
        expect(items.find((i) => i.name === 'year').classes).toContain('govuk-input--error')
      })

      test('exposes year values and error for period mode', () => {
        const vm = viewModel({ dateMode: 'period', fromYear: '2002', toYear: '20x4' })
        expect(vm.dateFilter.fromYear).toBe('2002')
        expect(vm.dateFilter.toYear).toBe('20x4')
        expect(vm.dateFilter.toYearError).toContain('from 1900 onwards')
      })

      test('does not count an empty period as selected', () => {
        const vm = viewModel({ dateMode: 'period' })
        expect(vm.dateFilter.selected).toBe(false)
        expect(vm.currentUrl).toBe('/')
        expect(vm.activeFilterGroups.find((g) => g.name === 'updatedAt')).toBeUndefined()
      })
    })

    describe('errorSummary', () => {
      test('lists date errors anchored to the first missing field', () => {
        const vm = viewModel({
          dateMode: 'since',
          'sinceDate-day': '14',
          'sinceDate-month': '4'
        })
        expect(vm.errorSummary.titleText).toBe('There is a problem')
        expect(vm.errorSummary.errorList[0].href).toBe('#sinceDate-year')
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
        expect(viewModel({ sort: 'newest' }).currentUrl).toBe('/')
        expect(viewModel({ size: '20' }).currentUrl).toBe('/')
        expect(viewModel({ page: '1' }).currentUrl).toBe('/')
      })

      test('appends repeated filter values', () => {
        expect(viewModel({ owner: ['A', 'B'] }).currentUrl).toBe('/?owner=A&owner=B')
        expect(viewModel({ category: ['Environment', 'Elevation'] }).currentUrl)
          .toBe('/?category=Environment&category=Elevation')
        expect(viewModel({ keyword: ['ecology', 'landscape'] }).currentUrl)
          .toBe('/?keyword=ecology&keyword=landscape')
      })

      test('encodes special characters in filter values', () => {
        const vm = viewModel({
          owner: 'Centre for Environment, Fisheries and Aquaculture Science'
        })
        expect(vm.currentUrl).toContain(
          'owner=Centre+for+Environment%2C+Fisheries+and+Aquaculture+Science'
        )
      })

      test('serialises a since date and a time period', () => {
        const since = viewModel({
          dateMode: 'since',
          'sinceDate-day': '14',
          'sinceDate-month': '4',
          'sinceDate-year': '2024'
        })
        expect(since.currentUrl).toContain('dateMode=since')
        expect(since.currentUrl).toContain('sinceDate-day=14')

        const period = viewModel({ dateMode: 'period', fromYear: '2002', toYear: '2004' })
        expect(period.currentUrl).toContain('dateMode=period')
        expect(period.currentUrl).toContain('fromYear=2002')
        expect(period.currentUrl).toContain('toYear=2004')
      })
    })
  })
})
