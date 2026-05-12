/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

import { initCopyLinks } from './copy-link.js'

function setBody () {
  document.body.innerHTML = `
    <button type="button" data-module="app-copy-link" data-app-copy-url="https://example.com/service" aria-describedby="copy-status" hidden>Copy link</button>
    <span id="copy-status" aria-live="polite"></span>
  `
}

describe('copy-link enhancement', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
    document.documentElement.classList.remove('app-copy-link-supported')
  })

  it('keeps copy links hidden when the Clipboard API is unavailable', () => {
    setBody()
    vi.stubGlobal('navigator', {})

    initCopyLinks()

    expect(document.querySelector('[data-module="app-copy-link"]').hasAttribute('hidden')).toBe(true)
    expect(document.documentElement.classList.contains('app-copy-link-supported')).toBe(false)
  })

  it('reveals copy buttons, copies the target URL and announces success', async () => {
    setBody()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    initCopyLinks()
    const button = document.querySelector('[data-module="app-copy-link"]')
    button.dispatchEvent(new globalThis.MouseEvent('click', { bubbles: true, cancelable: true }))
    await Promise.resolve()

    expect(button.hasAttribute('hidden')).toBe(false)
    expect(document.documentElement.classList.contains('app-copy-link-supported')).toBe(true)
    expect(writeText).toHaveBeenCalledWith('https://example.com/service')
    expect(document.getElementById('copy-status').textContent).toBe('Link copied')
  })

  it('announces clipboard write failures without navigating', async () => {
    setBody()
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('NotAllowedError'))
      }
    })
    const assign = vi.fn()
    vi.stubGlobal('location', { assign })

    initCopyLinks()
    document.querySelector('[data-module="app-copy-link"]').dispatchEvent(
      new globalThis.MouseEvent('click', { bubbles: true, cancelable: true })
    )
    await Promise.resolve()

    expect(assign).not.toHaveBeenCalled()
    expect(document.getElementById('copy-status').textContent).toBe('Unable to copy link')
  })
})
