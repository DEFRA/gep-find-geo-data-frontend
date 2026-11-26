import Boom from '@hapi/boom'
import { vi } from 'vitest'
import { load } from 'cheerio'

import { createServer } from '../server.js'
import { statusCodes } from '../common/constants/status-codes.js'
import { mockAuthCredentials } from '../common/test-helpers/auth.js'

const { mockGetRecord, mockOpenDatasetFile, mockOpenLandModelFile } = vi.hoisted(() => ({
  mockGetRecord: vi.fn(),
  mockOpenDatasetFile: vi.fn(),
  mockOpenLandModelFile: vi.fn()
}))

vi.mock('../common/services/geonetwork/client.js', () => ({
  getRecord: mockGetRecord
}))

vi.mock('../common/services/dash/client.js', () => ({
  openDatasetFile: mockOpenDatasetFile,
  openLandModelFile: mockOpenLandModelFile
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

  test('renders a view on map button', async () => {
    mockGetRecord.mockResolvedValue(exampleRecord())

    const { result } = await server.inject({
      method: 'GET',
      url: '/dataset/92b43165-0dd0-4e69-a712-1e49bb5aa0d0',
      auth: mockAuthCredentials
    })

    expect(result).toMatch(
      /<a href="http:\/\/localhost:3002\/\?dataset=92b43165-0dd0-4e69-a712-1e49bb5aa0d0"[^>]*govuk-button--secondary[^>]*>\s*View on map\s*<\/a>/
    )
  })

  test('links to the map from the data access section', async () => {
    mockGetRecord.mockResolvedValue(exampleRecord())

    const { result } = await server.inject({
      method: 'GET',
      url: '/dataset/92b43165-0dd0-4e69-a712-1e49bb5aa0d0',
      auth: mockAuthCredentials
    })

    expect(result).toContain('Data access')
    expect(result).toMatch(
      /<a href="http:\/\/localhost:3002\/\?dataset=92b43165-0dd0-4e69-a712-1e49bb5aa0d0" class="govuk-link">View this data on a map<\/a>/
    )
  })

  test('hides map links for reference datasets', async () => {
    mockGetRecord.mockResolvedValue(exampleRecord({
      catalogueCategories: ['referenceDatasets'],
      links: [{ url: 'https://example.com/data.zip', name: 'data.zip', description: '' }]
    }))

    const { result } = await server.inject({
      method: 'GET',
      url: '/dataset/92b43165-0dd0-4e69-a712-1e49bb5aa0d0',
      auth: mockAuthCredentials
    })

    expect(result).toContain('Data access')
    expect(result).not.toContain('View on map')
    expect(result).not.toContain('View this data on a map')
  })

  test('omits Data access when there is nothing to show', async () => {
    mockGetRecord.mockResolvedValue(exampleRecord({ catalogueCategories: ['referenceDatasets'], links: [] }))

    const { result } = await server.inject({
      method: 'GET',
      url: '/dataset/92b43165-0dd0-4e69-a712-1e49bb5aa0d0',
      auth: mockAuthCredentials
    })

    expect(result).not.toContain('Data access')
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
    expect(result).toContain('More about this data')
    expect(result).toContain('Download this data')
    expect(result).toContain('ZIP')
  })

  test('encodes file names in download links', async () => {
    mockGetRecord.mockResolvedValue(exampleRecord({
      links: [{ url: 'https://example.com/files/report.zip', name: 'report #1?.zip', description: '' }]
    }))

    const { result } = await server.inject({
      method: 'GET',
      url: '/dataset/92b43165-0dd0-4e69-a712-1e49bb5aa0d0',
      auth: mockAuthCredentials
    })

    expect(result).toContain('href="download/92b43165-0dd0-4e69-a712-1e49bb5aa0d0/report%20%231%3F.zip"')
  })

  test('hides download links for restricted download datasets', async () => {
    mockGetRecord.mockResolvedValue(exampleRecord({
      catalogueCategories: ['restrictedDownloadDatasets'],
      links: [{ url: 'https://example.com/data.zip', name: 'data.zip', description: '' }]
    }))

    const { result } = await server.inject({
      method: 'GET',
      url: '/dataset/92b43165-0dd0-4e69-a712-1e49bb5aa0d0',
      auth: mockAuthCredentials
    })

    expect(result).toContain('Data access')
    expect(result).toContain('View on map')
    expect(result).toContain('View this data on a map')
    expect(result).not.toContain('Download this data')
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

  test('renders the licence link to open in a new tab', async () => {
    mockGetRecord.mockResolvedValue(exampleRecord({
      licence: 'Open Government Licence'
    }))

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/dataset/92b43165-0dd0-4e69-a712-1e49bb5aa0d0',
      auth: mockAuthCredentials
    })

    expect(statusCode).toBe(statusCodes.ok)
    expect(result).toContain('href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/" target="_blank" rel="noreferrer noopener"')
    expect(result).toContain('Open Government Licence (opens in new tab)')
  })

  test('renders use limitation anchors and URLs as links', async () => {
    mockGetRecord.mockResolvedValue(exampleRecord({
      useLimitation: [
        { text: 'Licence terms apply', link: 'https://example.com/licence' },
        { text: 'Cite <b>this</b> https://doi.org/10.5285/abc', link: null },
        { text: 'Terms at https://example.com/terms', link: 'https://example.com/terms-page' }
      ]
    }))

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/dataset/92b43165-0dd0-4e69-a712-1e49bb5aa0d0',
      auth: mockAuthCredentials
    })

    expect(statusCode).toBe(statusCodes.ok)
    expect(result).toContain('<a class="govuk-link" href="https://example.com/licence">Licence terms apply</a>')
    expect(result).toContain('Cite &lt;b&gt;this&lt;/b&gt; <a class="govuk-link" href="https://doi.org/10.5285/abc">https://doi.org/10.5285/abc</a>')
    expect(result).toContain('<a class="govuk-link" href="https://example.com/terms-page">Terms at https://example.com/terms</a>')
    expect(result).not.toContain('href="https://example.com/terms"')
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

  test('renders resolution below Contact publisher with a separator', async () => {
    mockGetRecord.mockResolvedValue(exampleRecord({
      contactPoint: 'publisher@example.gov.uk',
      resolution: { scaleDenominators: [250000], distances: ['2 urn:ogc:def:uom:EPSG::9001'] }
    }))

    const { result } = await server.inject({
      method: 'GET',
      url: '/dataset/92b43165-0dd0-4e69-a712-1e49bb5aa0d0',
      auth: mockAuthCredentials
    })

    const $ = load(result)
    const sidebar = $('.app-dataset-sidebar')
    const heading = sidebar.find('h2').filter((i, el) => $(el).text() === 'Resolution')
    expect(heading.prevAll('h2').first().text()).toBe('Contact publisher')
    expect(heading.next('p.govuk-body').text()).toBe('1:250,000, 2m')
    expect(heading.next('p').next('hr').hasClass('govuk-section-break--visible')).toBe(true)
  })

  test('omits Resolution when no value is supplied', async () => {
    mockGetRecord.mockResolvedValue(exampleRecord({ resolution: null }))

    const { result } = await server.inject({
      method: 'GET',
      url: '/dataset/92b43165-0dd0-4e69-a712-1e49bb5aa0d0',
      auth: mockAuthCredentials
    })

    expect(result).not.toContain('>Resolution</h2>')
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

describe('#downloadController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('streams the whole file with its size', async () => {
    mockOpenDatasetFile.mockResolvedValue({ file: 'a,b\n1,2', contentType: 'text/csv', contentLength: 7, fileName: 'data.csv' })

    const response = await server.inject({
      method: 'GET',
      url: '/dataset/download/92b43165-0dd0-4e69-a712-1e49bb5aa0d0/data.csv',
      headers: { range: 'bytes=2-' },
      auth: mockAuthCredentials
    })

    expect(mockOpenDatasetFile).toHaveBeenCalledWith('92b43165-0dd0-4e69-a712-1e49bb5aa0d0', 'data.csv')
    expect(response.statusCode).toBe(statusCodes.ok)
    expect(response.headers['content-length']).toBe('7')
    expect(response.headers['accept-ranges']).toBeUndefined()
    expect(response.payload).toBe('a,b\n1,2')
  })

  test('encodes the downloaded file name', async () => {
    mockOpenDatasetFile.mockResolvedValue({ file: 'a,b', contentType: 'text/csv', fileName: 'flood extents €.csv' })

    const response = await server.inject({
      method: 'GET',
      url: '/dataset/download/92b43165-0dd0-4e69-a712-1e49bb5aa0d0/data.csv',
      auth: mockAuthCredentials
    })

    expect(response.statusCode).toBe(statusCodes.ok)
    expect(response.headers['content-disposition']).toBe("attachment; filename*=UTF-8''flood%20extents%20%E2%82%AC.csv")
  })
})

describe('#land model download', () => {
  const datasetUrl = '/dataset/92b43165-0dd0-4e69-a712-1e49bb5aa0d0'
  const downloadUrl = `${datasetUrl}/land-model-download`
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  const gridRecord = (overrides = {}) => exampleRecord({
    catalogueCategories: ['landModelGrids'],
    links: [{ url: 'https://example.com/data.zip', name: 'data.zip', description: '' }],
    ...overrides
  })

  beforeEach(() => {
    mockGetRecord.mockReset()
    mockGetRecord.mockResolvedValue(gridRecord())
    mockOpenLandModelFile.mockReset()
  })

  const get = (url, headers = {}) => server.inject({ method: 'GET', url, headers, auth: mockAuthCredentials })

  const cookieFrom = (response) => response.headers['set-cookie'].map((value) => value.split(';')[0]).join('; ')

  const followRedirect = (response) => get(response.headers.location.split('#')[0], { cookie: cookieFrom(response) })

  const formGroup = ($, id) => $(`#${id}`).closest('.govuk-form-group')

  test('replaces the file table with the land model form', async () => {
    const { result } = await get(datasetUrl)
    const $ = load(result)

    expect($('table a[download]')).toHaveLength(0)
    expect($('form#land-model-download').attr('action')).toBe(downloadUrl)
    expect($('#land-model-download button[data-prevent-double-click="true"]').text().trim()).toBe('Download')
    expect($('#land-model-options .govuk-inset-text').hasClass('app-js-fallback')).toBe(true)
  })

  test('nests the questions that apply under the grid size', async () => {
    const { result } = await get(`${datasetUrl}?gridSize=10m&area=NY`)
    const $ = load(result)
    const inset = $('#land-model-options .govuk-inset-text')

    expect(formGroup($, 'land-model-area-select').hasClass('app-js-fallback')).toBe(false)
    expect(formGroup($, 'land-model-format-select').hasClass('app-js-fallback')).toBe(false)
    expect(inset.find('p.app-js-only').text()).toContain('dominant values')
    expect(inset.find('#land-model-area-select')).toHaveLength(1)
    expect(inset.find('#land-model-format-select')).toHaveLength(1)
  })

  test.each([
    ['gridSize=1km', 'land-model-area-select', 'This grid size comes as one file covering all of England.'],
    ['gridSize=10m&area=all', 'land-model-format-select', 'Format: Cloud Optimised GeoTIFF']
  ])('shows the implied answer as text for %s', async (query, id, text) => {
    const { result } = await get(`${datasetUrl}?${query}`)
    const $ = load(result)

    const inset = $('#land-model-options .govuk-inset-text')

    expect(formGroup($, id).hasClass('app-js-fallback')).toBe(true)
    expect(inset.hasClass('app-js-fallback')).toBe(false)
    expect(inset.find(`p.app-js-only:contains("${text}")`)).toHaveLength(1)
  })

  test('warns about large files under the area question', async () => {
    const { result } = await get(`${datasetUrl}?gridSize=100m&area=all&format=gpkg`)
    const $ = load(result)
    const partials = $('#land-model-options .govuk-inset-text > [data-app-partial]').map((_i, partial) => partial.attribs.id).get()

    expect(partials).toEqual(['land-model-area', 'land-model-warning', 'land-model-format'])
    expect($('#land-model-warning .govuk-warning-text').text()).toContain('about 40GB')
  })

  test('features skip the grid size question', async () => {
    mockGetRecord.mockResolvedValue(exampleRecord({ catalogueCategories: ['landModelParcels'] }))

    const { result } = await get(`${datasetUrl}?area=NY&format=parquet`)
    const $ = load(result)

    expect($('#land-model-grid-size-select')).toHaveLength(0)
    expect($('#land-model-options .govuk-inset-text')).toHaveLength(0)
    expect($('#land-model-format-select option[selected]').val()).toBe('parquet')
  })

  test('hides the form for restricted download datasets', async () => {
    mockGetRecord.mockResolvedValue(gridRecord({ catalogueCategories: ['landModelGrids', 'restrictedDownloadDatasets'] }))

    const { statusCode, result } = await get(datasetUrl)

    expect(statusCode).toBe(statusCodes.ok)
    expect(load(result)('#land-model-download')).toHaveLength(0)
  })

  test('returns partials for JSON requests', async () => {
    const { result, headers } = await get(`${datasetUrl}?gridSize=1km&format=gpkg`, { accept: 'application/json' })

    expect(headers['content-type']).toContain('application/json')
    expect(result.url).toBe(`${datasetUrl}?gridSize=1km&format=gpkg`)
    expect(Object.keys(result.partials)).toEqual([
      'land-model-grid-size',
      'land-model-options',
      'land-model-area',
      'land-model-warning',
      'land-model-format',
      'land-model-details'
    ])
    expect(result.partials['land-model-grid-size']).toContain('<option value="1km" selected>')
    expect(result.partials['land-model-options']).toContain('id="land-model-area"')
    expect(result.partials['land-model-area']).toContain('This grid size comes as one file covering all of England.')
    expect(result.partials['land-model-details']).toContain('Grid squares of 1 kilometre by 1 kilometre, covering all of England')
  })

  test('streams the whole selected file', async () => {
    mockOpenLandModelFile.mockResolvedValue({ file: 'gpkg bytes', contentType: 'application/octet-stream', contentLength: 10, fileName: 'grid-10m.gpkg' })

    const response = await get(`${downloadUrl}?gridSize=10m&area=NY&format=gpkg`, { range: 'bytes=5-' })

    expect(mockOpenLandModelFile).toHaveBeenCalledWith('NY/grid-10m.gpkg')
    expect(response.statusCode).toBe(statusCodes.ok)
    expect(response.headers['content-length']).toBe('10')
    expect(response.headers['accept-ranges']).toBeUndefined()
    expect(response.headers['content-type']).toBe('application/geopackage+sqlite3')
    expect(response.headers['content-disposition']).toBe("attachment; filename*=UTF-8''grid-10m-NY.gpkg")
    expect(response.payload).toBe('gpkg bytes')
  })

  test('redirects with an error for a format not offered', async () => {
    const response = await get(`${downloadUrl}?gridSize=10m&area=all&format=gpkg`)

    expect(response.statusCode).toBe(statusCodes.found)
    expect(mockOpenLandModelFile).not.toHaveBeenCalled()
    expect(response.headers.location).toBe(`${datasetUrl}?gridSize=10m&area=all&format=cog#land-model-error-summary`)

    const $ = load((await followRedirect(response)).result)
    expect($('#land-model-format-select-error').text()).toContain('Format must be Cloud Optimised GeoTIFF for the 10 metre grid in all of England')
    expect($('#land-model-format-select option').map((_i, option) => $(option).val()).get()).toEqual(['', 'cog'])
    expect($('#land-model-format-select option[selected]')).toHaveLength(0)
  })

  test('redirects with an error for a missing area', async () => {
    const response = await get(`${downloadUrl}?gridSize=10m`)

    expect(response.statusCode).toBe(statusCodes.found)
    expect(response.headers.location).toBe(`${datasetUrl}?gridSize=10m#land-model-error-summary`)
    expect(mockOpenLandModelFile).not.toHaveBeenCalled()

    const page = await followRedirect(response)
    const $ = load(page.result)

    expect($('title').text()).toMatch(/^\s*Error: Flood Extents/)
    expect($('.app-dataset-data > #land-model-error-summary a[href="#land-model-area-select"]').text()).toBe('Select an area')
    expect($('#land-model-area-select-error').text()).toContain('Select an area')
    expect($('#land-model-grid-size-select option[selected]').val()).toBe('10m')
  })

  test('shows errors only once', async () => {
    const page = await followRedirect(await get(`${downloadUrl}?gridSize=10m`))
    expect(load(page.result)('.govuk-error-summary')).toHaveLength(1)

    const again = await get(`${datasetUrl}?gridSize=10m`, { cookie: cookieFrom(page) })
    expect(load(again.result)('.govuk-error-summary')).toHaveLength(0)
  })

  test('keeps errors with their dataset', async () => {
    const otherId = 'f425f1e1-fc18-4b5a-88d8-76934125627c'
    const response = await get(`${downloadUrl}?gridSize=10m`)

    mockGetRecord.mockResolvedValueOnce(gridRecord({ id: otherId }))
    const other = await get(`/dataset/${otherId}`, { cookie: cookieFrom(response) })
    expect(load(other.result)('.govuk-error-summary')).toHaveLength(0)

    const $ = load((await followRedirect(response)).result)
    expect($('.govuk-error-summary').text()).toContain('Select an area')
  })

  test('reports an area with no data', async () => {
    mockOpenLandModelFile.mockRejectedValue(Boom.notFound())

    const response = await get(`${downloadUrl}?gridSize=100m&area=SV&format=parquet`)

    expect(response.headers.location).toBe(`${datasetUrl}?gridSize=100m&area=SV&format=parquet#land-model-error-summary`)

    const $ = load((await followRedirect(response)).result)
    expect($('.govuk-error-summary').text()).toContain('There is no data for area SV, select a different area')
    expect($('#land-model-area-select option[selected]').val()).toBe('SV')
    expect($('#land-model-format-select option[selected]').val()).toBe('parquet')
  })

  test('returns 404 for a missing national file', async () => {
    mockOpenLandModelFile.mockRejectedValue(Boom.notFound())

    const response = await get(`${downloadUrl}?gridSize=1km&format=gpkg`)

    expect(response.statusCode).toBe(statusCodes.notFound)
    expect(response.result).toContain('Page not found')
  })

  test.each([
    ['datasets that are not land models', exampleRecord()],
    ['restricted land models', gridRecord({ catalogueCategories: ['landModelGrids', 'restrictedDownloadDatasets'] })]
  ])('returns 404 for %s', async (_name, record) => {
    mockGetRecord.mockResolvedValue(record)

    const response = await get(`${downloadUrl}?gridSize=1km&format=gpkg`)

    expect(response.statusCode).toBe(statusCodes.notFound)
    expect(mockOpenLandModelFile).not.toHaveBeenCalled()
  })

  test('returns 500 when storage fails', async () => {
    mockOpenLandModelFile.mockRejectedValue(new Error('Dash file download request failed'))

    const response = await get(`${downloadUrl}?gridSize=1km&format=gpkg`)

    expect(response.statusCode).toBe(statusCodes.internalServerError)
  })
})
