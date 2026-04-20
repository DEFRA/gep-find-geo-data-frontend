/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initSearch } from './search.js'

function setupDom () {
  document.body.innerHTML = `
    <div id="search-error-summary"></div>
    <form action="/" method="GET" data-module="app-search" data-endpoint="/">
      <input type="search" name="q" id="search-input" value="">
      <div id="search-filters">
        <details data-filter-group="owner">
          <summary>
            <span class="govuk-details__summary-text">Data owner</span>
          </summary>
          <div class="govuk-checkboxes">
            <div class="govuk-checkboxes__item">
              <input type="checkbox" name="owner" value="Natural England">
              <span class="govuk-hint">3</span>
            </div>
          </div>
        </details>
        <select name="sort">
          <option value="relevance" selected>Relevance</option>
          <option value="title">Title</option>
        </select>
      </div>
      <div id="search-results">
        <div data-app-active-filters></div>
        <ul><li>old</li></ul>
        <div data-app-pagination></div>
      </div>
    </form>
  `
}

function jsonResponse (overrides = {}) {
  const { partials = {}, ...rest } = overrides
  return {
    partials: {
      'search-filters': '<details>updated filters</details>',
      'search-results': '<ul><li>new result</li></ul>',
      'search-error-summary': '',
      ...partials
    },
    total: 1,
    url: '/?q=flood',
    ...rest
  }
}

function mockFetchOk (payload) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(payload)
  })
}

async function flushAsync () {
  await Promise.resolve()
  await Promise.resolve()
}

