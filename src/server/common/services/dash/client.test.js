import { vi } from 'vitest'
import { downloadFile } from './client.js'
import { download } from './api.js'

vi.mock('./api.js', () => ({ download: vi.fn() }))

describe('downloadFile', () => {
  test('forwards the dataset and file name and returns the download', async () => {
    const response = { file: {}, contentType: 'text/csv', fileName: 'data.csv' }
    download.mockResolvedValue(response)
    await expect(downloadFile('record-id', 'data.csv')).resolves.toBe(response)
    expect(download).toHaveBeenCalledWith('record-id', 'data.csv')
  })

  test('propagates download errors', async () => {
    const error = new Error('Download unavailable')
    download.mockRejectedValue(error)
    await expect(downloadFile('record-id', 'data.csv')).rejects.toBe(error)
  })
})
