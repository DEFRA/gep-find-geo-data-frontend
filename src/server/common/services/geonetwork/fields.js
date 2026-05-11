import {
  allDefaults,
  boundingBox,
  datedEntry,
  firstDefault,
  firstEmail,
  firstNestedCode,
  keywordDefaults,
  latestNestedDate,
  linkArray,
  mappedValue,
  objectDefault,
  rawArray,
  temporalExtent
} from './field-accessors.js'

const accessLevelMap = { true: 'Open data', false: 'Restricted access' }

/**
 * @typedef {object} FieldOperation
 * @property {string | string[]} field GeoNetwork Elasticsearch field used for this operation.
 * @property {string} [nestedPath] Nested document path when the field must be queried or sorted inside a nested clause.
 * @property {number} [boost] Full-text search boost, only used by search operations.
 * @property {Record<string, string>} [labelMap] Display labels for machine values when GeoNetwork does not provide labels.
 */

/**
 * @typedef {object} Field
 * @property {string[]} source Elasticsearch source paths required to build this field.
 * @property {FieldOperation} [search] Full-text field used by multi_match.
 * @property {FieldOperation} [filter] Field used when this value is selected as a filter.
 * @property {FieldOperation} [facet] Field used to aggregate checkbox options.
 * @property {FieldOperation} [sort] Field used to sort results.
 * @property {boolean} [inSearchResult] Include this field in search result rows.
 * @property {(src: object) => *} [hitAccessor] Maps a GeoNetwork _source object into the domain value.
 */

/**
 * @typedef {object} Sort
 * @property {'asc' | 'desc'} order
 * @property {string} field
 */

/** @type {Record<string, Field>} */
const fields = {
  title: {
    source: ['resourceTitleObject.default'],
    search: { field: 'resourceTitleObject.default', boost: 3 },
    sort: { field: 'resourceTitleObject.default.keyword' },
    inSearchResult: true,
    hitAccessor: objectDefault('resourceTitleObject', '')
  },
  abstract: {
    source: ['resourceAbstractObject.default'],
    search: { field: 'resourceAbstractObject.default' },
    inSearchResult: true,
    hitAccessor: objectDefault('resourceAbstractObject', '')
  },
  owner: {
    source: ['OrgForResourceObject.default'],
    filter: { field: 'OrgForResourceObject.default' },
    facet: { field: 'OrgForResourceObject.default' },
    inSearchResult: true,
    hitAccessor: objectDefault('OrgForResourceObject')
  },
  dataType: {
    source: ['cl_spatialRepresentationType'],
    filter: { field: 'cl_spatialRepresentationType.default' },
    facet: { field: 'cl_spatialRepresentationType.default' },
    hitAccessor: firstDefault('cl_spatialRepresentationType')
  },
  accessLevel: {
    source: ['isOpenData'],
    filter: { field: 'isOpenData' },
    facet: { field: 'isOpenData', labelMap: accessLevelMap },
    hitAccessor: mappedValue('isOpenData', accessLevelMap)
  },
  updateFrequency: {
    source: ['cl_maintenanceAndUpdateFrequency'],
    filter: { field: 'cl_maintenanceAndUpdateFrequency.default' },
    facet: { field: 'cl_maintenanceAndUpdateFrequency.default' },
    hitAccessor: firstDefault('cl_maintenanceAndUpdateFrequency')
  },
  categories: {
    source: ['cl_topic'],
    filter: { field: 'cl_topic.default' },
    facet: { field: 'cl_topic.default' },
    hitAccessor: allDefaults('cl_topic')
  },
  updatedAt: {
    source: ['resourceDate.date'],
    filter: { field: 'resourceDate.date', nestedPath: 'resourceDate' },
    sort: { field: 'resourceDate.date', nestedPath: 'resourceDate' },
    inSearchResult: true,
    hitAccessor: latestNestedDate('resourceDate')
  },
  lineage: {
    source: ['lineageObject.default'],
    hitAccessor: objectDefault('lineageObject')
  },
  contactPoint: {
    source: ['contactForResource'],
    hitAccessor: firstEmail('contactForResource')
  },
  licence: {
    source: ['MD_ConstraintsUseLimitationObject'],
    hitAccessor: firstDefault('MD_ConstraintsUseLimitationObject')
  },
  useLimitation: {
    source: ['MD_LegalConstraintsOtherConstraintsObject'],
    hitAccessor: firstDefault('MD_LegalConstraintsOtherConstraintsObject')
  },
  language: {
    source: ['mainLanguage'],
    hitAccessor: (src) => src.mainLanguage ?? null
  },
  keywords: {
    // Raw `tag` aggregates topics and thesaurus keywords. Use structured keyword
    // fields for filtering, and source `cl_topic` only to exclude categories.
    source: ['th_httpinspireeceuropaeutheme-theme', 'th_otherKeywords-theme', 'cl_topic'],
    filter: {
      field: [
        'th_httpinspireeceuropaeutheme-theme.default',
        'th_otherKeywords-theme.default'
      ]
    },
    hitAccessor: keywordDefaults(
      'th_httpinspireeceuropaeutheme-theme',
      'th_otherKeywords-theme',
      'cl_topic'
    )
  },
  format: {
    source: ['format'],
    hitAccessor: rawArray('format')
  },
  links: {
    source: ['link'],
    hitAccessor: linkArray('link')
  },
  temporalExtent: {
    source: ['resourceTemporalExtentDetails'],
    hitAccessor: temporalExtent('resourceTemporalExtentDetails')
  },
  coordinateReferenceSystem: {
    source: ['crsDetails'],
    hitAccessor: firstNestedCode('crsDetails')
  },
  geographicExtent: {
    source: ['geom'],
    hitAccessor: boundingBox('geom')
  },
  publicationDate: {
    source: ['resourceDate.date', 'resourceDate.type'],
    hitAccessor: datedEntry('resourceDate', 'publication')
  },
  creationDate: {
    source: ['resourceDate.date', 'resourceDate.type'],
    hitAccessor: datedEntry('resourceDate', 'creation')
  }
}

