import { describe, test, expect } from 'vitest'

import { linkify } from './linkify.js'

describe('linkify', () => {
  test('links URLs within text', () => {
    expect(linkify('Cite https://doi.org/10.5285/abc for reuse').toString())
      .toBe('Cite <a class="govuk-link" href="https://doi.org/10.5285/abc">https://doi.org/10.5285/abc</a> for reuse')
  })

  test('links www addresses and emails', () => {
    expect(linkify('www.example.com or data@example.gov.uk').toString())
      .toBe('<a class="govuk-link" href="http://www.example.com">www.example.com</a> or <a class="govuk-link" href="mailto:data@example.gov.uk">data@example.gov.uk</a>')
  })

  test('escapes HTML in the text', () => {
    expect(linkify('<script>alert(1)</script>').toString())
      .toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
  })

  test('keeps quotes inside the href', () => {
    expect(linkify('https://x.org/"onmouseover="alert(1)').toString())
      .toBe('<a class="govuk-link" href="https://x.org/&quot;onmouseover=&quot;alert(1">https://x.org/&quot;onmouseover=&quot;alert(1</a>')
  })

  test('does not link script URLs', () => {
    expect(linkify('javascript:alert(1)').toString()).toBe('javascript:alert(1)')
  })

  test('returns empty string for null', () => {
    expect(linkify(null).toString()).toBe('')
  })
})
