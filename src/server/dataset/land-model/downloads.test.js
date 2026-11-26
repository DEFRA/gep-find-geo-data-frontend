import { findGridSize, formatsFor, hasAreas, kindFromCategories, sizeFor } from './downloads.js'

describe('#land model downloads', () => {
  test.each([
    [['landModelGrids'], 'grid'],
    [['other', 'landModelParcels'], 'features'],
    [['referenceDatasets'], null],
    [undefined, null]
  ])('kind for %j is %s', (categories, kind) => {
    expect(kindFromCategories(categories)).toBe(kind)
  })

  test.each([
    ['grid', '100m', true],
    ['grid', '1km', false],
    ['features', null, true]
  ])('%s %s has areas: %s', (kind, size, expected) => {
    expect(hasAreas(kind, findGridSize(size))).toBe(expected)
  })

  test.each([
    ['grid', '10m', 'all', ['cog']],
    ['grid', '10m', 'NY', ['gpkg', 'parquet']],
    ['grid', '10m', null, null],
    ['grid', '100m', null, ['gpkg', 'parquet']],
    ['grid', '1km', 'all', ['gpkg', 'parquet']],
    ['grid', null, 'all', null],
    ['features', null, null, ['gpkg', 'parquet']]
  ])('%s %s formats for area %s', (kind, size, area, expected) => {
    expect(formatsFor(kind, findGridSize(size), area)).toEqual(expected)
  })

  test.each([
    ['all', 'cog', 2],
    ['NY', 'gpkg', 9],
    ['NY', 'parquet', null],
    ['all', 'gpkg', null]
  ])('size for area %s in %s is %s', (area, format, expected) => {
    const download = { nationalFormats: ['cog'], areaFormats: ['gpkg', 'parquet'], nationalSizes: { cog: 2 }, areaSizes: { gpkg: 9 } }
    expect(sizeFor(download, area, format)).toBe(expected)
  })
})
