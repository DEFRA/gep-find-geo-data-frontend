import { landModelFileName, landModelFilePath } from './paths.js'

describe('#land model paths', () => {
  test.each([
    [{ kind: 'grid', gridSize: '10m', area: 'all', format: 'cog' }, 'grid-10m.tif', 'grid-10m.tif'],
    [{ kind: 'grid', gridSize: '10m', area: 'NY', format: 'gpkg' }, 'NY/grid-10m.gpkg', 'grid-10m-NY.gpkg'],
    [{ kind: 'grid', gridSize: '100m', area: 'ST', format: 'parquet' }, 'ST/grid-100m.parquet', 'grid-100m-ST.parquet'],
    [{ kind: 'grid', gridSize: '1km', area: 'all', format: 'gpkg' }, 'grid-1km.gpkg', 'grid-1km.gpkg'],
    [{ kind: 'features', gridSize: null, area: 'all', format: 'parquet' }, 'parcels.parquet', 'parcels.parquet'],
    [{ kind: 'features', gridSize: null, area: 'SU', format: 'gpkg' }, 'SU/parcels.gpkg', 'parcels-SU.gpkg']
  ])('%j is stored at %s and downloads as %s', (selection, path, fileName) => {
    expect(landModelFilePath(selection)).toBe(path)
    expect(landModelFileName(selection)).toBe(fileName)
  })
})