describe('search live-enhancement', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    window.sessionStorage.clear()
    document.body.innerHTML = ''
  })

  it('does nothing when there is no app-search form', () => {
    document.body.innerHTML = '<div></div>'
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    initSearch()

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('intercepts submit, fetches JSON, and swaps the regions', async () => {
    setupDom()
    const fetchSpy = mockFetchOk(jsonResponse({
      partials: { 'search-error-summary': '<div class="govuk-error-summary">problem</div>' }
    }))
    vi.stubGlobal('fetch', fetchSpy)

    initSearch()
    document.querySelector('form').dispatchEvent(
      new Event('submit', { cancelable: true })
    )
    await vi.runAllTimersAsync()
    await flushAsync()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [, options] = fetchSpy.mock.calls[0]
    expect(options.headers.Accept).toBe('application/json')
    expect(document.getElementById('search-filters').innerHTML).toContain(
      'updated filters'
    )
    expect(document.getElementById('search-results').innerHTML).toContain(
      'new result'
    )
    expect(document.getElementById('search-error-summary').innerHTML).toContain(
      'problem'
    )
  })

  it('clears the error summary when there are no errors', async () => {
    setupDom()
    document.getElementById('search-error-summary').innerHTML = '<div>old error</div>'
    const fetchSpy = mockFetchOk(jsonResponse())
    vi.stubGlobal('fetch', fetchSpy)

    initSearch()
    document.querySelector('form').dispatchEvent(
      new Event('submit', { cancelable: true })
    )
    await vi.runAllTimersAsync()
    await flushAsync()

    expect(document.getElementById('search-error-summary').innerHTML).toBe('')
  })

  it('sets aria-busy on results while fetching and clears it on completion', async () => {
    setupDom()
    let resolveJson
    const fetchSpy = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveJson = () => resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(jsonResponse())
        })
      })
    )
    vi.stubGlobal('fetch', fetchSpy)

    initSearch()
    const resultsCol = document.getElementById('search-results')
    expect(resultsCol.getAttribute('aria-busy')).toBeNull()

    document.querySelector('form').dispatchEvent(
      new Event('submit', { cancelable: true })
    )
    await flushAsync()
    expect(resultsCol.getAttribute('aria-busy')).toBe('true')

    resolveJson()
    await flushAsync()
    expect(resultsCol.getAttribute('aria-busy')).toBeNull()
  })

  it('does not fire on keystroke input events', async () => {
    setupDom()
    const fetchSpy = mockFetchOk(jsonResponse())
    vi.stubGlobal('fetch', fetchSpy)

    initSearch()
    const input = document.querySelector('input[type="search"]')
    input.value = 'flood'
    input.dispatchEvent(new Event('input', { bubbles: true }))

    await vi.advanceTimersByTimeAsync(500)
    await flushAsync()

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('preserves open details state across filter swaps via sessionStorage', async () => {
    setupDom()
    const fetchSpy = mockFetchOk(jsonResponse({
      partials: {
        'search-filters': `
          <details class="govuk-details app-filter-group" data-filter-group="owner">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">Data owner</span>
            </summary>
            <div class="govuk-details__text">new content</div>
          </details>`
      }
    }))
    vi.stubGlobal('fetch', fetchSpy)

    initSearch()
    const details = document.querySelector('#search-filters details')
    details.open = true
    details.dispatchEvent(new Event('toggle'))

    document.querySelector('form').dispatchEvent(
      new Event('submit', { cancelable: true })
    )
    await flushAsync()

    const updated = document.querySelector('#search-filters details')
    expect(updated.open).toBe(true)
    expect(updated.textContent).toContain('new content')
  })

  it('writes the open set to sessionStorage on toggle', () => {
    setupDom()
    vi.stubGlobal('fetch', vi.fn())

    initSearch()
    const details = document.querySelector('#search-filters details')
    details.open = true
    details.dispatchEvent(new Event('toggle'))

    const stored = JSON.parse(window.sessionStorage.getItem('gep:search:openFilters'))
    expect(stored).toEqual(['owner'])

    details.open = false
    details.dispatchEvent(new Event('toggle'))
    const cleared = JSON.parse(window.sessionStorage.getItem('gep:search:openFilters'))
    expect(cleared).toEqual([])
  })

  it('restores open details from sessionStorage on init', () => {
    window.sessionStorage.setItem('gep:search:openFilters', JSON.stringify(['owner']))
    setupDom()
    vi.stubGlobal('fetch', vi.fn())

    const details = document.querySelector('#search-filters details')
    expect(details.open).toBe(false)

    initSearch()
    expect(details.open).toBe(true)
  })

  it('triggers an immediate fetch on checkbox change', async () => {
    setupDom()
    const fetchSpy = mockFetchOk(jsonResponse())
    vi.stubGlobal('fetch', fetchSpy)

    initSearch()
    const checkbox = document.querySelector('input[type="checkbox"]')
    checkbox.checked = true
    checkbox.dispatchEvent(new Event('change', { bubbles: true }))

    await flushAsync()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('skips fetch on radios that reveal further inputs', async () => {
    setupDom()
    document.querySelector('#search-filters').insertAdjacentHTML('beforeend', `
      <input type="radio" name="dateMode" value="exact" aria-controls="conditional-dateMode">
    `)
    const fetchSpy = mockFetchOk(jsonResponse())
    vi.stubGlobal('fetch', fetchSpy)

    initSearch()
    const radio = document.querySelector('input[type="radio"][name="dateMode"]')
    radio.checked = true
    radio.dispatchEvent(new Event('change', { bubbles: true }))

    await flushAsync()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('triggers an immediate fetch when sort changes', async () => {
    setupDom()
    const fetchSpy = mockFetchOk(jsonResponse())
    vi.stubGlobal('fetch', fetchSpy)

    initSearch()
    const select = document.querySelector('select[name="sort"]')
    select.value = 'title'
    select.dispatchEvent(new Event('change', { bubbles: true }))

    await flushAsync()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('intercepts active-filter remove links', async () => {
    setupDom()
    document.querySelector('[data-app-active-filters]').innerHTML =
      '<a href="/?q=flood" class="remove">remove</a>'
    const fetchSpy = mockFetchOk(jsonResponse())
    vi.stubGlobal('fetch', fetchSpy)

    initSearch()
    const link = document.querySelector('[data-app-active-filters] a')
    const event = new Event('click', { bubbles: true, cancelable: true })
    link.dispatchEvent(event)

    await flushAsync()
    expect(event.defaultPrevented).toBe(true)
    expect(fetchSpy).toHaveBeenCalledWith(
      '/?q=flood',
      expect.any(Object)
    )
  })

  it('intercepts pagination links', async () => {
    setupDom()
    document.querySelector('[data-app-pagination]').innerHTML =
      '<a href="/?page=2">2</a>'
    const fetchSpy = mockFetchOk(jsonResponse())
    vi.stubGlobal('fetch', fetchSpy)

    initSearch()
    const link = document.querySelector('[data-app-pagination] a')
    const event = new Event('click', { bubbles: true, cancelable: true })
    link.dispatchEvent(event)

    await flushAsync()
    expect(event.defaultPrevented).toBe(true)
    expect(fetchSpy).toHaveBeenCalledWith(
      '/?page=2',
      expect.any(Object)
    )
  })

  it('aborts the in-flight request when a new search starts', async () => {
    setupDom()
    /** @type {AbortSignal} */
    let firstSignal
    const fetchSpy = vi
      .fn()
      .mockImplementationOnce((_url, options) => {
        firstSignal = options.signal
        return new Promise(() => {})
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(jsonResponse())
      })
    vi.stubGlobal('fetch', fetchSpy)

    initSearch()
    const form = document.querySelector('form')
    form.dispatchEvent(new Event('submit', { cancelable: true }))
    await flushAsync()
    expect(firstSignal.aborted).toBe(false)

    form.dispatchEvent(new Event('submit', { cancelable: true }))
    await flushAsync()

    expect(firstSignal.aborted).toBe(true)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('falls back to native form submit when fetch fails', async () => {
    setupDom()
    const fetchSpy = vi.fn().mockRejectedValue(new Error('network down'))
    vi.stubGlobal('fetch', fetchSpy)

    initSearch()
    const form = document.querySelector('form')
    const submitSpy = vi.spyOn(form, 'submit').mockImplementation(() => {})
    form.dispatchEvent(new Event('submit', { cancelable: true }))
    await flushAsync()

    expect(submitSpy).toHaveBeenCalled()
  })

  it('pushes a new history state with the canonical url', async () => {
    setupDom()
    const fetchSpy = mockFetchOk(jsonResponse())
    vi.stubGlobal('fetch', fetchSpy)
    const pushSpy = vi.spyOn(window.history, 'pushState')

    initSearch()
    document.querySelector('form').dispatchEvent(
      new Event('submit', { cancelable: true })
    )
    await flushAsync()

    expect(pushSpy).toHaveBeenCalledWith(
      expect.any(Object),
      '',
      '/?q=flood'
    )
  })

  it('re-runs search on popstate without pushing a new history entry', async () => {
    setupDom()
    const fetchSpy = mockFetchOk(jsonResponse())
    vi.stubGlobal('fetch', fetchSpy)
    const pushSpy = vi.spyOn(window.history, 'pushState')

    initSearch()
    window.dispatchEvent(new Event('popstate'))
    await flushAsync()

    expect(fetchSpy).toHaveBeenCalledWith(
      window.location.href,
      expect.any(Object)
    )
    expect(pushSpy).not.toHaveBeenCalled()
  })

  it('falls back to native submit on non-ok response', async () => {
    setupDom()
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({})
    })
    vi.stubGlobal('fetch', fetchSpy)

    initSearch()
    const form = document.querySelector('form')
    const submitSpy = vi.spyOn(form, 'submit').mockImplementation(() => {})
    form.dispatchEvent(new Event('submit', { cancelable: true }))
    await flushAsync()

    expect(submitSpy).toHaveBeenCalled()
  })

  it('reloads the page when popstate fetch fails', async () => {
    setupDom()
    const fetchSpy = vi.fn().mockRejectedValue(new Error('network down'))
    vi.stubGlobal('fetch', fetchSpy)
    const reloadSpy = vi.fn()
    vi.stubGlobal('location', {
      href: window.location.href,
      origin: window.location.origin,
      reload: reloadSpy
    })

    initSearch()
    window.dispatchEvent(new Event('popstate'))
    await flushAsync()

    expect(reloadSpy).toHaveBeenCalled()
  })

  it('does not fall back when a new search aborts the previous one', async () => {
    setupDom()
    const fetchSpy = vi
      .fn()
      .mockImplementationOnce((_url, options) => new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => {
          const err = new Error('aborted')
          err.name = 'AbortError'
          reject(err)
        })
      }))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(jsonResponse())
      })
    vi.stubGlobal('fetch', fetchSpy)

    initSearch()
    const form = document.querySelector('form')
    const submitSpy = vi.spyOn(form, 'submit').mockImplementation(() => {})
    form.dispatchEvent(new Event('submit', { cancelable: true }))
    await flushAsync()
    form.dispatchEvent(new Event('submit', { cancelable: true }))
    await flushAsync()

    expect(submitSpy).not.toHaveBeenCalled()
  })

  it('ignores clicks on cross-origin links', async () => {
    setupDom()
    document.querySelector('[data-app-pagination]').innerHTML =
      '<a href="https://external.test/">external</a>'
    const fetchSpy = mockFetchOk(jsonResponse())
    vi.stubGlobal('fetch', fetchSpy)

    initSearch()
    const link = document.querySelector('[data-app-pagination] a')
    const event = new Event('click', { bubbles: true, cancelable: true })
    link.dispatchEvent(event)

    await flushAsync()
    expect(event.defaultPrevented).toBe(false)
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
