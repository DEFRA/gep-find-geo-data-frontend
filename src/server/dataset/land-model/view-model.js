import { ALL_OF_ENGLAND, areaPhrase, areas } from './areas.js'
import {
  GRID,
  approxSizeFor,
  findGridSize,
  formats,
  formatsFor,
  gridSizes,
  hasAreas,
  kindFormats
} from './downloads.js'
import { isComplete, parseSelection, selectionUrl } from './selection.js'

/**
 * @typedef {import('./selection.js').LandModelSelection} LandModelSelection
 * @typedef {import('./selection.js').CompleteLandModelSelection} CompleteLandModelSelection
 * @typedef {import('./selection.js').LandModelError} LandModelError
 * @typedef {import('./downloads.js').LandModelKind} LandModelKind
 * @typedef {import('./downloads.js').LandModelGridSize} LandModelGridSize
 */

/**
 * @typedef {Object} LandModelSelectItem
 * @property {string} value
 * @property {string} text
 * @property {boolean} [selected]
 */

/**
 * @typedef {Object} LandModelSelect
 * @property {string} id
 * @property {string} name
 * @property {{ text: string, classes: string }} label
 * @property {{ text: string }} [hint]
 * @property {LandModelSelectItem[]} items
 * @property {{ text: string }} [errorMessage]
 * @property {{ classes: string }} [formGroup]
 */

/**
 * @typedef {Object} LandModelQuestion
 * @property {string | null} [intro]
 * @property {string | null} text
 * @property {LandModelSelect} select
 */

/**
 * @typedef {Object} LandModelDetails
 * @property {string} summary
 * @property {string | null} warning
 */

/**
 * govukErrorSummary params
 * @typedef {Object} LandModelErrorSummary
 * @property {string} titleText
 * @property {{ text: string, href: string }[]} errorList
 * @property {{ id: string }} attributes
 */

/**
 * @typedef {Object} LandModelDownload
 * @property {string} intro
 * @property {string} endpoint
 * @property {string} url
 * @property {string} formAction
 * @property {LandModelSelect | null} gridSizeSelect
 * @property {{ classes: string } | null} inset Nests the area and format questions under the grid size.
 * @property {LandModelQuestion} area
 * @property {LandModelQuestion} format
 * @property {LandModelDetails | null} details
 * @property {LandModelErrorSummary | null} errorSummary
 */

const FIELD_IDS = {
  gridSize: 'land-model-grid-size-select',
  area: 'land-model-area-select',
  format: 'land-model-format-select'
}

const INTRO = {
  grid: 'Choose the size of grid square you need. For the 2 smallest sizes, you also choose an area.',
  features: 'Choose an area, or download all of England.'
}

const AREA_INTRO = {
  '10m': 'The 10 metre grid for all of England is only available as a Cloud Optimised GeoTIFF, which shows the dominant values. For full detail, choose one area and download it as Parquet or GeoPackage.'
}

const LARGE_DOWNLOAD_MB = 10000

const JS_FALLBACK = 'app-js-fallback'
const INSET_CLASS = 'app-land-model-inset'

/**
 * @param {number} megabytes
 * @returns {string}
 */
function formatSize (megabytes) {
  if (megabytes >= 1000) {
    return `${megabytes / 1000}GB`
  } else {
    return `${megabytes}MB`
  }
}

/**
 * @param {Object} field
 * @param {keyof typeof FIELD_IDS} field.name
 * @param {string} field.label
 * @param {string} [field.hint]
 * @param {string} field.placeholder
 * @param {{ value: string, text: string }[]} field.options
 * @param {string | null} field.selected
 * @param {boolean} [field.jsFallback] Only shown without JavaScript, unless it has an error.
 * @param {LandModelError[]} errors
 * @returns {LandModelSelect}
 */
function select ({ name, label, hint, placeholder, options, selected, jsFallback = false }, errors) {
  const error = errors.find(({ field }) => field === name)
  const value = error ? error.value : selected
  return {
    id: FIELD_IDS[name],
    name,
    label: { text: label, classes: 'govuk-label--s' },
    hint: hint ? { text: hint } : undefined,
    items: [
      { value: '', text: placeholder },
      ...options.map((option) => ({ ...option, selected: option.value === value }))
    ],
    errorMessage: error ? { text: error.text } : undefined,
    formGroup: jsFallback && !error ? { classes: JS_FALLBACK } : undefined
  }
}

/**
 * @param {LandModelSelection} selection
 * @param {LandModelError[]} errors
 * @returns {LandModelSelect}
 */
