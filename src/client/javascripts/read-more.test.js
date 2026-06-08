/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest'

import { initReadMore } from './read-more.js'

function setupTest (paragraphs, limit) {
  const limitAttr = limit ? ` data-app-read-more-limit="${limit}"` : ''
  document.body.innerHTML = `
    <div data-module="app-read-more"${limitAttr}>
      <div id="test-content">
        ${paragraphs.map((paragraph) => `<p class="govuk-body">${paragraph}</p>`).join('')}
      </div>
      <button type="button"
              class="app-link-button app-read-more__toggle"
              aria-expanded="false"
              aria-controls="test-content"
              hidden>Show more</button>
    </div>
  `

  initReadMore()
}

function setupHtml (html) {
  document.body.innerHTML = html

  initReadMore()
}

describe('read-more enhancement', () => {
  it('leaves short text unchanged', () => {
    setupTest(['Short abstract.'])

    const button = document.querySelector('button')
    expect(button.hasAttribute('hidden')).toBe(true)
    expect(document.querySelector('#test-content').textContent).toContain('Short abstract.')
  })

  it('leaves text unchanged when it is exactly on the limit', () => {
    setupTest(['Exactly twenty chars'], 20)

    const button = document.querySelector('button')
    expect(button.hasAttribute('hidden')).toBe(true)
    expect(document.querySelector('#test-content').textContent).toContain('Exactly twenty chars')
  })

  it('truncates text and toggles the full abstract', () => {
    setupTest(['First paragraph has more text.', 'Second paragraph.'], 19)

    const module = document.querySelector('[data-module="app-read-more"]')
    module.scrollIntoView = vi.fn()

    const button = document.querySelector('button')
    expect(button.hasAttribute('hidden')).toBe(false)
    expect(button.textContent).toBe('Show more')
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(document.querySelector('#test-content').textContent.trim()).toBe('First paragraph has...')

    button.click()
    expect(button.textContent).toBe('Show less')
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(document.querySelector('#test-content').textContent).toContain('Second paragraph.')

    button.click()
    expect(button.textContent).toBe('Show more')
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(module.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
  })

  it('preserves paragraphs when truncating into the second paragraph', () => {
    setupTest(['First paragraph.', 'Second paragraph.'], 22)

    const paragraphs = document.querySelectorAll('#test-content p')
    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[0].textContent).toBe('First paragraph.')
    expect(paragraphs[1].textContent).toBe('Second...')
  })

  it('truncates plain text content when there are no paragraphs', () => {
    setupHtml(`
      <div data-module="app-read-more" data-app-read-more-limit="10">
        <div id="test-content">Alpha beta gamma</div>
        <button type="button"
                aria-expanded="false"
                aria-controls="test-content"
                hidden>Show more</button>
      </div>
    `)

    const paragraphs = document.querySelectorAll('#test-content p')
    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0].textContent).toBe('Alpha beta...')
  })

  it('truncates at the character limit when there is no whitespace', () => {
    setupTest(['Supercalifragilistic'], 5)

    expect(document.querySelector('#test-content').textContent.trim()).toBe('Super...')
  })

  it('adds ellipsis when a paragraph exactly fills the remaining limit', () => {
    setupTest(['First paragraph.', 'Second paragraph.'], 16)

    expect(document.querySelector('#test-content').textContent.trim()).toBe('First paragraph....')
  })

  it('skips modules missing required markup', () => {
    setupHtml(`
      <div data-module="app-read-more">
        <div>No ID here but enough text to exceed the default character limit.</div>
      </div>
    `)

    expect(document.querySelector('[data-module="app-read-more"]').innerHTML.trim()).toBe(
      '<div>No ID here but enough text to exceed the default character limit.</div>'
    )
  })
})
