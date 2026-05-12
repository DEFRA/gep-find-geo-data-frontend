import { renderComponent } from '../../../../../test-helpers/component-helpers.js'

describe('Copy link component', () => {
  test('renders a hidden progressively enhanced copy button and status', () => {
    const $copyLink = renderComponent('copy-link', {
      id: 'copy-service-1',
      url: 'https://example.com/service',
      text: 'Copy service link'
    })

    const $button = $copyLink('[data-module="app-copy-link"]')
    expect($button).toHaveLength(1)
    expect($button.attr('type')).toBe('button')
    expect($button.attr('hidden')).toBe('hidden')
    expect($button.attr('data-app-copy-url')).toBe('https://example.com/service')
    expect($button.attr('aria-describedby')).toBe('copy-service-1-status')
    expect($button.text().trim()).toBe('Copy service link')
    expect($copyLink('#copy-service-1-status').attr('aria-live')).toBe('polite')
  })

  test('defaults the button text', () => {
    const $copyLink = renderComponent('copy-link', {
      id: 'copy-service-1',
      url: 'https://example.com/service'
    })

    expect($copyLink('[data-module="app-copy-link"]').text().trim()).toBe('Copy link')
  })
})
