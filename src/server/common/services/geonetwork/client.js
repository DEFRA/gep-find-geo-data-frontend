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
 * @property {string[]} [accessLevel]
 * @property {string[]} [updateFrequency]
 * @property {string[]} [categories]
 * @property {string[]} [keywords]
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
 * @typedef {Object} MetadataLink
 * @property {string} url
 * @property {string} name
 * @property {string} description
 */

/**
 * @typedef {Object} TemporalExtent
 * @property {string | null} start
 * @property {string | null} end
 */

/**
 * @typedef {Object} BoundingBox
 * @property {number} west
 * @property {number} south
 * @property {number} east
 * @property {number} north
 */

/**
 * @typedef {Object} MetadataRecord
 * @property {string} id
 * @property {string} title
 * @property {string} abstract
 * @property {string} dataType
 * @property {string | null} accessLevel
 * @property {string | null} updateFrequency
 * @property {string[]} categories
 * @property {string | null} owner
 * @property {string | null} updatedAt
 * @property {string | null} lineage
 * @property {string | null} contactPoint
 * @property {string | null} licence
 * @property {string | null} useLimitation
 * @property {string | null} language
 * @property {string[]} keywords
 * @property {string[]} format
 * @property {MetadataLink[]} links
 * @property {TemporalExtent | null} temporalExtent
 * @property {string | null} coordinateReferenceSystem
 * @property {BoundingBox | null} geographicExtent
 * @property {string | null} publicationDate
 * @property {string | null} creationDate
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
 * @property {string} label
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
