/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initMockLinks } from './mock-links.js'

describe('initMockLinks', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <a class="js-mock-link" href="/mock-download">Mock download</a>
      <a class="js-mock-link" href="/another-download">Another download</a>
      <a class="standard-link" href="/real-page">Standard link</a>
    `
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('prevents the default action when a mock link is clicked', () => {
    initMockLinks()

    const link = document.querySelector('.js-mock-link')
    const event = new window.MouseEvent('click', {
      bubbles: true,
      cancelable: true
    })

    link.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
  })

  it('initialises every mock link on the page', () => {
    initMockLinks()

    const links = document.querySelectorAll('.js-mock-link')

    links.forEach((link) => {
      const event = new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true
      })

      link.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(true)
    })
  })

  it('does not prevent clicks on links without the mock-link class', () => {
    initMockLinks()

    const link = document.querySelector('.standard-link')
    const event = new window.MouseEvent('click', {
      bubbles: true,
      cancelable: true
    })

    link.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
  })

  it('does not throw when there are no mock links', () => {
    document.body.innerHTML = ''

    expect(() => initMockLinks()).not.toThrow()
  })
})
