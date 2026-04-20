import * as api from './api.js'
import * as mock from './mock.js'
import { config } from '../../../../config/config.js'

/**
 * @typedef {Object} UpdatedAtBetween
 * @property {string} [from]
 * @property {string} [to]
 */

/**
 * @typedef {Object} GeoPoint
 * @property {number} latitude
 * @property {number} longitude
 */

/**
 * @typedef {Object} SearchFilters
 * @property {string[]} [owner]
 * @property {string[]} [dataType]
 * @property {UpdatedAtBetween} [updatedAtBetween]
 * @property {GeoPoint} [location]
 */

/**
 * @typedef {Object} SearchOptions
 * @property {string} [query]
 * @property {number} [from]
 * @property {number} [size]
 * @property {SearchFilters} [filters]
 * @property {string[]} [facets]
 * @property {'relevance'|'titleAsc'|'titleDesc'|'newest'|'oldest'} [sort]
 */

/**
 * @typedef {Object} MetadataRecord
 * @property {string} id
 * @property {string} title
 * @property {string} abstract
 * @property {string} dataType
 * @property {string | null} owner
 * @property {string | null} updatedAt
 */

/**
 * @typedef {Object} SearchResult
 * @property {string} id
 * @property {string} title
 * @property {string} abstract
 * @property {string | null} owner
 * @property {string | null} updatedAt
 */

/**
 * @typedef {Object} Facet
 * @property {string} value
 * @property {number} count
 */

/**
 * @typedef {Object<string, Facet[]>} FacetMap
 */

/**
 * @typedef {Object} SearchResponse
 * @property {number} total
 * @property {SearchResult[]} results
 * @property {FacetMap} facets
 */

/**
 * @param {SearchOptions} [options]
 * @returns {Promise<SearchResponse>}
 */
async function search (options) {
  const client = config.get('geonetwork.useMock') ? mock : api
  return client.search(options)
}

/**
 * @param {string} id
 * @returns {Promise<MetadataRecord | null>}
 */
async function getRecord (id) {
  const client = config.get('geonetwork.useMock') ? mock : api
  return client.getRecord(id)
}

export { search, getRecord }