/** @type {Record<string, Sort>} */
const sortMap = {
  relevance: { field: '_score', order: 'desc' },
  titleAsc: { field: 'title', order: 'asc' },
  titleDesc: { field: 'title', order: 'desc' },
  newest: { field: 'updatedAt', order: 'desc' },
  oldest: { field: 'updatedAt', order: 'asc' }
}

const searchSourceIncludes = Object.values(fields)
  .filter((field) => field.inSearchResult && field.hitAccessor)
  .flatMap((field) => field.source)

const recordSourceIncludes = Object.values(fields)
  .filter((field) => field.hitAccessor)
  .flatMap((field) => field.source)

const searchFields = Object.values(fields)
  .filter((field) => field.search)
  .map((field) => {
    return field.search.boost
      ? `${field.search.field}^${field.search.boost}`
      : field.search.field
  })

const facetNames = Object.keys(fields).filter(
  (name) => fields[name].facet
)

const filterNames = Object.keys(fields).filter(
  (name) => fields[name].filter
)

const validFilterKeys = new Set([...filterNames, 'updatedAtBetween', 'location'])

/**
 * @param {object} [options]
 * @param {object} [options.filters]
 * @param {string[]} [options.facets]
 * @param {string} [options.sort]
 */
function validateSearchOptions ({ filters, facets, sort } = {}) {
  if (sort !== undefined && !sortMap[sort]) {
    throw new Error(`Unknown sort "${sort}"`)
  }
  if (filters) {
    for (const key of Object.keys(filters)) {
      if (!validFilterKeys.has(key)) {
        throw new Error(`Unknown filter key "${key}"`)
      }
    }
  }
  if (facets) {
    for (const name of facets) {
      if (!facetNames.includes(name)) {
        throw new Error(`Unknown facet "${name}"`)
      }
    }
  }
}

/**
 * @param {string} name
 * @param {string} value
 * @returns {string}
 */
function facetValueLabel (name, value) {
  return fields[name]?.facet?.labelMap?.[value] ?? value
}

/**
 * @param {string} name
 * @param {string} label
 * @returns {string}
 */
function facetLabelValue (name, label) {
  const labelMap = fields[name]?.facet?.labelMap
  if (!labelMap) {
    return label
  }

  for (const [value, mappedLabel] of Object.entries(labelMap)) {
    if (mappedLabel === label) {
      return value
    }
  }

  return label
}

export {
  fields,
  sortMap,
  searchSourceIncludes,
  recordSourceIncludes,
  searchFields,
  facetNames,
  filterNames,
  facetLabelValue,
  facetValueLabel,
  validateSearchOptions
}
