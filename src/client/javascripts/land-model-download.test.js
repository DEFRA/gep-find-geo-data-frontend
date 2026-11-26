/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initLandModelDownload } from './land-model-download.js'

const endpoint = '/dataset/abc'

// Only the ids and nesting the script uses
function setup ({ gridSizeError = false, errorSummary = true } = {}) {
  document.title = 'Error: Land Model Grid'
  document.body.innerHTML = `
    ${errorSummary ? '<div id="land-model-error-summary"></div>' : ''}
    <form id="land-model-download" data-module="app-land-model-download" data-endpoint="${endpoint}">
      <div id="land-model-grid-size" data-app-partial>
        <div class="${gridSizeError ? 'govuk-form-group--error' : ''}">
          <select id="land-model-grid-size-select" name="gridSize"><option></option><option>1km</option></select>
        </div>
      </div>
      <div id="land-model-options" data-app-partial>
        <div id="land-model-area" data-app-partial>
          <select id="land-model-area-select" name="area"><option></option><option>NY</option></select>
        </div>
        <div id="land-model-format" data-app-partial></div>
      </div>
      <div id="land-model-details" data-app-partial></div>
      <button>Download</button>
    </form>
    <a href="#">Contact</a>
  `
  initLandModelDownload()
}

const PARTIALS = {
  'land-model-grid-size': '<select id="land-model-grid-size-select" name="gridSize"></select>',
  'land-model-options': '<div id="land-model-area" data-app-partial></div><div id="land-model-format" data-app-partial></div>',
  'land-model-area': 'new area',
  'land-model-format': 'new format',
  'land-model-details': 'new details'
}

const okResponse = () => ({ ok: true, json: () => Promise.resolve({ partials: PARTIALS, url: `${endpoint}?gridSize=1km` }) })

function stubFetch (response = okResponse()) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function deferFetch () {
  let respond
  vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve) => { respond = resolve })))
  return () => respond(okResponse())
}

function stubLocation () {
  const assign = vi.fn()
  vi.stubGlobal('location', { ...globalThis.location, assign })
  return assign
}

const flushAsync = () => new Promise((resolve) => setTimeout(resolve))

const busy = () => [...document.querySelectorAll('[aria-busy="true"]')].map((el) => el.id)
const inert = () => [...document.querySelectorAll('[inert]')].map((el) => el.id)
const text = (id) => document.getElementById(id).textContent

function change (id, value) {
  const select = document.getElementById(id)
  select.value = value
  select.dispatchEvent(new Event('change', { bubbles: true }))
  return select
}

function submit () {
  document.getElementById('land-model-download').dispatchEvent(new Event('submit', { cancelable: true }))
}

describe('land model download enhancement', () => {
  let replaceState

  beforeEach(() => {
    replaceState = vi.spyOn(globalThis.history, 'replaceState').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('swaps partials for the current choices', async () => {
    setup()
    const fetchMock = stubFetch()

    const select = change('land-model-grid-size-select', '1km')
    await flushAsync()

    expect(fetchMock).toHaveBeenCalledWith(`${endpoint}?gridSize=1km&area=`, expect.anything())
    expect(select.isConnected).toBe(true)
    expect([text('land-model-area'), text('land-model-format'), text('land-model-details')]).toEqual(['new area', 'new format', 'new details'])
    expect(replaceState).toHaveBeenCalledWith({}, '', `${endpoint}?gridSize=1km`)
    expect(document.getElementById('land-model-error-summary')).toBeNull()
    expect(document.title).toBe('Land Model Grid')
  })

  it('dims the other partials while loading', async () => {
    setup()
    const respond = deferFetch()

    change('land-model-grid-size-select', '1km')
    expect(busy()).toEqual(['land-model-options', 'land-model-details'])
    expect(inert()).toEqual(['land-model-options', 'land-model-details'])

    respond()
    await flushAsync()
    expect(busy()).toEqual([])
    expect(inert()).toEqual([])
  })

  it('keeps a nested select and swaps its siblings', async () => {
    setup()
    const respond = deferFetch()

    const select = change('land-model-area-select', 'NY')
    expect(busy()).toEqual(['land-model-grid-size', 'land-model-format', 'land-model-details'])

    respond()
    await flushAsync()
    expect(select.isConnected).toBe(true)
    expect(text('land-model-format')).toBe('new format')
  })

  it('replaces a select showing an error and keeps focus on it', async () => {
    setup({ gridSizeError: true })
    stubFetch()

    const select = change('land-model-grid-size-select', '1km')
    select.focus()
    await flushAsync()

    const replaced = document.getElementById('land-model-grid-size-select')
    expect(replaced).not.toBe(select)
    expect(document.activeElement).toBe(replaced)
  })

  it('leaves focus alone when the user has moved on', async () => {
    setup({ gridSizeError: true })
    const respond = deferFetch()

    change('land-model-grid-size-select', '1km')
    const link = document.querySelector('a')
    link.focus()
    respond()
    await flushAsync()

    expect(document.activeElement).toBe(link)
  })

  it('falls back to a page load when the request fails', async () => {
    setup()
    stubFetch({ ok: false, status: 500 })
    const assign = stubLocation()

    change('land-model-grid-size-select', '1km')
    await flushAsync()

    expect(assign).toHaveBeenCalledWith(`${endpoint}?gridSize=1km&area=#land-model-download`)
  })

  it('aborts the previous request without falling back', async () => {
    setup()
    const signals = []
    vi.stubGlobal('fetch', vi.fn((_url, { signal }) => {
      signals.push(signal)
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
      })
    }))
    const assign = stubLocation()

    change('land-model-grid-size-select', '1km')
    change('land-model-area-select', 'NY')
    await flushAsync()

    expect(signals.map((signal) => signal.aborted)).toEqual([true, false])
    expect(assign).not.toHaveBeenCalled()
  })

  it('clears errors when downloading', async () => {
    setup({ gridSizeError: true })
    stubFetch()

    submit()
    await flushAsync()

    expect(document.querySelector('.govuk-form-group--error')).toBeNull()
    expect(document.getElementById('land-model-error-summary')).toBeNull()
    expect(text('land-model-details')).toBe('new details')
  })

  it('does not fetch on download without errors', async () => {
    setup({ errorSummary: false })
    const fetchMock = stubFetch()

    submit()
    await flushAsync()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('stays on the page when clearing errors fails', async () => {
    setup()
    stubFetch({ ok: false, status: 500 })
    const assign = stubLocation()

    submit()
    await flushAsync()

    expect(busy()).toEqual([])
    expect(inert()).toEqual([])
    expect(assign).not.toHaveBeenCalled()
  })
})
