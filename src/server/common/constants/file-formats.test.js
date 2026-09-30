import { fileFormat } from './file-formats.js'

describe('#fileFormat', () => {
  test('labels known formats', () => {
    expect(fileFormat('data.gpkg')).toEqual({ extension: 'gpkg', label: 'GeoPackage', known: true })
    expect(fileFormat('ReadMe.XLSX')?.label).toBe('Excel Spreadsheet')
  })

  test('labels zipped files by the inner format', () => {
    expect(fileFormat('data.gdb.zip')?.label).toBe('File geodatabase')
    expect(fileFormat('data.unknown.zip')).toEqual({ extension: 'zip', label: 'ZIP', known: true })
  })

  test('uppercases unknown extensions', () => {
    expect(fileFormat('notes.odt')).toEqual({ extension: 'odt', label: 'ODT', known: false })
  })

  test('uses the last path segment', () => {
    expect(fileFormat('/v1.2/files/data.shp.zip')?.label).toBe('Shapefile')
    expect(fileFormat('/v1.2/files/data')).toBeNull()
  })

  test.each([
    undefined,
    null,
    '',
    'readme',
    'trailing.',
    'Version 3.0',
    'Flood Zones v2.1 WMS',
    'Source metadata (see gov.uk)',
    'archive.toolongextension'
  ])('returns null for %j', (value) => {
    expect(fileFormat(value)).toBeNull()
  })
})
