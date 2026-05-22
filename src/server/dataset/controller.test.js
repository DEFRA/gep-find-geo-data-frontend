import { vi } from 'vitest'

import { createServer } from '../server.js'
import { statusCodes } from '../common/constants/status-codes.js'
import { mockAuthCredentials } from '../common/test-helpers/auth.js'

const { mockGetRecord } = vi.hoisted(() => ({
  mockGetRecord: vi.fn()
}))

vi.mock('../common/services/geonetwork/client.js', () => ({
  getRecord: mockGetRecord
}))

function exampleRecord (overrides = {}) {
  return {
    id: '92b43165-0dd0-4e69-a712-1e49bb5aa0d0',
    title: 'Flood Extents',
    abstract: 'Recorded flood extents for England.',
    dataType: 'Vector',
    accessLevel: 'Open data',
    updateFrequency: 'Monthly',
    categories: ['Environment'],
    keywords: ['Habitats and biotopes', 'landscape', 'Habitats', 'Natural England', 'Open Data', 'ecology'],
    owner: 'Environment Agency',
    updatedAt: '2026-04-10T00:00:00Z',
    ...overrides
  }
}

describe('#datasetController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  beforeEach(() => {
    mockGetRecord.mockReset()
  })

  test('forwards the id from the URL to the client', async () => {
    mockGetRecord.mockResolvedValue(exampleRecord())

    await server.inject({
      method: 'GET',
      url: '/dataset/92b43165-0dd0-4e69-a712-1e49bb5aa0d0',
      auth: mockAuthCredentials
    })

    expect(mockGetRecord).toHaveBeenCalledWith('92b43165-0dd0-4e69-a712-1e49bb5aa0d0')
  })

  test('renders the record title in the heading and page title', async () => {
    mockGetRecord.mockResolvedValue(exampleRecord())

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/dataset/92b43165-0dd0-4e69-a712-1e49bb5aa0d0',
      auth: mockAuthCredentials
    })

    expect(statusCode).toBe(statusCodes.ok)
    expect(result).toMatch(/<h1[^>]*>\s*Flood Extents\s*<\/h1>/)
    expect(result).toMatch(/<title>[^<]*Flood Extents[^<]*<\/title>/)
  })

  test('renders service and download links from the dataset view model', async () => {
    mockGetRecord.mockResolvedValue(exampleRecord({
      links: [
        { url: 'https://example.com/service/wms', name: 'WMS service', description: '' },
        { url: 'https://example.com/files/flood-extents.zip', name: 'Flood extents', description: '' }
      ]
    }))

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/dataset/92b43165-0dd0-4e69-a712-1e49bb5aa0d0',
      auth: mockAuthCredentials
    })

    expect(statusCode).toBe(statusCodes.ok)
    expect(result).toContain('Data services and download by area of interest')
    expect(result).toContain('Full downloads and supporting documentation')
    expect(result).toContain('href="https://example.com/service/wms"')
    expect(result).toContain('href="https://example.com/files/flood-extents.zip"')
    expect(result).toContain('ZIP')
  })

  test('renders category and keyword links as search filters', async () => {
    mockGetRecord.mockResolvedValue(exampleRecord())

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/dataset/92b43165-0dd0-4e69-a712-1e49bb5aa0d0',
      auth: mockAuthCredentials
    })

    expect(statusCode).toBe(statusCodes.ok)
    expect(result).toContain('href="/?category=Environment"')
    expect(result).toContain('>Environment</a>')
    expect(result).toContain('href="/?keyword=Habitats+and+biotopes"')
    expect(result).toContain('href="/?keyword=landscape"')
  })

  test('does not render metadata links with unsafe URL schemes', async () => {
    mockGetRecord.mockResolvedValue(exampleRecord({
      links: [
        { url: 'https://example.com/service/wms', name: 'WMS service', description: '' },
        { url: 'javascript:alert(1)', name: 'Unsafe script', description: '' },
        { url: 'data:text/html,<script>alert(1)</script>', name: 'Unsafe data', description: '' }
      ]
    }))

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/dataset/92b43165-0dd0-4e69-a712-1e49bb5aa0d0',
      auth: mockAuthCredentials
    })

    expect(statusCode).toBe(statusCodes.ok)
    expect(result).toContain('href="https://example.com/service/wms"')
    expect(result).not.toContain('javascript:alert(1)')
    expect(result).not.toContain('data:text/html')
    expect(result).not.toContain('Unsafe script')
    expect(result).not.toContain('Unsafe data')
  })

  test('renders unsafe coordinate reference system URLs as text only', async () => {
    mockGetRecord.mockResolvedValue(exampleRecord({
      coordinateReferenceSystem: 'javascript:alert(1)'
    }))

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/dataset/92b43165-0dd0-4e69-a712-1e49bb5aa0d0',
      auth: mockAuthCredentials
    })

    expect(statusCode).toBe(statusCodes.ok)
    expect(result).toContain('javascript:alert(1)')
    expect(result).not.toContain('href="javascript:alert(1)"')
  })

  test('returns 404 when the record is missing', async () => {
    mockGetRecord.mockResolvedValue(null)

    const response = await server.inject({
      method: 'GET',
      url: '/dataset/92b43165-0dd0-4e69-a712-1e49bb5aa0d0',
      auth: mockAuthCredentials
    })

    expect(response.statusCode).toBe(statusCodes.notFound)
    expect(response.result).toContain('Page not found')
  })

  test('returns 404 when the id is not a uuid', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/dataset/not-a-uuid',
      auth: mockAuthCredentials
    })

    expect(response.statusCode).toBe(statusCodes.notFound)
    expect(response.result).toContain('Page not found')
    expect(mockGetRecord).not.toHaveBeenCalled()
  })

  test('returns 500 when the client throws', async () => {
    mockGetRecord.mockRejectedValueOnce(new Error('GeoNetwork unavailable'))

    const response = await server.inject({
      method: 'GET',
      url: '/dataset/92b43165-0dd0-4e69-a712-1e49bb5aa0d0',
      auth: mockAuthCredentials
    })

    expect(response.statusCode).toBe(statusCodes.internalServerError)
  })
})
