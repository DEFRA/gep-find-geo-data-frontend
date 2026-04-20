import { buildPagination } from '../common/helpers/pagination.js'
import { dateFilter } from './filters/date/view-model.js'
import { locationFilter } from './filters/location/view-model.js'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
export const DEFAULT_PAGE_SIZE = 20

const SORT_OPTIONS = [
  { value: 'relevance', text: 'Best match' },
  { value: 'titleAsc', text: 'Alphabetical (A-Z)' },
  { value: 'titleDesc', text: 'Alphabetical (Z-A)' },
  { value: 'newest', text: 'Updated (newest)' },
  { value: 'oldest', text: 'Updated (oldest)' }
]

const VALID_SORTS = new Set(SORT_OPTIONS.map((option) => option.value))
const DEFAULT_SORT = SORT_OPTIONS[0].value
const VALID_PAGE_SIZES = new Set(PAGE_SIZE_OPTIONS)

const facetConfigs = [
  { name: 'owner', legend: 'Data owner' },
  { name: 'dataType', legend: 'Data type' }
]

const FACETS = facetConfigs.map((cfg) => cfg.name)

const ABSTRACT_WORD_LIMIT = 50
const QUERY_MAX_LENGTH = 500

function toArray (value) {
  if (value === undefined || value === null || value === '') {
    return []
  }
  const arr = Array.isArray(value) ? value : [value]
  const cleaned = arr.filter((v) => v !== undefined && v !== null && v !== '')
  return [...new Set(cleaned)]
}

function parsePageSize (raw) {
  const n = Number.parseInt(raw, 10)
  return VALID_PAGE_SIZES.has(n) ? n : DEFAULT_PAGE_SIZE
}

function truncateWords (text, limit) {
  if (typeof text !== 'string' || text.length === 0) {
    return text
  }
  const words = text.trim().split(/\s+/)
  if (words.length <= limit) {
    return text
  }
  return words.slice(0, limit).join(' ') + '...'
}

function parsePagination (rawQuery) {
  const pageNum = Number.parseInt(rawQuery.page, 10)
  const page = Number.isFinite(pageNum) && pageNum >= 1 ? pageNum : 1
  const size = parsePageSize(rawQuery.size)
  return { page, size }
}

function parseFacetFilters (rawQuery) {
  /** @type {Record<string, string[]>} */
  const filters = {}
  for (const key of FACETS) {
    const values = toArray(rawQuery[key])
    if (values.length > 0) {
      filters[key] = values
    }
  }
  return filters
}

/**
 * @typedef ParsedQuery
 * @property {string} q
 * @property {'relevance'|'titleAsc'|'titleDesc'|'newest'|'oldest'} sort
 * @property {number} page
 * @property {number} size
 * @property {import('../common/services/geonetwork/client.js').SearchFilters} filters
 * @property {import('./filters/date/view-model.js').DateInput} dateInput
 * @property {import('./filters/date/view-model.js').DateErrors} dateErrors
 * @property {import('./filters/location/view-model.js').LocationInput} locationInput
 * @property {import('./filters/location/view-model.js').LocationErrors} locationErrors
 * @property {boolean} hasErrors
 */

/**
 * @param {Record<string, any>} [rawQuery]
 * @returns {ParsedQuery}
 */
export function parseQuery (rawQuery = {}) {
  const q = typeof rawQuery.q === 'string' ? rawQuery.q.slice(0, QUERY_MAX_LENGTH) : ''
  const sort = VALID_SORTS.has(rawQuery.sort) ? rawQuery.sort : DEFAULT_SORT
  const { page, size } = parsePagination(rawQuery)
  const filters = parseFacetFilters(rawQuery)

  const dateInput = dateFilter.parse(rawQuery)
  const dateErrors = dateFilter.validate(dateInput)
  dateFilter.applyFilter(filters, dateInput, dateErrors)

  const locationInput = locationFilter.parse(rawQuery)
  const locationErrors = locationFilter.validate(locationInput)
  locationFilter.applyFilter(filters, locationInput, locationErrors)

  const hasErrors = Object.keys(dateErrors).length > 0 || Object.keys(locationErrors).length > 0

  return { q, sort, page, size, filters, dateInput, dateErrors, locationInput, locationErrors, hasErrors }
}

/**
 * @param {ParsedQuery} parsed
 * @returns {import('../common/services/geonetwork/client.js').SearchOptions}
 */
export function toSearchRequest (parsed) {
  return {
    query: parsed.q,
    from: (parsed.page - 1) * parsed.size,
    size: parsed.size,
    filters: parsed.filters,
    facets: FACETS,
    sort: parsed.sort
  }
}

function buildParams (parsed, overrides = {}) {
  const merged = { ...parsed, ...overrides }
  const params = new URLSearchParams()

  if (merged.q) {
    params.set('q', merged.q)
  }
  if (merged.sort && merged.sort !== DEFAULT_SORT) {
    params.set('sort', merged.sort)
  }

  for (const key of FACETS) {
    for (const value of merged.filters[key] ?? []) {
      params.append(key, value)
    }
  }

  dateFilter.appendToParams(params, merged.dateInput)
  locationFilter.appendToParams(params, merged.locationInput)

  if (merged.size !== DEFAULT_PAGE_SIZE) {
    params.set('size', String(merged.size))
  }
  if (merged.page > 1) {
    params.set('page', String(merged.page))
  }

  return params
}

