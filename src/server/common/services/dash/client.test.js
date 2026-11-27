import { vi } from 'vitest'
import { openDatasetFile, openLandModelFile } from './client.js'
import * as api from './api.js'
import * as mock from './mock.js'

const { useMock } = vi.hoisted(() => ({ useMock: { value: false } }))

vi.mock('./api.js', () => ({ openDatasetFile: vi.fn(), openLandModelFile: vi.fn() }))
vi.mock('./mock.js', () => ({ openDatasetFile: vi.fn(), openLandModelFile: vi.fn() }))
vi.mock('../../../../config/config.js', () => ({
  config: { get: (key) => (key === 'dash.useMock' ? useMock.value : null) }
}))

const response = { file: {}, contentType: 'text/csv', fileName: 'data.csv' }

describe('dash client', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    useMock.value = false
  })

  test('forwards downloads to Azure', async () => {
    api.openDatasetFile.mockResolvedValue(response)
    api.openLandModelFile.mockResolvedValue(response)
    await expect(openDatasetFile('record-id', 'data.csv')).resolves.toBe(response)
    await expect(openLandModelFile('grid-1km.gpkg')).resolves.toBe(response)
    expect(api.openDatasetFile).toHaveBeenCalledWith('record-id', 'data.csv')
    expect(api.openLandModelFile).toHaveBeenCalledWith('grid-1km.gpkg')
    expect(mock.openDatasetFile).not.toHaveBeenCalled()
    expect(mock.openLandModelFile).not.toHaveBeenCalled()
  })

  test('propagates download errors', async () => {
    const error = new Error('Download unavailable')
    api.openDatasetFile.mockRejectedValue(error)
    await expect(openDatasetFile('record-id', 'data.csv')).rejects.toBe(error)
  })

  test('uses the mock when configured', async () => {
    useMock.value = true
    mock.openDatasetFile.mockResolvedValue(response)
    mock.openLandModelFile.mockResolvedValue(response)
    await openDatasetFile('record-id', 'data.csv')
    await openLandModelFile('grid-1km.gpkg')
    expect(mock.openDatasetFile).toHaveBeenCalledWith('record-id', 'data.csv')
    expect(mock.openLandModelFile).toHaveBeenCalledWith('grid-1km.gpkg')
    expect(api.openDatasetFile).not.toHaveBeenCalled()
    expect(api.openLandModelFile).not.toHaveBeenCalled()
  })
})
