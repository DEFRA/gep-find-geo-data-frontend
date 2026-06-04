import { dateFilter } from './view-model.js'

const chipHref = (overrides) => JSON.stringify(overrides)

describe('#dateFilter', () => {
  describe('parse', () => {
    test('infers since mode from since parts', () => {
      expect(dateFilter.parse({ 'sinceDate-day': '1', 'sinceDate-month': '2', 'sinceDate-year': '2024' }))
        .toMatchObject({ mode: 'since' })
    })

    test('infers period mode from a year', () => {
      expect(dateFilter.parse({ fromYear: '2024' })).toMatchObject({ mode: 'period' })
      expect(dateFilter.parse({ toYear: '2024' })).toMatchObject({ mode: 'period' })
    })

    test('honours an explicit dateMode when provided', () => {
      expect(dateFilter.parse({ dateMode: 'last30Days' })).toMatchObject({ mode: 'last30Days' })
      expect(dateFilter.parse({ dateMode: 'last12Months' })).toMatchObject({ mode: 'last12Months' })
    })

    test('ignores an unknown dateMode and falls back to part-based inference', () => {
      expect(dateFilter.parse({ dateMode: 'junk', 'sinceDate-year': '2024' }).mode).toBe('since')
    })

    test('defaults mode to null when nothing is provided', () => {
      expect(dateFilter.parse({}).mode).toBeNull()
    })
  })

  describe('validate', () => {
    test('no errors for a null mode', () => {
      expect(dateFilter.validate(dateFilter.parse({}))).toEqual({})
    })

    test('no errors for the relative modes', () => {
      expect(dateFilter.validate(dateFilter.parse({ dateMode: 'last30Days' }))).toEqual({})
      expect(dateFilter.validate(dateFilter.parse({ dateMode: 'last12Months' }))).toEqual({})
    })

    test('since mode flags empty parts with the required message', () => {
      const input = dateFilter.parse({ dateMode: 'since' })
      expect(dateFilter.validate(input)).toEqual({
        sinceDate: { message: 'Enter a date', missing: ['day', 'month', 'year'] }
      })
    })

    test('since mode flags partial parts with a listing message', () => {
      const input = dateFilter.parse({ 'sinceDate-day': '1', 'sinceDate-year': '2024' })
      expect(dateFilter.validate(input).sinceDate).toMatchObject({
        message: 'Date must include a month',
        missing: ['month']
      })
    })

    test('since mode flags a non-real calendar date', () => {
      const input = dateFilter.parse({
        'sinceDate-day': '31', 'sinceDate-month': '2', 'sinceDate-year': '2024'
      })
      expect(dateFilter.validate(input).sinceDate).toMatchObject({ message: 'Date must be a real date' })
    })

    test('since mode rejects a future date', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'))
      try {
        const input = dateFilter.parse({
          'sinceDate-day': '16', 'sinceDate-month': '6', 'sinceDate-year': '2024'
        })
        expect(dateFilter.validate(input).sinceDate).toMatchObject({
          message: 'Date must be today or in the past'
        })
      } finally {
        vi.useRealTimers()
      }
    })

    test('since mode allows today', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'))
      try {
        const input = dateFilter.parse({
          'sinceDate-day': '15', 'sinceDate-month': '6', 'sinceDate-year': '2024'
        })
        expect(dateFilter.validate(input)).toEqual({})
      } finally {
        vi.useRealTimers()
      }
    })

    test('period mode allows both years empty', () => {
      expect(dateFilter.validate(dateFilter.parse({ dateMode: 'period' }))).toEqual({})
    })

    test('period mode flags a year that is not four digits', () => {
      const message = 'From year must be a 4-digit year from 1900 onwards'
      expect(dateFilter.validate(dateFilter.parse({ fromYear: '20x4' })).fromYear)
        .toMatchObject({ message })
      expect(dateFilter.validate(dateFilter.parse({ fromYear: '20025' })).fromYear)
        .toMatchObject({ message })
    })

    test('period mode flags a four-digit year before 1900', () => {
      expect(dateFilter.validate(dateFilter.parse({ fromYear: '0099' })).fromYear.message)
        .toContain('from 1900 onwards')
    })

    test('period mode flags from-later-than-to on the to year', () => {
      const input = dateFilter.parse({ fromYear: '2024', toYear: '2020' })
      expect(dateFilter.validate(input).toYear).toMatchObject({
        message: 'To year must be the same as or after from year'
      })
    })
  })

  describe('applyFilter', () => {
    test('since mode sets an open-ended from with no to', () => {
      const filters = {}
      const input = dateFilter.parse({
        'sinceDate-day': '1', 'sinceDate-month': '2', 'sinceDate-year': '2024'
      })
      dateFilter.applyFilter(filters, input, {})
      expect(filters.updatedAtBetween).toEqual({ from: '2024-02-01T00:00:00.000Z' })
    })

    test('period mode maps years to inclusive boundaries', () => {
      const filters = {}
      dateFilter.applyFilter(filters, dateFilter.parse({ fromYear: '2002', toYear: '2004' }), {})
      expect(filters.updatedAtBetween).toEqual({
        from: '2002-01-01T00:00:00.000Z',
        to: '2005-01-01T00:00:00.000Z'
      })
    })

    test('period mode allows a from-only or to-only range', () => {
      const fromOnly = {}
      dateFilter.applyFilter(fromOnly, dateFilter.parse({ fromYear: '2002' }), {})
      expect(fromOnly.updatedAtBetween).toEqual({ from: '2002-01-01T00:00:00.000Z' })

      const toOnly = {}
      dateFilter.applyFilter(toOnly, dateFilter.parse({ toYear: '2004' }), {})
      expect(toOnly.updatedAtBetween).toEqual({ to: '2005-01-01T00:00:00.000Z' })
    })

    test('relative modes set from relative to now', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'))
      try {
        const last30 = {}
        dateFilter.applyFilter(last30, dateFilter.parse({ dateMode: 'last30Days' }), {})
        expect(last30.updatedAtBetween).toEqual({ from: '2024-05-16T12:00:00.000Z' })

        const last12 = {}
        dateFilter.applyFilter(last12, dateFilter.parse({ dateMode: 'last12Months' }), {})
        expect(last12.updatedAtBetween).toEqual({ from: '2023-06-15T12:00:00.000Z' })
      } finally {
        vi.useRealTimers()
      }
    })

    test('leaves filters untouched when errors are present', () => {
      const filters = {}
      const input = dateFilter.parse({ 'sinceDate-day': '1' })
      dateFilter.applyFilter(filters, input, { sinceDate: { message: 'x', missing: [] } })
      expect(filters).toEqual({})
    })
  })

  describe('appendToParams', () => {
    test('writes only dateMode for a relative mode', () => {
      const params = new URLSearchParams()
      dateFilter.appendToParams(params, dateFilter.parse({ dateMode: 'last30Days' }))
      expect(params.toString()).toBe('dateMode=last30Days')
    })

    test('writes dateMode and parts for a since date', () => {
      const params = new URLSearchParams()
      dateFilter.appendToParams(params, dateFilter.parse({
        'sinceDate-day': '1', 'sinceDate-month': '2', 'sinceDate-year': '2024'
      }))
      expect(params.get('dateMode')).toBe('since')
      expect(params.get('sinceDate-day')).toBe('1')
    })

    test('writes both years for a period', () => {
      const params = new URLSearchParams()
      dateFilter.appendToParams(params, dateFilter.parse({ fromYear: '2020', toYear: '2024' }))
      expect(params.get('dateMode')).toBe('period')
      expect(params.get('fromYear')).toBe('2020')
      expect(params.get('toYear')).toBe('2024')
    })

    test('writes nothing for an empty period', () => {
      const params = new URLSearchParams()
      dateFilter.appendToParams(params, dateFilter.parse({ dateMode: 'period' }))
      expect(params.toString()).toBe('')
    })

    test('writes nothing when mode is null', () => {
      const params = new URLSearchParams()
      dateFilter.appendToParams(params, dateFilter.parse({}))
      expect(params.toString()).toBe('')
    })
  })

  describe('toChipItems', () => {
    test('one chip for a relative mode', () => {
      const parsed = { dateInput: dateFilter.parse({ dateMode: 'last30Days' }) }
      expect(dateFilter.toChipItems(parsed, chipHref)).toEqual([
        expect.objectContaining({ label: 'Last 30 days' })
      ])
    })

    test('one Since chip for a valid since date', () => {
      const parsed = {
        dateInput: dateFilter.parse({
          'sinceDate-day': '1', 'sinceDate-month': '2', 'sinceDate-year': '2024'
        })
      }
      const items = dateFilter.toChipItems(parsed, chipHref)
      expect(items).toHaveLength(1)
      expect(items[0].label).toMatch(/^Since /)
    })

    test('no chip for an invalid since date', () => {
      const parsed = {
        dateInput: dateFilter.parse({ 'sinceDate-day': '31', 'sinceDate-month': '2', 'sinceDate-year': '2024' })
      }
      expect(dateFilter.toChipItems(parsed, chipHref)).toEqual([])
    })

    test('separate chips per period endpoint', () => {
      const parsed = { dateInput: dateFilter.parse({ fromYear: '2020', toYear: '2024' }) }
      expect(dateFilter.toChipItems(parsed, chipHref).map((i) => i.label)).toEqual([
        'From 2020',
        'To 2024'
      ])
    })

    test('one chip when only a single period endpoint is set', () => {
      const parsed = { dateInput: dateFilter.parse({ toYear: '2024' }) }
      expect(dateFilter.toChipItems(parsed, chipHref).map((i) => i.label)).toEqual(['To 2024'])
    })

    test('no chips when a period year has a validation error', () => {
      const dateInput = dateFilter.parse({ fromYear: '20x4' })
      const parsed = { dateInput, dateErrors: dateFilter.validate(dateInput) }
      expect(dateFilter.toChipItems(parsed, chipHref)).toEqual([])
    })
  })

  describe('toErrorItems', () => {
    test('anchors a since error to its first missing field', () => {
      expect(dateFilter.toErrorItems({
        sinceDate: { message: 'Enter a date', missing: ['day', 'month', 'year'] }
      })).toEqual([{ text: 'Enter a date', href: '#sinceDate-day' }])
    })

    test('anchors period errors to their year fields', () => {
      expect(dateFilter.toErrorItems({
        fromYear: { message: 'bad from', missing: [] },
        toYear: { message: 'bad to', missing: [] }
      })).toEqual([
        { text: 'bad from', href: '#fromYear' },
        { text: 'bad to', href: '#toYear' }
      ])
    })

    test('empty for no errors', () => {
      expect(dateFilter.toErrorItems({})).toEqual([])
    })
  })

  describe('toFormViewModel', () => {
    test('exposes mode, selected flag, since input and year values', () => {
      const parsed = {
        dateInput: dateFilter.parse({ fromYear: '2020' }),
        dateErrors: {}
      }
      expect(dateFilter.toFormViewModel(parsed)).toMatchObject({
        mode: 'period',
        selected: true,
        hasErrors: false,
        sinceDateInput: { id: 'sinceDate' },
        fromYear: '2020',
        toYear: ''
      })
    })

    test('marks a relative mode as selected', () => {
      const parsed = { dateInput: dateFilter.parse({ dateMode: 'last12Months' }), dateErrors: {} }
      expect(dateFilter.toFormViewModel(parsed)).toMatchObject({ mode: 'last12Months', selected: true })
    })

    test('exposes the relative radio options with the checked one flagged', () => {
      const parsed = { dateInput: dateFilter.parse({ dateMode: 'last12Months' }), dateErrors: {} }
      expect(dateFilter.toFormViewModel(parsed).relativeOptions).toEqual([
        { value: 'last30Days', text: 'Last 30 days', checked: false },
        { value: 'last12Months', text: 'Last 12 months', checked: true }
      ])
    })

    test('does not mark an empty period as selected', () => {
      const parsed = { dateInput: dateFilter.parse({ dateMode: 'period' }), dateErrors: {} }
      expect(dateFilter.toFormViewModel(parsed)).toMatchObject({ mode: 'period', selected: false })
    })
  })
})
