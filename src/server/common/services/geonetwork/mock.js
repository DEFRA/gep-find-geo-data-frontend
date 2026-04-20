import { config } from '../../../../config/config.js'
import { facetNames, fields, sortMap, validateSearchOptions } from './fields.js'
import { curatedRecords } from './fixtures.js'
import { generateRecords } from './record-generator.js'

const mockRecordCount = config.get('geonetwork.mockRecordCount')
const generatedCount = Math.max(0, mockRecordCount - curatedRecords.length)

/** @type {import('./client.js').MetadataRecord[]} */
const pool = curatedRecords.concat(
  generateRecords(generatedCount, { seed: 42 })
)

function toArray (value) {
  if (value == null) {
    return []
  }
  return Array.isArray(value) ? value : [value]
}

function matchesQuery (record, terms) {
  const searchable = [record.title, record.abstract].join(' ').toLowerCase()
  return terms.every((term) => searchable.includes(term))
}

/**
 * @param {import('./client.js').MetadataRecord} record
 * @returns {import('./client.js').SearchResult}
 */
function pickSearchFields (record) {
  const result = { id: record.id }
  for (const [name, field] of Object.entries(fields)) {
    if (!field.inSearchResult) {
      continue
    }
    result[name] = record[name] ?? null
  }
  return /** @type {import('./client.js').SearchResult} */ (result)
}

function matchesTerms (recordValue, values) {
  if (!values || values.length === 0) {
    return true
  }
  const recordValues = toArray(recordValue)
  return values.some((v) => recordValues.includes(v))
}

function matchesUpdatedAtBetween (value, between) {
  if (!between) {
    return true
  }
  if (value == null) {
    return between.from === undefined && between.to === undefined
  }
  if (between.from !== undefined && value < between.from) {
    return false
  }
  if (between.to !== undefined && value >= between.to) {
    return false
  }
  return true
}

function matchesFilters (record, filters, excludeKey) {
  if (!matchesUpdatedAtBetween(record.updatedAt, filters.updatedAtBetween)) {
    return false
  }
  for (const name of facetNames) {
    if (name === excludeKey) {
      continue
    }
    if (!matchesTerms(record[name], filters[name])) {
      return false
    }
  }
  return true
}

/**
 * @param {Array<import('./client.js').MetadataRecord>} records
 * @param {string} sort
 * @returns {Array<import('./client.js').MetadataRecord>}
 */
function sortRecords (records, sort) {
  const spec = sortMap[sort]
  if (!spec?.field) {
    return records
  }

  const direction = spec.order === 'desc' ? -1 : 1
  return [...records].sort((a, b) => {
    return direction * String(a[spec.field]).localeCompare(String(b[spec.field]))
  })
}

/**
 * @param {Array<object>} records
 * @param {string} name
 * @returns {import('./client.js').Facet[]}
 */
function mapFacet (records, name) {
  const counts = new Map()
  for (const record of records) {
    for (const value of toArray(record[name])) {
      counts.set(value, (counts.get(value) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * @param {import('./client.js').SearchOptions} [options]
 * @returns {Promise<import('./client.js').SearchResponse>}
 */
async function search ({
  query,
  from = 0,
  size = 10,
  filters = {},
  facets = [],
  sort = 'relevance'
} = {}) {
  validateSearchOptions({ filters, facets, sort })

  let queryMatched = pool

  if (typeof query === 'string' && query.length > 0) {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
    queryMatched = queryMatched.filter((record) => matchesQuery(record, terms))
  }

  const matched = queryMatched.filter((record) => matchesFilters(record, filters))

  const sorted = sortRecords(matched, sort)
  const paged = sorted.slice(from, from + size)

  const facetMap = /** @type {import('./client.js').FacetMap} */ ({})
  for (const name of facets) {
    const facetPool = queryMatched.filter(
      (record) => matchesFilters(record, filters, name)
    )
    facetMap[name] = mapFacet(facetPool, name)
  }

  return {
    total: sorted.length,
    results: paged.map(pickSearchFields),
    facets: facetMap
  }
}

/**
 * @param {string} id
 * @returns {Promise<import('./client.js').MetadataRecord | null>}
 */
async function getRecord (id) {
  return pool.find((record) => record.id === id) ?? null
}

export { search, getRecord }
