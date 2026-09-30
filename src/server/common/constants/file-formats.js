const formatLabels = new Map([
  ['csv', 'CSV'],
  ['docx', 'Word document'],
  ['gdb', 'File geodatabase'],
  ['geojson', 'GeoJSON'],
  ['gml', 'GML'],
  ['gpkg', 'GeoPackage'],
  ['json', 'JSON'],
  ['kml', 'KML'],
  ['kmz', 'KMZ'],
  ['lyr', 'LYR'],
  ['lyrx', 'LYRX'],
  ['pdf', 'PDF'],
  ['shp', 'Shapefile'],
  ['tif', 'GeoTIFF'],
  ['tiff', 'GeoTIFF'],
  ['xls', 'Excel Spreadsheet'],
  ['xlsx', 'Excel Spreadsheet'],
  ['zip', 'ZIP']
])

const extensionPattern = /^(?=.*[a-z])[a-z0-9]{2,8}$/

/**
 * @typedef {object} FileFormat
 * @property {string} extension
 * @property {string} label
 * @property {boolean} known
 */

/**
 * Returns the file format for a file name or path, based on the file extension.
 * Zipped formats such as `data.gdb.zip` take the inner format.
 *
 * @param {string | null | undefined} fileName
 * @returns {FileFormat | null}
 */
function fileFormat (fileName) {
  if (!fileName) {
    return null
  }

  const baseName = fileName.slice(fileName.lastIndexOf('/') + 1).toLowerCase()
  const [extension, innerExtension] = baseName.split('.').slice(1).reverse()
  if (!extensionPattern.test(extension ?? '')) {
    return null
  }

  const resolved = extension === 'zip' && formatLabels.has(innerExtension) ? innerExtension : extension
  return {
    extension: resolved,
    label: formatLabels.get(resolved) ?? resolved.toUpperCase(),
    known: formatLabels.has(resolved)
  }
}

export { fileFormat }
