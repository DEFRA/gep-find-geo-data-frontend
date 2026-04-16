import { beforeEach, vi } from 'vitest'

const mockApiSearch = vi.fn()
const mockMockSearch = vi.fn()
const mockConfigGet = vi.fn()

vi.mock('./api.js', () => ({
  search: mockApiSearch
}))

vi.mock('./mock.js', () => ({
  search: mockMockSearch
}))

vi.mock('../../../../config/config.js', () => ({
  config: { get: mockConfigGet }
}))

const { search } = await import('./client.js')

describe('#geonetwork-client', () => {
  beforeEach(() => {
    mockApiSearch.mockReset()
    mockMockSearch.mockReset()
    mockConfigGet.mockReset()
  })

  test('delegates to the mock client when useMock is true', async () => {
    mockConfigGet.mockImplementation((key) =>
      key === 'geonetwork.useMock' ? true : null
    )
    const expected = { total: 0, results: [], facets: {} }
    mockMockSearch.mockResolvedValue(expected)

    const result = await search({ query: 'test', from: 0, size: 5 })

    expect(mockMockSearch).toHaveBeenCalledWith({
      query: 'test',
      from: 0,
      size: 5
    })
    expect(mockApiSearch).not.toHaveBeenCalled()
    expect(result).toEqual(expected)
  })

  test('delegates to the API client when useMock is false', async () => {
    mockConfigGet.mockImplementation((key) =>
      key === 'geonetwork.useMock' ? false : null
    )
    const expected = { total: 0, results: [], facets: {} }
    mockApiSearch.mockResolvedValue(expected)

    const result = await search({ query: 'test' })

    expect(mockApiSearch).toHaveBeenCalledWith({ query: 'test' })
    expect(mockMockSearch).not.toHaveBeenCalled()
    expect(result).toEqual(expected)
  })

  test('reads config on each call', async () => {
    mockConfigGet.mockImplementationOnce((key) =>
      key === 'geonetwork.useMock' ? true : null
    )
    mockMockSearch.mockResolvedValue({ total: 0, results: [], facets: {} })
    await search({})

    mockConfigGet.mockImplementationOnce((key) =>
      key === 'geonetwork.useMock' ? false : null
    )
    mockApiSearch.mockResolvedValue({ total: 0, results: [], facets: {} })
    await search({})

    expect(mockMockSearch).toHaveBeenCalledTimes(1)
    expect(mockApiSearch).toHaveBeenCalledTimes(1)
  })
})
