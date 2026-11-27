/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FetchError, buildUrl, fetchPartials } from './fetch-partials.js'

describe('fetch partials', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each([
    ['with fields', '<input name="q" value="soil"><input name="page" value="2">', '/search?q=soil&page=2'],
    ['without fields', '', '/search']
  ])('builds the url %s', (_name, fields, url) => {
    const form = document.createElement('form')
    form.innerHTML = fields
    expect(buildUrl(form, '/search')).toBe(url)
  })

  it('requests JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ partials: {} }) })
    vi.stubGlobal('fetch', fetchMock)
    const { signal } = new AbortController()

    await expect(fetchPartials('/search', signal)).resolves.toEqual({ partials: {} })
    expect(fetchMock).toHaveBeenCalledWith('/search', { headers: { Accept: 'application/json' }, signal })
  })

  it('rejects with the status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))

    const error = await fetchPartials('/search', new AbortController().signal).catch((e) => e)
    expect(error).toBeInstanceOf(FetchError)
    expect(error.status).toBe(401)
  })
})
