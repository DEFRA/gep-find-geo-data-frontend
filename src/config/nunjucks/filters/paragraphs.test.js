import { describe, test, expect } from 'vitest'

import { paragraphs } from './paragraphs.js'

describe('paragraphs', () => {
  test('splits on double newlines', () => {
    expect(paragraphs('First paragraph.\n\nSecond paragraph.'))
      .toEqual(['First paragraph.', 'Second paragraph.'])
  })

  test('trims whitespace around paragraphs', () => {
    expect(paragraphs('  First.  \n\n  Second.  '))
      .toEqual(['First.', 'Second.'])
  })

  test('handles blank lines with whitespace', () => {
    expect(paragraphs('A\n  \nB'))
      .toEqual(['A', 'B'])
  })

  test('returns single-element array for text without breaks', () => {
    expect(paragraphs('No breaks here.'))
      .toEqual(['No breaks here.'])
  })

  test('returns empty array for null', () => {
    expect(paragraphs(null)).toEqual([])
  })

  test('returns empty array for empty string', () => {
    expect(paragraphs('')).toEqual([])
  })
})
