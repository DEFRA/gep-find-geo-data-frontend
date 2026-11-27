import { text } from 'node:stream/consumers'
import { vi } from 'vitest'
import { openDatasetFile, openLandModelFile } from './mock.js'

const { getRecord } = vi.hoisted(() => ({ getRecord: vi.fn() }))

vi.mock('../geonetwork/client.js', () => ({ getRecord }))

describe('dash mock', () => {
  test('serves a placeholder for a record link', async () => {
    getRecord.mockResolvedValue({ links: [{ name: 'data.csv' }] })
    const result = await openDatasetFile('record-id', 'data.csv')
    expect(result.fileName).toBe('data.csv')
    expect(await text(result.file)).toBe('Mock download of data.csv\n')
  })

  test('rejects unknown links', async () => {
    getRecord.mockResolvedValue({ links: [] })
    await expect(openDatasetFile('record-id', 'data.csv')).rejects.toMatchObject({ output: { statusCode: 404 } })
  })

  test('serves land model files', async () => {
    const result = await openLandModelFile('NY/grid-10m.gpkg')
    expect(result.fileName).toBe('grid-10m.gpkg')
    expect(result.contentLength).toBe(Buffer.byteLength('Mock download of grid-10m.gpkg\n'))
    expect(result.file).toHaveProperty('readableObjectMode', false)
  })

  test('has no data for area TR', async () => {
    await expect(openLandModelFile('TR/parcels.gpkg')).rejects.toMatchObject({ output: { statusCode: 404 } })
  })

  test('fails downloads for area TV', async () => {
    await expect(openLandModelFile('TV/parcels.gpkg')).rejects.toThrow('Dash file download request failed')
  })
})