function buildHref (basePath, parsed, overrides = {}) {
  const qs = buildParams(parsed, overrides).toString()
  return qs ? `${basePath}?${qs}` : basePath
}

function mapResults (results) {
  return results.map((result) => ({
    id: result.id,
    title: result.title,
    href: `/dataset/${result.id}`,
    abstract: truncateWords(result.abstract, ABSTRACT_WORD_LIMIT),
    owner: result.owner,
    updatedAt: result.updatedAt
  }))
}

function buildResultRange (parsed, response) {
  if (response.total === 0) {
    return null
  }
  const from = (parsed.page - 1) * parsed.size + 1
  const to = from + response.results.length - 1
  return { from, to, total: response.total }
}

function buildFacetGroups (response, parsed) {
  const facetsResp = response.facets ?? {}
  return facetConfigs.map((cfg) => {
    const buckets = facetsResp[cfg.name] ?? []
    const selected = new Set(parsed.filters[cfg.name] ?? [])
    const items = buckets.map((bucket) => ({
      value: bucket.value,
      text: bucket.value,
      checked: selected.has(bucket.value),
      hint: { text: String(bucket.count) }
    }))

    for (const value of selected) {
      if (!buckets.some((bucket) => bucket.value === value)) {
        items.push({
          value,
          text: value,
          checked: true,
          hint: { text: '0' }
        })
      }
    }

    return {
      name: cfg.name,
      legend: cfg.legend,
      items,
      selectedCount: selected.size
    }
  })
}

function buildFacetChipGroups (parsed, chipHref) {
  const groups = []
  for (const cfg of facetConfigs) {
    const values = parsed.filters[cfg.name] ?? []
    if (values.length === 0) {
      continue
    }
    const items = values.map((value) => {
      const remaining = values.filter((v) => v !== value)
      const remainingFilters = { ...parsed.filters }
      if (remaining.length === 0) {
        delete remainingFilters[cfg.name]
      } else {
        remainingFilters[cfg.name] = remaining
      }
      return {
        label: value,
        removeHref: chipHref({ filters: remainingFilters, page: 1 })
      }
    })
    groups.push({ name: cfg.name, legend: cfg.legend, items })
  }
  return groups
}

function buildActiveFilterGroups (parsed, basePath) {
  const chipHref = (overrides) => buildHref(basePath, parsed, overrides)
  const groups = buildFacetChipGroups(parsed, chipHref)

  const dateChips = dateFilter.toChipItems(parsed, chipHref)
  if (dateChips.length > 0) {
    groups.push({ ...dateFilter.chipGroup, items: dateChips })
  }

  const locationChips = locationFilter.toChipItems(parsed, chipHref)
  if (locationChips.length > 0) {
    groups.push({ ...locationFilter.chipGroup, items: locationChips })
  }

  return groups
}

function buildErrorSummary (parsed) {
  const items = [
    ...dateFilter.toErrorItems(parsed.dateErrors ?? {}),
    ...locationFilter.toErrorItems(parsed.locationErrors ?? {})
  ]
  return items.length > 0 ? { titleText: 'There is a problem', errorList: items } : null
}

/**
 * @param {object} input
 * @param {ParsedQuery} input.parsed
 * @param {import('../common/services/geonetwork/client.js').SearchResponse} input.response
 * @param {string} input.basePath
 */
export function buildViewModel ({ parsed, response, basePath }) {
  const sortOptions = SORT_OPTIONS.map((option) => ({
    ...option,
    selected: option.value === parsed.sort
  }))

  const pageSizeOptions = PAGE_SIZE_OPTIONS.map((value) => ({
    value: String(value),
    text: String(value),
    selected: value === parsed.size
  }))

  return {
    pageTitle: 'Search Defra Data',
    heading: 'Search Defra Data',
    hasErrors: parsed.hasErrors,
    searchQuery: parsed.q,
    selectedSort: parsed.sort,
    sortOptions,
    selectedPageSize: parsed.size,
    pageSizeOptions,
    totalResults: response.total,
    results: mapResults(response.results),
    facetGroups: buildFacetGroups(response, parsed),
    dateFilter: dateFilter.toFormViewModel(parsed),
    locationFilter: locationFilter.toFormViewModel(parsed),
    errorSummary: buildErrorSummary(parsed),
    activeFilterGroups: buildActiveFilterGroups(parsed, basePath),
    pagination: buildPagination({
      page: parsed.page,
      pageSize: parsed.size,
      total: response.total,
      hrefFor: (page) => buildHref(basePath, parsed, { page })
    }),
    resultRange: buildResultRange(parsed, response),
    currentUrl: buildHref(basePath, parsed)
  }
}
