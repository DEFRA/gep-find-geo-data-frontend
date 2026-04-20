import { request } from 'undici'

import { config } from '../../../../config/config.js'
import { statusCodes } from '../../constants/status-codes.js'
import { createLogger } from '../../helpers/logging/logger.js'
import {
  facetNames,
  fields,
  searchFields,
  searchSourceIncludes,
  recordSourceIncludes,
  sortMap,
  validateSearchOptions
} from './fields.js'

const logger = createLogger()

const FACET_BUCKET_SIZE = 50
const REQUEST_TIMEOUT_MS = 10_000

/**
 * @param {import('./client.js').UpdatedAtBetween} [between]
 * @returns {object | null}
 */
function updatedAtRangeClause (between) {
  if (!between) {
    return null
  }
  const range = {}
  if (between.from) {
    range.gte = between.from
  }
  if (between.to) {
    range.lt = between.to
  }
  if (Object.keys(range).length === 0) {
    return null
  }

  const field = fields.updatedAt
  const clause = { range: { [field.esField]: range } }
  if (field.esNestedPath) {
    return { nested: { path: field.esNestedPath, query: clause } }
  }
  return clause
}

/**
 * @param {import('./client.js').SearchFilters} filters
 * @param {string} [excludeKey]
 * @returns {object[]}
 */
function facetFilterClauses (filters, excludeKey) {
  const clauses = []
  for (const name of facetNames) {
    if (name === excludeKey) {
      continue
    }
    const values = filters[name]
    if (values && values.length > 0) {
      clauses.push({ terms: { [fields[name].esField]: values } })
    }
  }
  return clauses
}

/**
 * @param {import('./client.js').GeoPoint} [location]
 * @returns {object | null}
 */
function locationClause (location) {
  if (!location) {
    return null
  }
  return {
    geo_shape: {
      geom: {
        shape: {
          type: 'point',
          coordinates: [location.longitude, location.latitude]
        },
        relation: 'intersects'
      }
    }
  }
}

/**
 * @param {{ query?: string, filters: import('./client.js').SearchFilters }} options
 * @returns {object | undefined}
 */
function buildQuery ({ query, filters }) {
  const bool = {}

  if (typeof query === 'string' && query.length > 0) {
    bool.must = [{
      multi_match: {
        query,
        fields: searchFields,
        type: 'best_fields'
      }
    }]
  }

  const filterClauses = []

  const range = updatedAtRangeClause(filters.updatedAtBetween)
  if (range) {
    filterClauses.push(range)
  }

  const geo = locationClause(filters.location)
  if (geo) {
    filterClauses.push(geo)
  }

  if (filterClauses.length > 0) {
    bool.filter = filterClauses
  }

  if (Object.keys(bool).length === 0) {
    return undefined
  }
  return { bool }
}

/**
 * @param {import('./client.js').SearchFilters} filters
 * @returns {object | undefined}
 */
function buildPostFilter (filters) {
  const clauses = facetFilterClauses(filters)
  if (clauses.length === 0) {
    return undefined
  }
  return { bool: { filter: clauses } }
}

/**
 * @param {string[]} facets
 * @param {import('./client.js').SearchFilters} filters
 * @returns {object | undefined}
 */
function buildAggs (facets, filters) {
  if (facets.length === 0) {
    return undefined
  }
  const aggs = {}
  for (const name of facets) {
    const otherFacetClauses = facetFilterClauses(filters, name)
    const aggFilter = otherFacetClauses.length > 0
      ? { bool: { filter: otherFacetClauses } }
      : { match_all: {} }

    aggs[name] = {
      filter: aggFilter,
      aggs: {
        [name]: { terms: { field: fields[name].esField, size: FACET_BUCKET_SIZE } }
      }
    }
  }
  return aggs
}

/**
 * @param {string} sort
 * @returns {Array<object> | undefined}
 */
