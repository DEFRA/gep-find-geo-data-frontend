import { vi } from 'vitest'

import { createServer } from '../server.js'
import { statusCodes } from '../common/constants/status-codes.js'

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

    await server.inject({ method: 'GET', url: '/dataset/92b43165-0dd0-4e69-a712-1e49bb5aa0d0' })

    expect(mockGetRecord).toHaveBeenCalledWith('92b43165-0dd0-4e69-a712-1e49bb5aa0d0')
  })

  test('renders the record title in the heading and page title', async () => {
    mockGetRecord.mockResolvedValue(exampleRecord())

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/dataset/92b43165-0dd0-4e69-a712-1e49bb5aa0d0'
    })

    expect(statusCode).toBe(statusCodes.ok)
    expect(result).toMatch(/<h1[^>]*>\s*Flood Extents\s*<\/h1>/)
    expect(result).toMatch(/<title>[^<]*Flood Extents[^<]*<\/title>/)
  })

  test('returns 404 when the record is missing', async () => {
    mockGetRecord.mockResolvedValue(null)

    const response = await server.inject({
      method: 'GET',
      url: '/dataset/92b43165-0dd0-4e69-a712-1e49bb5aa0d0'
    })

    expect(response.statusCode).toBe(statusCodes.notFound)
    expect(response.result).toContain('Page not found')
  })

  test('returns 404 when the id is not a uuid', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/dataset/not-a-uuid'
    })

    expect(response.statusCode).toBe(statusCodes.notFound)
    expect(response.result).toContain('Page not found')
    expect(mockGetRecord).not.toHaveBeenCalled()
  })

  test('returns 500 when the client throws', async () => {
    mockGetRecord.mockRejectedValueOnce(new Error('GeoNetwork unavailable'))

    const response = await server.inject({
      method: 'GET',
      url: '/dataset/92b43165-0dd0-4e69-a712-1e49bb5aa0d0'
    })

    expect(response.statusCode).toBe(statusCodes.internalServerError)
  })
})