function gridSizeSelect (selection, errors) {
  return select({
    name: 'gridSize',
    label: 'Which grid size do you want?',
    hint: 'Each square in the grid will be this size',
    placeholder: 'Select a grid size',
    options: gridSizes.map((size) => ({ value: size.id, text: size.label })),
    selected: selection.gridSize
  }, errors)
}

/**
 * @param {LandModelSelection} selection
 * @param {LandModelGridSize | null} gridSize
 * @param {LandModelError[]} errors
 * @returns {LandModelQuestion}
 */
function areaQuestion (selection, gridSize, errors) {
  const nationalOnly = Boolean(gridSize) && !hasAreas(selection.kind, gridSize)
  const options = [
    { value: ALL_OF_ENGLAND, text: 'All of England' },
    ...areas.map((code) => ({ value: code, text: code }))
  ]
  const areaSelect = select({
    name: 'area',
    label: 'Which area do you want?',
    hint: 'Areas are 100 kilometre squares on the British National Grid, named with 2 letters',
    placeholder: 'Select an area',
    options,
    selected: selection.area,
    jsFallback: nationalOnly
  }, errors)

  return {
    intro: AREA_INTRO[gridSize?.id] ?? null,
    text: nationalOnly ? 'This grid size comes as one file covering all of England.' : null,
    select: areaSelect
  }
}

/**
 * @param {LandModelSelection} selection
 * @param {LandModelGridSize | null} gridSize
 * @param {LandModelError[]} errors
 * @returns {LandModelQuestion}
 */
function formatQuestion (selection, gridSize, errors) {
  const offered = formatsFor(selection.kind, gridSize, selection.area)
  const single = offered?.length === 1
  const formatSelect = select({
    name: 'format',
    label: 'Which format do you want?',
    placeholder: 'Select a format',
    options: (offered ?? kindFormats(selection.kind)).map((id) => ({ value: id, text: formats[id].label })),
    selected: selection.format,
    jsFallback: !offered || single
  }, errors)

  return {
    text: single ? `Format: ${formats[offered[0]].label}` : null,
    select: formatSelect
  }
}

/**
 * @param {CompleteLandModelSelection} selection
 * @param {LandModelGridSize | null} gridSize
 * @returns {LandModelDetails}
 */
function detailsBlock (selection, gridSize) {
  const isAll = selection.area === ALL_OF_ENGLAND
  const size = approxSizeFor(selection)
  const sizeWord = isAll ? 'about' : 'up to'
  const sizeText = size === null ? null : `${sizeWord} ${formatSize(size)}`
  const sizeSuffix = sizeText ? ` (${sizeText})` : ''
  const coverage = isAll ? 'covering all of England' : `for area ${selection.area}`
  const summary = selection.kind === GRID
    ? `Grid squares of ${gridSize.label}, ${coverage}`
    : `Features for ${areaPhrase(selection.area)}`

  return {
    summary: `${summary}${sizeSuffix}`,
    warning: size !== null && size > LARGE_DOWNLOAD_MB
      ? `This download is ${sizeText}. It may take a long time to download. You will need a fast, reliable internet connection and enough space on your computer.`
      : null
  }
}

/**
 * @param {LandModelError[]} errors
 * @returns {LandModelErrorSummary | null}
 */
function errorSummary (errors) {
  if (!errors.length) {
    return null
  }

  return {
    titleText: 'There is a problem',
    errorList: errors.map((error) => ({ text: error.text, href: `#${FIELD_IDS[error.field]}` })),
    attributes: { id: 'land-model-error-summary' }
  }
}

/**
 * @param {Object} options
 * @param {string} options.recordId
 * @param {LandModelKind} options.kind
 * @param {Record<string, unknown>} [options.query]
 * @param {LandModelError[]} [options.errors]
 * @returns {LandModelDownload}
 */
function buildLandModelDownload ({ recordId, kind, query, errors = [] }) {
  const selection = parseSelection(kind, query)
  const gridSize = findGridSize(selection.gridSize)
  const endpoint = `/dataset/${recordId}`
  const insetClasses = gridSize ? INSET_CLASS : `${INSET_CLASS} ${JS_FALLBACK}`

  return {
    intro: INTRO[selection.kind],
    endpoint,
    url: selectionUrl(recordId, selection),
    formAction: `${endpoint}/land-model-download`,
    gridSizeSelect: selection.kind === GRID ? gridSizeSelect(selection, errors) : null,
    inset: selection.kind === GRID ? { classes: insetClasses } : null,
    area: areaQuestion(selection, gridSize, errors),
    format: formatQuestion(selection, gridSize, errors),
    details: isComplete(selection) ? detailsBlock(selection, gridSize) : null,
    errorSummary: errorSummary(errors)
  }
}

export { buildLandModelDownload, formatSize }
