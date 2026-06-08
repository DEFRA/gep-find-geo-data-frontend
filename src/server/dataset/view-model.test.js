import { buildViewModel } from './view-model.js'

/**
 * @param {object} overrides
 * @returns {import('../common/services/geonetwork/client.js').MetadataRecord}
 */
function baseRecord (overrides = {}) {
  return {
    id: 'abc',
    title: 'Test',
    links: [],
    ...overrides
  }
}

describe('#dataset view-model', () => {
  test('URLs without file extensions go to service links', () => {
    const record = baseRecord({
      links: [
        { url: 'https://example.com/spatialdata/wms', name: 'WMS service', description: '' },
        { url: 'https://example.com/explore/abc?download=true', name: 'Download AOI', description: '' },
        { url: 'https://example.com/FeatureServer', name: 'ESRI', description: '' }
      ]
    })

    const { serviceLinks } = buildViewModel(record)
    expect(serviceLinks).toHaveLength(3)
  })

  test('extracts format from URL path extension', () => {
    const record = baseRecord({
      links: [
        { url: 'https://example.com/files/data.zip', name: 'data', description: '' },
        { url: 'https://example.com/files/report.pdf', name: 'report', description: '' }
      ]
    })

    const { downloadLinks } = buildViewModel(record)
    expect(downloadLinks).toHaveLength(2)
    expect(downloadLinks[0].format).toBe('ZIP')
    expect(downloadLinks[1].format).toBe('PDF')
  })

  test('falls back to name when URL path has no extension', () => {
    const record = baseRecord({
      links: [
        { url: 'https://example.com/api/file/download?fileName=data.gdb', name: 'data.gdb.zip', description: '' },
        { url: 'https://example.com/api/file/download?fileName=report', name: 'report.pdf', description: '' },
        { url: 'https://example.com/api/file/download?fileName=style', name: 'style.lyrx', description: '' }
      ]
    })

    const { downloadLinks } = buildViewModel(record)
    expect(downloadLinks).toHaveLength(3)
    expect(downloadLinks[0].format).toBe('ZIP')
    expect(downloadLinks[1].format).toBe('PDF')
    expect(downloadLinks[2].format).toBe('LYRX')
  })

  test('treats versioned URL paths as service links, not downloads', () => {
    const record = baseRecord({
      links: [
        { url: 'https://example.com/service/v1.0', name: 'API v1.0', description: '' },
        { url: 'https://example.com/ogc/wcs?version=2.0.1', name: 'WCS', description: '' }
      ]
    })

    const { serviceLinks, downloadLinks } = buildViewModel(record)
    expect(serviceLinks).toHaveLength(2)
    expect(downloadLinks).toHaveLength(0)
  })

  test('handles records with no links', () => {
    const { serviceLinks, downloadLinks } = buildViewModel(baseRecord())
    expect(serviceLinks).toEqual([])
    expect(downloadLinks).toEqual([])
  })

  test('handles records with undefined links', () => {
    const { serviceLinks, downloadLinks } = buildViewModel(baseRecord({ links: undefined }))
    expect(serviceLinks).toEqual([])
    expect(downloadLinks).toEqual([])
  })

  test('rejects metadata links with unsafe URL schemes', () => {
    const record = baseRecord({
      links: [
        { url: 'https://example.com/spatialdata/wms', name: 'WMS service', description: '' },
        { url: 'http://example.com/files/data.zip', name: 'data', description: '' },
        { url: 'javascript:alert(1)', name: 'unsafe script', description: '' },
        { url: 'data:text/html,<script>alert(1)</script>', name: 'unsafe data', description: '' },
        { url: 'mailto:test@example.gov.uk', name: 'email', description: '' },
        { url: '/relative/path', name: 'relative', description: '' },
        { url: '', name: 'empty', description: '' }
      ]
    })

    const { serviceLinks, downloadLinks } = buildViewModel(record)
    expect(serviceLinks).toEqual([
      { url: 'https://example.com/spatialdata/wms', name: 'WMS service', description: '' }
    ])
    expect(downloadLinks).toEqual([
      { url: 'http://example.com/files/data.zip', name: 'data', description: '', format: 'ZIP' }
    ])
  })

  test('builds a coordinate reference system href only for safe URLs', () => {
    const safe = buildViewModel(baseRecord({
      coordinateReferenceSystem: 'http://www.opengis.net/def/crs/EPSG/0/27700'
    }))
    const unsafe = buildViewModel(baseRecord({
      coordinateReferenceSystem: 'javascript:alert(1)'
    }))

    expect(safe.coordinateReferenceSystemHref).toBe('http://www.opengis.net/def/crs/EPSG/0/27700')
    expect(unsafe.coordinateReferenceSystemHref).toBeNull()
  })

  test('builds a licence href for recognised licences', () => {
    const known = buildViewModel(baseRecord({
      licence: 'Open Government Licence'
    }))
    const unknown = buildViewModel(baseRecord({
      licence: 'Restricted access - contact publisher'
    }))
    const missing = buildViewModel(baseRecord())

    expect(known.licenceHref).toBe(
      'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/'
    )
    expect(unknown.licenceHref).toBeNull()
    expect(missing.licenceHref).toBeNull()
  })

  test('builds category and keyword filter links', () => {
    const record = baseRecord({
      categories: ['Environment', 'Elevation', 'environment'],
      keywords: ['Habitats and biotopes', 'landscape', 'landscape']
    })

    const { categoryLinks, keywordLinks } = buildViewModel(record)
    expect(categoryLinks).toEqual([
      { text: 'Environment', href: '/?category=Environment' },
      { text: 'Elevation', href: '/?category=Elevation' }
    ])
    expect(keywordLinks).toEqual([
      { text: 'Habitats and biotopes', href: '/?keyword=Habitats+and+biotopes' },
      { text: 'landscape', href: '/?keyword=landscape' }
    ])
  })
})
