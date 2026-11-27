import { ALL_OF_ENGLAND, areaPhrase, isAreaCode } from './areas.js'
import { GRID, findGridSize, formats, formatsFor, hasAreas } from './downloads.js'

/**
 * @typedef {import('./downloads.js').LandModelKind} LandModelKind
 */

/**
 * @typedef {Object} LandModelSelection
 * @property {LandModelKind} kind
 * @property {string | null} gridSize
 * @property {string | null} area
 * @property {string | null} format
 */

/**
 * @typedef {Object} CompleteLandModelSelection
 * @property {LandModelKind} kind
 * @property {string | null} gridSize
 * @property {string} area
 * @property {string} format
 */

/**
 * @typedef {Object} LandModelError
 * @property {'gridSize' | 'area' | 'format'} field
 * @property {string} text
 * @property {string | null} [value] The rejected answer, kept selected if it is still an option.
 */

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function stringValue (value) {
  return typeof value === 'string' && value ? value : null
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function parseArea (value) {
  const area = stringValue(value)
  return area === ALL_OF_ENGLAND || isAreaCode(area) ? area : null
}

/**
 * @param {LandModelKind} kind
 * @param {Record<string, unknown>} [query]
 * @returns {LandModelSelection}
 */
function parseSelection (kind, query = {}) {
  const gridSize = kind === GRID ? findGridSize(stringValue(query.gridSize)) : null

  let area
  if (kind === GRID && !gridSize) {
    area = null
  } else if (hasAreas(kind, gridSize)) {
    area = parseArea(query.area)
  } else {
    area = ALL_OF_ENGLAND
  }

  const offered = formatsFor(kind, gridSize, area)
  const requested = stringValue(query.format)
  let format
  if (offered?.includes(requested)) {
    format = requested
  } else if (offered?.length === 1) {
    format = offered[0]
  } else {
    format = null
  }

  return { kind, gridSize: gridSize?.id ?? null, area, format }
}

/**
 * @param {LandModelSelection} selection
 * @returns {LandModelError[]}
 */
function selectionErrors (selection) {
  if (selection.kind === GRID && !selection.gridSize) {
    return [{ field: 'gridSize', text: 'Select a grid size' }]
  } else if (!selection.area) {
    return [{ field: 'area', text: 'Select an area' }]
  } else {
    return []
  }
}

/**
 * @param {LandModelSelection} selection
 * @param {Record<string, unknown>} [query]
 * @returns {LandModelError[]}
 */
function downloadErrors (selection, query = {}) {
  const errors = selectionErrors(selection)
  if (errors.length) {
    return errors
  }

  if (query.area === '') {
    return [{ field: 'area', text: 'Select an area' }]
  }

  const gridSize = findGridSize(selection.gridSize)
  const requestedArea = stringValue(query.area)
  if (requestedArea && requestedArea !== selection.area) {
    return [{ field: 'area', text: `Area must be All of England for the ${gridSize.shortLabel} grid`, value: requestedArea }]
  }

  const requestedFormat = stringValue(query.format)
  if (requestedFormat && requestedFormat !== selection.format) {
    const offered = formatsFor(selection.kind, gridSize, selection.area).map((id) => formats[id].label)
    const product = selection.kind === GRID ? `the ${gridSize.shortLabel} grid` : 'features'
    return [{ field: 'format', text: `Format must be ${offered.join(' or ')} for ${product} in ${areaPhrase(selection.area)}` }]
  }

  if (!selection.format || query.format === '') {
    return [{ field: 'format', text: 'Select a format' }]
  }

  return []
}

/**
 * @param {string} area
 * @returns {LandModelError}
 */
function missingAreaError (area) {
  return { field: 'area', text: `There is no data for area ${area}, select a different area`, value: area }
}

/**
 * @param {LandModelSelection} selection
 * @returns {selection is CompleteLandModelSelection}
 */
function isComplete (selection) {
  return selectionErrors(selection).length === 0 && Boolean(selection.format)
}

/**
 * @param {LandModelSelection} selection
 * @returns {string}
 */
function selectionQuery (selection) {
  const params = new URLSearchParams()
  if (selection.gridSize) {
    params.set('gridSize', selection.gridSize)
  }

  if (selection.area && hasAreas(selection.kind, findGridSize(selection.gridSize))) {
    params.set('area', selection.area)
  }

  if (selection.format) {
    params.set('format', selection.format)
  }

  return params.toString()
}

/**
 * @param {string} recordId
 * @param {LandModelSelection} selection
 * @returns {string}
 */
function selectionUrl (recordId, selection) {
  const path = `/dataset/${recordId}`
  const query = selectionQuery(selection)
  if (query) {
    return `${path}?${query}`
  } else {
    return path
  }
}

export {
  downloadErrors,
  isComplete,
  missingAreaError,
  parseSelection,
  selectionUrl
}
