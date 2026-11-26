import { ALL_OF_ENGLAND } from './areas.js'

/**
 * @typedef {'grid' | 'features'} LandModelKind
 */

/**
 * @typedef {Object} LandModelFormat
 * @property {string} label
 * @property {string} extension
 * @property {string} contentType
 */

/**
 * @typedef {Object} LandModelDownloadOption
 * @property {string[]} nationalFormats
 * @property {string[]} areaFormats Empty when the download only comes as one national file.
 * @property {Record<string, number>} nationalSizes MB by format for the all of England file.
 * @property {Record<string, number>} [areaSizes] MB by format for the largest area's file.
 */

/**
 * @typedef {LandModelDownloadOption & { id: string, label: string, shortLabel: string }} LandModelGridSize
 */

const GRID = 'grid'
const FEATURES = 'features'

const CATALOGUE_CATEGORIES = {
  landModelGrids: GRID,
  landModelParcels: FEATURES
}

/** @type {Record<string, LandModelFormat>} */
const formats = {
  gpkg: { label: 'GeoPackage', extension: 'gpkg', contentType: 'application/geopackage+sqlite3' },
  parquet: { label: 'Parquet', extension: 'parquet', contentType: 'application/vnd.apache.parquet' },
  cog: { label: 'Cloud Optimised GeoTIFF', extension: 'tif', contentType: 'image/tiff' }
}

const VECTOR_FORMATS = ['gpkg', 'parquet']

// Sizes are in MB rounded
// TODO: replace 123 with actual sizes when known
/** @type {LandModelGridSize[]} */
const gridSizes = [
  { id: '10m', label: '10 metres by 10 metres', shortLabel: '10 metre', nationalFormats: ['cog'], areaFormats: VECTOR_FORMATS, nationalSizes: { cog: 1500 }, areaSizes: { gpkg: 123, parquet: 123 } },
  { id: '100m', label: '100 metres by 100 metres', shortLabel: '100 metre', nationalFormats: VECTOR_FORMATS, areaFormats: VECTOR_FORMATS, nationalSizes: { gpkg: 40000, parquet: 2100 }, areaSizes: { gpkg: 123, parquet: 123 } },
  { id: '1km', label: '1 kilometre by 1 kilometre', shortLabel: '1 kilometre', nationalFormats: VECTOR_FORMATS, areaFormats: [], nationalSizes: { gpkg: 123, parquet: 123 } },
  { id: '10km', label: '10 kilometres by 10 kilometres', shortLabel: '10 kilometre', nationalFormats: VECTOR_FORMATS, areaFormats: [], nationalSizes: { gpkg: 123, parquet: 123 } },
  { id: '100km', label: '100 kilometres by 100 kilometres', shortLabel: '100 kilometre', nationalFormats: VECTOR_FORMATS, areaFormats: [], nationalSizes: { gpkg: 123, parquet: 123 } }
]

/** @type {LandModelDownloadOption} */
const features = {
  nationalFormats: VECTOR_FORMATS,
  areaFormats: VECTOR_FORMATS,
  nationalSizes: { gpkg: 150000, parquet: 19000 },
  areaSizes: { gpkg: 123, parquet: 123 }
}

/**
 * @param {string[] | undefined} catalogueCategories
 * @returns {LandModelKind | null}
 */
function kindFromCategories (catalogueCategories) {
  const category = Object.keys(CATALOGUE_CATEGORIES)
    .find((name) => catalogueCategories?.includes(name))
  return category ? CATALOGUE_CATEGORIES[category] : null
}

/**
 * @param {string | null | undefined} id
 * @returns {LandModelGridSize | null}
 */
function findGridSize (id) {
  return gridSizes.find((size) => size.id === id) ?? null
}

/**
 * @param {LandModelKind} kind
 * @param {LandModelGridSize | null} gridSize
 * @returns {LandModelDownloadOption | null}
 */
function downloadFor (kind, gridSize) {
  return kind === GRID ? gridSize : features
}

/**
 * @param {LandModelKind} kind
 * @param {LandModelGridSize | null} gridSize
 * @param {string | null} area
 * @returns {string[] | null} null when the formats depend on an area not yet chosen.
 */
function formatsFor (kind, gridSize, area) {
  const download = downloadFor(kind, gridSize)
  if (!download) {
    return null
  }

  if (area === ALL_OF_ENGLAND) {
    return download.nationalFormats
  } else if (area) {
    return download.areaFormats
  } else {
    const sameFormats = download.nationalFormats.join() === download.areaFormats.join()
    return sameFormats ? download.nationalFormats : null
  }
}

/**
 * @param {LandModelKind} kind
 * @param {LandModelGridSize | null} gridSize
 * @returns {boolean}
 */
function hasAreas (kind, gridSize) {
  return kind === FEATURES || Boolean(gridSize?.areaFormats.length)
}

/**
 * Every format any download of this kind comes in.
 * @param {LandModelKind} kind
 * @returns {string[]}
 */
function kindFormats (kind) {
  const downloads = kind === GRID ? gridSizes : [features]
  return Object.keys(formats).filter((id) =>
    downloads.some((download) => download.nationalFormats.includes(id) || download.areaFormats.includes(id))
  )
}

/**
 * @param {LandModelDownloadOption | null} download
 * @param {string} area
 * @param {string} format
 * @returns {number | null} MB
 */
function sizeFor (download, area, format) {
  const sizes = area === ALL_OF_ENGLAND ? download?.nationalSizes : download?.areaSizes
  return sizes?.[format] ?? null
}

/**
 * @param {{ kind: LandModelKind, gridSize: string | null, area: string, format: string }} selection
 * @returns {number | null}
 */
function approxSizeFor ({ kind, gridSize, area, format }) {
  return sizeFor(downloadFor(kind, findGridSize(gridSize)), area, format)
}

export {
  GRID,
  approxSizeFor,
  findGridSize,
  formats,
  formatsFor,
  gridSizes,
  hasAreas,
  kindFormats,
  kindFromCategories,
  sizeFor
}
