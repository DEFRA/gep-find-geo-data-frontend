/**
 * @typedef {object} Field
 * @property {string} [esField]
 * @property {string} [esSortField]
 * @property {string} [esNestedPath]
 * @property {boolean} [sortable]
 * @property {boolean} [facetable]
 * @property {boolean} [searchable]
 * @property {number} [searchBoost]
 * @property {(src: object) => string | null} [hitAccessor]
 */

/** @type {Record<string, Field>} */
const fields = {
  title: {
    esField: 'resourceTitleObject.default',
    esSortField: 'resourceTitleObject.default.keyword',
    sortable: true,
    searchable: true,
    searchBoost: 3,
    hitAccessor: (src) => src.resourceTitleObject?.default ?? ''
  },
  abstract: {
    esField: 'resourceAbstractObject.default',
    searchable: true,
    hitAccessor: (src) => src.resourceAbstractObject?.default ?? ''
  },
  owner: {
    esField: 'OrgForResourceObject.default',
    facetable: true,
    hitAccessor: (src) => src.OrgForResourceObject?.default ?? null
  },
  dataType: {
    esField: 'cl_spatialRepresentationType.key',
    facetable: true
  },
  updatedAt: {
    esField: 'resourceDate.date',
    esNestedPath: 'resourceDate',
    sortable: true,
    hitAccessor: (src) => {
      const dates = (src.resourceDate ?? [])
        .map((entry) => entry?.date)
        .filter(Boolean)
      return dates.length === 0 ? null : dates.reduce((a, b) => (a > b ? a : b))
    }
  }
}

/**
 * @typedef {object} Sort
 * @property {'asc' | 'desc'} order
 * @property {string} [field]
 * @property {string} [esSortField]
 */

/** @type {Record<string, Sort>} */
const sortMap = {
  relevance: { esSortField: '_score', order: 'desc' },
  titleAsc: { field: 'title', order: 'asc' },
  titleDesc: { field: 'title', order: 'desc' },
  newest: { field: 'updatedAt', order: 'desc' },
  oldest: { field: 'updatedAt', order: 'asc' }
}

const sourceIncludes = Object.values(fields)
  .filter((field) => field.hitAccessor && field.esField)
  .map((field) => field.esField)

const searchFields = Object.values(fields)
  .filter((field) => field.searchable && field.esField)
  .map((field) =>
    field.searchBoost ? `${field.esField}^${field.searchBoost}` : field.esField
  )

const facetNames = Object.keys(fields).filter(
  (name) => fields[name].facetable && fields[name].esField
)

const validFilterKeys = new Set([...facetNames, 'updatedAtBetween'])

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

export {
  fields,
  sortMap,
  sourceIncludes,
  searchFields,
  facetNames,
  validateSearchOptions
}
