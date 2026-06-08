import { renderComponent } from '../../../../../test-helpers/component-helpers.js'

const longText = 'This is a very long abstract that exceeds the default character limit. '.repeat(10).trim()
const shortText = 'A short abstract.'

describe('Read more component', () => {
  test('renders paragraphs from the text', () => {
    const text = 'First paragraph.\n\nSecond paragraph.'
    const $ = renderComponent('read-more', { id: 'test', text })

    const paras = $('p.govuk-body')
    expect(paras).toHaveLength(2)
    expect(paras.eq(0).text()).toBe('First paragraph.')
    expect(paras.eq(1).text()).toBe('Second paragraph.')
  })

  test('sets data-module attribute', () => {
    const $ = renderComponent('read-more', { id: 'test', text: shortText })

    expect($('[data-module="app-read-more"]')).toHaveLength(1)
  })

  test('sets character limit data attribute when provided', () => {
    const $ = renderComponent('read-more', {
      id: 'test',
      text: longText,
      characterLimit: 200
    })

    expect($('[data-module="app-read-more"]').attr('data-app-read-more-limit')).toBe('200')
  })

  test('omits character limit data attribute when not provided', () => {
    const $ = renderComponent('read-more', { id: 'test', text: shortText })

    expect($('[data-module="app-read-more"]').attr('data-app-read-more-limit')).toBeUndefined()
  })

  test('renders content div with correct id', () => {
    const $ = renderComponent('read-more', { id: 'summary', text: shortText })

    expect($('#summary-content')).toHaveLength(1)
  })

  test('renders hidden toggle button', () => {
    const $ = renderComponent('read-more', { id: 'test', text: shortText })

    const $button = $('button')
    expect($button).toHaveLength(1)
    expect($button.attr('type')).toBe('button')
    expect($button.attr('hidden')).toBe('hidden')
    expect($button.text().trim()).toBe('Show more')
  })

  test('button has accessible attributes', () => {
    const $ = renderComponent('read-more', { id: 'test', text: shortText })

    const $button = $('button')
    expect($button.attr('aria-expanded')).toBe('false')
    expect($button.attr('aria-controls')).toBe('test-content')
  })

  test('button has link-button styling class', () => {
    const $ = renderComponent('read-more', { id: 'test', text: shortText })

    const $button = $('button')
    expect($button.hasClass('app-link-button')).toBe(true)
    expect($button.hasClass('app-read-more__toggle')).toBe(true)
  })
})