function buildSort (sort) {
  const spec = sortMap[sort]
  if (!spec) {
    return undefined
  }

  if (spec.esSortField) {
    return [{ [spec.esSortField]: { order: spec.order } }]
  }

  const field = fields[spec.field]
  if (!field?.sortable) {
    return undefined
  }

  const path = field.esSortField ?? field.esField
  const clause = { order: spec.order }
  if (field.esNestedPath) {
    clause.nested = { path: field.esNestedPath }
  }
  return [{ [path]: clause }]
}

/**
 * @param {object} body
 * @returns {Promise<object>}
 */
async function postSearch (body) {
  const url = `${config.get('geonetwork.apiUrl')}/search/records/_search`

  let response
  try {
    response = await request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    })
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      logger.error({ url, timeoutMs: REQUEST_TIMEOUT_MS }, 'GeoNetwork search timed out')
      throw new Error('GeoNetwork search timed out')
    }
    logger.error({ url, err: err.message }, 'GeoNetwork search request failed')
    throw new Error('GeoNetwork search request failed')
  }

  const { statusCode, body: responseBody } = response

  if (statusCode !== statusCodes.ok) {
    const text = await responseBody.text()
    logger.error(
      { statusCode, url, responseBody: text.slice(0, 1024) },
      'GeoNetwork search returned non-200'
    )
    throw new Error(`GeoNetwork search failed with status ${statusCode}`)
  }

  return responseBody.json()
}

/**
 * @param {{ _id: string, _source?: Object<string, any> }} hit
 * @param {(field: import('./fields.js').Field) => boolean} include
 */
function mapHit (hit, include) {
  const src = hit._source ?? {}
  const result = { id: hit._id }

  for (const [name, field] of Object.entries(fields)) {
    if (!field.hitAccessor || !include(field)) {
      continue
    }
    result[name] = field.hitAccessor(src)
  }

  return result
}

/**
 * @param {{ _id: string, _source?: Object<string, any> }} hit
 * @returns {import('./client.js').SearchResult}
 */
function mapSearchHit (hit) {
  return /** @type {import('./client.js').SearchResult} */ (
    mapHit(hit, (field) => Boolean(field.inSearchResult))
  )
}

/**
 * @param {{ _id: string, _source?: Object<string, any> }} hit
 * @returns {import('./client.js').MetadataRecord}
 */
function mapRecordHit (hit) {
  return /** @type {import('./client.js').MetadataRecord} */ (
    mapHit(hit, () => true)
  )
}

/**
 * @param {object | undefined} esAggregations
 * @param {string[]} requestedNames
 * @returns {import('./client.js').FacetMap}
 */
function mapFacets (esAggregations, requestedNames) {
  /** @type {import('./client.js').FacetMap} */
  const facets = {}
  if (!esAggregations) {
    return facets
  }

  for (const name of requestedNames) {
    const inner = esAggregations[name]?.[name]
    if (!inner?.buckets) {
      continue
    }
    facets[name] = inner.buckets.map((b) => ({
      value: b.key,
      count: b.doc_count
    }))
  }

  return facets
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

  const body = {
    from,
    size,
    _source: searchSourceIncludes,
    query: buildQuery({ query, filters }),
    post_filter: buildPostFilter(filters),
    aggs: buildAggs(facets, filters),
    sort: buildSort(sort)
  }

  const esResponse = await postSearch(body)

  return {
    total: esResponse.hits?.total?.value ?? 0,
    results: (esResponse.hits?.hits ?? []).map(mapSearchHit),
    facets: mapFacets(esResponse.aggregations, facets)
  }
}

/**
 * @param {string} id
 * @returns {Promise<import('./client.js').MetadataRecord | null>}
 */
async function getRecord (id) {
  const body = {
    size: 1,
    _source: recordSourceIncludes,
    query: { ids: { values: [id] } }
  }

  const esResponse = await postSearch(body)
  const hit = esResponse.hits?.hits?.[0]
  if (!hit) {
    return null
  }
  return mapRecordHit(hit)
}

export { search, getRecord }
