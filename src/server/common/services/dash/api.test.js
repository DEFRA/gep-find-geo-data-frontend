import { Readable } from 'node:stream'
import { vi } from 'vitest'
import { openDatasetFile, openLandModelFile } from './api.js'

const mocks = vi.hoisted(() => ({
  getRecord: vi.fn(),
  read: vi.fn(),
  getFileClient: vi.fn(),
  getFileSystemClient: vi.fn(),
  serviceClient: vi.fn(),
  credential: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  error: vi.fn()
}))

vi.mock('../geonetwork/client.js', () => ({ getRecord: mocks.getRecord }))
vi.mock('../../../../config/config.js', () => ({
  config: { get: (key) => ({ 'dash.azureAccountName': 'account', 'dash.azureFileSystem': 'datasets' })[key] }
}))
vi.mock('@azure/identity', () => ({ DefaultAzureCredential: mocks.credential }))
vi.mock('@azure/storage-file-datalake', () => ({ DataLakeServiceClient: mocks.serviceClient }))
vi.mock('../../helpers/logging/logger.js', () => ({
  logExternalCall: (_service, _operation, call) => call(),
  createLogger: () => ({ debug: mocks.debug, info: mocks.info, error: mocks.error })
}))

const loggedError = (message) => expect.objectContaining({ message })

describe('Dash download', () => {
  beforeEach(() => {
    mocks.credential.mockImplementation(function () {})
    mocks.serviceClient.mockImplementation(function () { return { getFileSystemClient: mocks.getFileSystemClient } })
    mocks.getFileSystemClient.mockReturnValue({ getFileClient: mocks.getFileClient })
    mocks.getFileClient.mockReturnValue({ read: mocks.read })
    mocks.getRecord.mockResolvedValue({
      links: [
        { name: 'other.csv', url: 'https://example.com/other.csv' },
        { name: 'data.csv', url: 'https://example.com/datasets/gep_raw_data/folder/data.csv' }
      ]
    })
    mocks.read.mockResolvedValue({ contentType: 'text/csv', readableStreamBody: Readable.from(['a,b\n1,2']) })
  })

  test('resolves the matching metadata link and returns the Azure stream and file metadata', async () => {
    const result = await openDatasetFile('record-id', 'data.csv')

    expect(mocks.getRecord).toHaveBeenCalledWith('record-id')
    expect(mocks.serviceClient).toHaveBeenCalledWith('https://account.dfs.core.windows.net', expect.any(Object))
    expect(mocks.getFileSystemClient).toHaveBeenCalledWith('datasets')
    expect(mocks.getFileClient).toHaveBeenCalledWith('gep_raw_data/folder/data.csv')
    expect(mocks.read).toHaveBeenCalledOnce()
    expect(result.contentType).toBe('text/csv')
    expect(result.fileName).toBe('data.csv')
    const chunks = []
    for await (const chunk of result.file) chunks.push(chunk)
    expect(chunks.join('')).toBe('a,b\n1,2')
  })

  test('returns a not found error before contacting Azure when the record is missing', async () => {
    mocks.getRecord.mockResolvedValue(null)
    await expect(openDatasetFile('missing', 'data.csv')).rejects.toMatchObject({ output: { statusCode: 404 } })
    expect(mocks.serviceClient).not.toHaveBeenCalled()
  })

  test('propagates metadata lookup failures before contacting Azure', async () => {
    const error = new Error('Metadata unavailable')
    mocks.getRecord.mockRejectedValue(error)
    await expect(openDatasetFile('record-id', 'data.csv')).rejects.toBe(error)
    expect(mocks.serviceClient).not.toHaveBeenCalled()
  })

  test('logs a missing link and handles a failed Azure lookup', async () => {
    mocks.getRecord.mockResolvedValue({ links: [] })
    mocks.read.mockRejectedValue(new Error('File not found'))
    await expect(openDatasetFile('record-id', 'missing.csv')).rejects.toThrow('Dash file download request failed')
    expect(mocks.debug).toHaveBeenCalledWith('Dataset download link not found')
  })

  test.each(['CredentialUnavailableError', 'AggregateAuthenticationError', 'AuthenticationError'])(
    'reports %s credential failures', async (name) => {
      mocks.read.mockRejectedValue(Object.assign(new Error('credentials failed'), { name }))
      await expect(openDatasetFile('record-id', 'data.csv')).rejects.toThrow('Dash file download request failed')
      expect(mocks.error).toHaveBeenCalledWith(loggedError('credentials failed'), 'No credential available')
    }
  )

  test('reports forbidden downloads', async () => {
    mocks.read.mockRejectedValue(Object.assign(new Error('forbidden'), { code: 'Forbidden' }))
    await expect(openDatasetFile('record-id', 'data.csv')).rejects.toThrow('Dash file download request failed')
    expect(mocks.error).toHaveBeenCalledWith(loggedError('forbidden'), 'Access denied. Check your RBAC role assignments')
  })

  test('reports unexpected read failures', async () => {
    mocks.read.mockRejectedValue(new Error('connection lost'))
    await expect(openDatasetFile('record-id', 'data.csv')).rejects.toThrow('Dash file download request failed')
    expect(mocks.error).toHaveBeenCalledWith(loggedError('connection lost'), 'Dash file download request failed')
  })

  test('returns a not found error for a missing file', async () => {
    mocks.read.mockRejectedValue(Object.assign(new Error('The specified blob does not exist.'), { statusCode: 404, details: { errorCode: 'BlobNotFound' } }))
    await expect(openDatasetFile('record-id', 'data.csv')).rejects.toMatchObject({ output: { statusCode: 404 } })
    expect(mocks.info).toHaveBeenCalledWith('Dash file not found')
  })

  test('treats a missing filesystem as a failure', async () => {
    mocks.read.mockRejectedValue(Object.assign(new Error('The specified container does not exist.'), { statusCode: 404, details: { errorCode: 'ContainerNotFound' } }))
    await expect(openDatasetFile('record-id', 'data.csv')).rejects.toThrow('Dash file download request failed')
    expect(mocks.error).toHaveBeenCalledWith(loggedError('The specified container does not exist.'), 'Dash file download request failed')
    expect(mocks.info).not.toHaveBeenCalled()
  })

  test('reads land model files from the land model folder', async () => {
    mocks.read.mockResolvedValue({ contentType: 'application/octet-stream', contentLength: 7, readableStreamBody: Readable.from(['gpkg']) })
    const result = await openLandModelFile('NY/grid-10m.gpkg')

    expect(mocks.getRecord).not.toHaveBeenCalled()
    expect(mocks.getFileSystemClient).toHaveBeenCalledWith('datasets')
    expect(mocks.getFileClient).toHaveBeenCalledWith('land_model_data/NY/grid-10m.gpkg')
    expect(result.contentLength).toBe(7)
    expect(result.fileName).toBe('grid-10m.gpkg')
  })
})
