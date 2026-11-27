import { ALL_OF_ENGLAND } from './areas.js'
import { GRID, formats } from './downloads.js'

/**
 * @typedef {import('./selection.js').CompleteLandModelSelection} CompleteLandModelSelection
 */

/**
 * @param {CompleteLandModelSelection} selection
 * @returns {string}
 */
function baseName ({ kind, gridSize }) {
  return kind === GRID ? `grid-${gridSize}` : 'parcels'
}

/**
 * @param {CompleteLandModelSelection} selection
 * @returns {string}
 */
function landModelFilePath (selection) {
  const fileName = `${baseName(selection)}.${formats[selection.format].extension}`
  return selection.area === ALL_OF_ENGLAND ? fileName : `${selection.area}/${fileName}`
}

/**
 * @param {CompleteLandModelSelection} selection
 * @returns {string}
 */
function landModelFileName (selection) {
  const area = selection.area === ALL_OF_ENGLAND ? '' : `-${selection.area}`
  return `${baseName(selection)}${area}.${formats[selection.format].extension}`
}

export { landModelFileName, landModelFilePath }
