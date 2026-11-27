import {
  downloadErrors,
  parseSelection,
  selectionUrl
} from './selection.js'

describe('#land model selection', () => {
  test.each(['grid', 'features'])('%s starts with nothing chosen', (kind) => {
    expect(parseSelection(kind)).toEqual({ kind, gridSize: null, area: null, format: null })
  })

  test('ignores unknown values', () => {
    expect(parseSelection('grid', { gridSize: '5m', area: 'NY', format: 'gpkg' }))
      .toEqual({ kind: 'grid', gridSize: null, area: null, format: null })
    expect(parseSelection('features', { area: 'XX', format: 'shp' }))
      .toEqual({ kind: 'features', gridSize: null, area: null, format: null })
    expect(parseSelection('features', { area: ['NY', 'SU'] }).area).toBeNull()
  })

  test('national-only sizes cover all of England', () => {
    expect(parseSelection('grid', { gridSize: '1km', area: 'NY' }))
      .toEqual({ kind: 'grid', gridSize: '1km', area: 'all', format: null })
  })

  test.each([
    ['cog', { gridSize: '10m', area: 'all' }],
    ['cog', { gridSize: '10m', area: 'all', format: 'parquet' }],
    ['parquet', { gridSize: '10m', area: 'NY', format: 'parquet' }],
    [null, { gridSize: '10m', area: 'NY', format: 'cog' }]
  ])('form shows format %s for %j', (format, query) => {
    expect(parseSelection('grid', query).format).toBe(format)
  })

  test('url carries only the choices that apply', () => {
    const url = (query) => selectionUrl('abc', parseSelection('grid', query))
    expect(url({ gridSize: '1km', format: 'parquet' })).toBe('/dataset/abc?gridSize=1km&format=parquet')
    expect(url({ gridSize: '10m', area: 'NY' })).toBe('/dataset/abc?gridSize=10m&area=NY')
    expect(url({})).toBe('/dataset/abc')
  })

  test.each([
    ['grid', {}, ['Select a grid size']],
    ['grid', { gridSize: '10m' }, ['Select an area']],
    ['features', {}, ['Select an area']],
    ['grid', { gridSize: '10m', area: 'NY', format: 'parquet' }, []],
    ['grid', { gridSize: '10km' }, ['Select a format']],
    ['grid', { gridSize: '10km', format: 'gpkg' }, []],
    ['grid', { gridSize: '1km', area: 'NY' }, ['Area must be All of England for the 1 kilometre grid']],
    ['grid', { gridSize: '10m', area: 'all', format: 'gpkg' }, ['Format must be Cloud Optimised GeoTIFF for the 10 metre grid in all of England']],
    ['grid', { gridSize: '10m', area: 'NY', format: 'cog' }, ['Format must be GeoPackage or Parquet for the 10 metre grid in area NY']],
    ['features', { area: 'NY', format: 'cog' }, ['Format must be GeoPackage or Parquet for features in area NY']],
    ['grid', { gridSize: '10m', area: 'all', format: '' }, ['Select a format']],
    ['grid', { gridSize: '1km', area: '', format: 'gpkg' }, ['Select an area']],
    ['grid', { gridSize: '1km', format: 'gpkg' }, []]
  ])('%s download errors for %j', (kind, query, expected) => {
    expect(downloadErrors(parseSelection(kind, query), query).map((error) => error.text)).toEqual(expected)
  })
})
