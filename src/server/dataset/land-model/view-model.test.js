import { buildLandModelDownload, formatSize } from './view-model.js'

const recordId = '92b43165-0dd0-4e69-a712-1e49bb5aa0d0'

function build (kind, query, errors) {
  return buildLandModelDownload({ recordId, kind, query, errors })
}

const values = (select) => select.items.map((item) => item.value)
const selectedValue = (select) => select.items.find((item) => item.selected)?.value
const jsFallback = (question) => Boolean(question.select.formGroup)

describe('#land model download view-model', () => {
  test('points the form at the download route', () => {
    const model = build('grid', { gridSize: '10m', area: 'NY', format: 'gpkg' })
    expect(model.formAction).toBe(`/dataset/${recordId}/land-model-download`)
    expect(model.endpoint).toBe(`/dataset/${recordId}`)
    expect(model.url).toBe(`/dataset/${recordId}?gridSize=10m&area=NY&format=gpkg`)
  })

  test('grid hides the questions with JavaScript until a grid size is chosen', () => {
    const model = build('grid', {})
    expect(model.gridSizeSelect.items[0]).toEqual({ value: '', text: 'Select a grid size' })
    expect(model.gridSizeSelect.items).toHaveLength(6)
    expect(model.inset).toEqual({ classes: 'app-land-model-inset app-js-fallback' })
    expect(values(model.format.select)).toEqual(['', 'gpkg', 'parquet', 'cog'])
    expect(selectedValue(model.format.select)).toBeUndefined()
    expect(model.details).toBeNull()
    expect(model.errorSummary).toBeNull()
  })

  test('10m asks for an area before the format', () => {
    const model = build('grid', { gridSize: '10m' })
    expect(selectedValue(model.gridSizeSelect)).toBe('10m')
    expect(model.inset).toEqual({ classes: 'app-land-model-inset' })
    expect(model.area.intro).toMatch(/^The 10 metre grid for all of England is only available as a Cloud Optimised GeoTIFF, which shows the dominant values\./)
    expect(model.area.select.items.slice(0, 3).map((item) => item.text)).toEqual(['Select an area', 'All of England', 'NT'])
    expect(jsFallback(model.area)).toBe(false)
    expect(jsFallback(model.format)).toBe(true)
    expect(values(model.format.select)[0]).toBe('')
    expect(model.details).toBeNull()
  })

  test('10m for all of England is a COG', () => {
    const model = build('grid', { gridSize: '10m', area: 'all' })
    expect(model.format.text).toBe('Format: Cloud Optimised GeoTIFF')
    expect(jsFallback(model.format)).toBe(true)
    expect(model.format.select.items).toEqual([
      { value: '', text: 'Select a format' },
      { value: 'cog', text: 'Cloud Optimised GeoTIFF', selected: true }
    ])
    expect(model.details).toEqual({
      summary: 'Grid squares of 10 metres by 10 metres, covering all of England (about 1.5GB)',
      warning: null
    })
  })

  test('10m for an area offers vector formats', () => {
    const model = build('grid', { gridSize: '10m', area: 'NY', format: 'parquet' })
    expect(model.format.select.items.map((item) => item.text)).toEqual(['Select a format', 'GeoPackage', 'Parquet'])
    expect(selectedValue(model.format.select)).toBe('parquet')
    expect(model.format.text).toBeNull()
    expect(jsFallback(model.format)).toBe(false)
    expect(model.details.summary).toMatch(/^Grid squares of 10 metres by 10 metres, for area NY \(up to \d/)
  })

  test('100m offers a format before an area', () => {
    const model = build('grid', { gridSize: '100m' })
    expect(model.area.intro).toBeNull()
    expect(selectedValue(model.format.select)).toBeUndefined()
    expect(jsFallback(model.format)).toBe(false)
    expect(model.details).toBeNull()
  })

  test('national-only sizes skip the area', () => {
    const model = build('grid', { gridSize: '100km', format: 'gpkg' })
    expect(model.area).toMatchObject({ intro: null, text: 'This grid size comes as one file covering all of England.' })
    expect(jsFallback(model.area)).toBe(true)
    expect(model.details.summary).toMatch(/^Grid squares of 100 kilometres by 100 kilometres, covering all of England \(about \d/)
  })

  test('features skip the grid size and offer vector formats', () => {
    const model = build('features', {})
    expect(model.intro).toBe('Choose an area, or download all of England.')
    expect(model.gridSizeSelect).toBeNull()
    expect(model.inset).toBeNull()
    expect(model.area.intro).toBeNull()
    expect(jsFallback(model.area)).toBe(false)
    expect(values(model.format.select)).toEqual(['', 'gpkg', 'parquet'])
    expect(selectedValue(model.format.select)).toBeUndefined()
    expect(model.details).toBeNull()
  })

  test('shows features details once a format is chosen', () => {
    expect(build('features', { area: 'NY' }).details).toBeNull()
    expect(build('features', { area: 'NY', format: 'gpkg' }).details.summary).toMatch(/^Features for area NY \(up to \d/)
  })

  test('features for all of England warn about size', () => {
    const { details } = build('features', { area: 'all', format: 'gpkg' })
    expect(details.summary).toBe('Features for all of England (about 150GB)')
    expect(details.warning).toBe('This download is about 150GB. It may take a long time to download. You will need a fast, reliable internet connection and enough space on your computer.')
  })

  test('no warning up to 10GB', () => {
    const { details } = build('grid', { gridSize: '100m', area: 'all', format: 'parquet' })
    expect(details).toEqual({ summary: 'Grid squares of 100 metres by 100 metres, covering all of England (about 2.1GB)', warning: null })
  })

  test.each([
    [150000, '150GB'],
    [1500, '1.5GB'],
    [1000, '1GB'],
    [123, '123MB']
  ])('%s MB shows as %s', (megabytes, expected) => {
    expect(formatSize(megabytes)).toBe(expected)
  })

  test.each([
    [{ gridSize: '10m' }, 'area', 'Select an area', undefined, undefined],
    [{ gridSize: '1km' }, 'area', 'Area must be All of England for the 1 kilometre grid', 'NY', 'NY'],
    [{ gridSize: '10m', area: 'NT' }, 'area', 'There is no data for area NT, select a different area', 'NT', 'NT'],
    [{ gridSize: '10m', area: 'all' }, 'format', 'Format must be Cloud Optimised GeoTIFF for the 10 metre grid in all of England', 'gpkg', undefined]
  ])('%j shows a %s error', (query, field, text, value, selected) => {
    const model = build('grid', query, [{ field, text, value }])
    expect(model[field].select.errorMessage).toEqual({ text })
    expect(selectedValue(model[field].select)).toBe(selected)
    expect(jsFallback(model[field])).toBe(false)
    expect(model.gridSizeSelect.errorMessage).toBeUndefined()
    expect(model.errorSummary.errorList).toEqual([{ text, href: `#land-model-${field}-select` }])
  })
})
