import { dateFilter } from './view-model.js'

const chipHref = (overrides) => JSON.stringify(overrides)

describe('#dateFilter', () => {
  describe('parse', () => {
    test('infers exact mode from exact parts', () => {
      expect(dateFilter.parse({ 'exactDate-day': '1', 'exactDate-month': '2', 'exactDate-year': '2024' }))
        .toMatchObject({ mode: 'exact' })
    })

    test('infers range mode from after or before parts', () => {
      expect(dateFilter.parse({ 'afterDate-year': '2024' })).toMatchObject({ mode: 'range' })
      expect(dateFilter.parse({ 'beforeDate-year': '2024' })).toMatchObject({ mode: 'range' })
    })

    test('honours an explicit dateMode when provided', () => {
      expect(dateFilter.parse({ dateMode: 'range' })).toMatchObject({ mode: 'range' })
    })

    test('ignores an unknown dateMode and falls back to part-based inference', () => {
      expect(dateFilter.parse({ dateMode: 'junk', 'exactDate-year': '2024' }).mode).toBe('exact')
    })

    test('defaults mode to null when nothing is provided', () => {
      expect(dateFilter.parse({}).mode).toBeNull()
    })
  })

  describe('validate', () => {
    test('no errors for a null mode', () => {
      expect(dateFilter.validate(dateFilter.parse({}))).toEqual({})
    })

    test('exact mode flags empty parts with the required message', () => {
      const input = dateFilter.parse({ dateMode: 'exact' })
      expect(dateFilter.validate(input)).toEqual({
        exactDate: { message: 'Enter a date', missing: ['day', 'month', 'year'] }
      })
    })

    test('exact mode flags partial parts with a listing message', () => {
      const input = dateFilter.parse({ 'exactDate-day': '1', 'exactDate-year': '2024' })
      expect(dateFilter.validate(input).exactDate).toMatchObject({
        message: 'Date must include a month',
        missing: ['month']
      })
    })

    test('exact mode flags a non-real calendar date', () => {
      const input = dateFilter.parse({
        'exactDate-day': '31', 'exactDate-month': '2', 'exactDate-year': '2024'
      })
      expect(dateFilter.validate(input).exactDate).toMatchObject({ message: 'Enter a valid date' })
    })

    test('range mode allows both endpoints empty', () => {
      expect(dateFilter.validate(dateFilter.parse({ dateMode: 'range' }))).toEqual({})
    })

    test('range mode flags partial endpoints independently', () => {
      const input = dateFilter.parse({ dateMode: 'range', 'afterDate-day': '1' })
      const errors = dateFilter.validate(input)
      expect(errors.afterDate).toBeDefined()
      expect(errors.beforeDate).toBeUndefined()
    })

    test('range mode flags after-later-than-before on the before endpoint', () => {
      const input = dateFilter.parse({
        dateMode: 'range',
        'afterDate-day': '10',
        'afterDate-month': '1',
        'afterDate-year': '2024',
        'beforeDate-day': '5',
        'beforeDate-month': '1',
        'beforeDate-year': '2024'
      })
      expect(dateFilter.validate(input).beforeDate).toMatchObject({
        message: '"Updated before" must be on or after "Updated after"'
      })
    })
  })

  describe('applyFilter', () => {
    test('sets updatedAtBetween when valid', () => {
      const filters = {}
      const input = dateFilter.parse({
        'exactDate-day': '1', 'exactDate-month': '2', 'exactDate-year': '2024'
      })
      dateFilter.applyFilter(filters, input, {})
      expect(filters.updatedAtBetween).toMatchObject({
        from: '2024-02-01T00:00:00.000Z',
        to: '2024-02-02T00:00:00.000Z'
      })
    })

    test('leaves filters untouched when errors are present', () => {
      const filters = {}
      const input = dateFilter.parse({ 'exactDate-day': '1' })
      dateFilter.applyFilter(filters, input, { exactDate: { message: 'x', missing: [] } })
      expect(filters).toEqual({})
    })
  })

  describe('appendToParams', () => {
    test('writes dateMode and parts for an exact date', () => {
      const params = new URLSearchParams()
      dateFilter.appendToParams(params, dateFilter.parse({
        'exactDate-day': '1', 'exactDate-month': '2', 'exactDate-year': '2024'
      }))
      expect(params.get('dateMode')).toBe('exact')
      expect(params.get('exactDate-day')).toBe('1')
    })

    test('writes both endpoints for a range', () => {
      const params = new URLSearchParams()
      dateFilter.appendToParams(params, dateFilter.parse({
        dateMode: 'range', 'afterDate-year': '2020', 'beforeDate-year': '2024'
      }))
      expect(params.get('afterDate-year')).toBe('2020')
      expect(params.get('beforeDate-year')).toBe('2024')
    })

    test('writes nothing when mode is null', () => {
      const params = new URLSearchParams()
      dateFilter.appendToParams(params, dateFilter.parse({}))
      expect(params.toString()).toBe('')
    })
  })

  describe('toChipItems', () => {
    test('one chip for a valid exact date', () => {
      const parsed = {
        dateInput: dateFilter.parse({
          'exactDate-day': '1', 'exactDate-month': '2', 'exactDate-year': '2024'
        })
      }
      expect(dateFilter.toChipItems(parsed, chipHref)).toHaveLength(1)
    })

    test('no chip for an invalid exact date', () => {
      const parsed = {
        dateInput: dateFilter.parse({ 'exactDate-day': '31', 'exactDate-month': '2', 'exactDate-year': '2024' })
      }
      expect(dateFilter.toChipItems(parsed, chipHref)).toEqual([])
    })

    test('separate chips per range endpoint', () => {
      const parsed = {
        dateInput: dateFilter.parse({
          dateMode: 'range',
          'afterDate-day': '1',
          'afterDate-month': '1',
          'afterDate-year': '2020',
          'beforeDate-day': '1',
          'beforeDate-month': '1',
          'beforeDate-year': '2024'
        })
      }
      const items = dateFilter.toChipItems(parsed, chipHref)
      expect(items.map((i) => i.label)).toEqual([
        expect.stringMatching(/^After /),
        expect.stringMatching(/^Before /)
      ])
    })

    test('no chips when any endpoint has a validation error', () => {
      const dateInput = dateFilter.parse({
        dateMode: 'range',
        'afterDate-day': '1',
        'beforeDate-day': '1',
        'beforeDate-month': '1',
        'beforeDate-year': '2024'
      })
      const parsed = { dateInput, dateErrors: dateFilter.validate(dateInput) }
      expect(dateFilter.toChipItems(parsed, chipHref)).toEqual([])
    })

    test('no chips when the date range is out of order', () => {
      const dateInput = dateFilter.parse({
        dateMode: 'range',
        'afterDate-day': '10',
        'afterDate-month': '1',
        'afterDate-year': '2024',
        'beforeDate-day': '5',
        'beforeDate-month': '1',
        'beforeDate-year': '2024'
      })
      const parsed = { dateInput, dateErrors: dateFilter.validate(dateInput) }
      expect(dateFilter.toChipItems(parsed, chipHref)).toEqual([])
    })
  })

  describe('toErrorItems', () => {
    test('anchors each error to its first missing field', () => {
      expect(dateFilter.toErrorItems({
        exactDate: { message: 'Enter a date', missing: ['day', 'month', 'year'] },
        afterDate: { message: '"Updated after" must include a year', missing: ['year'] }
      })).toEqual([
        { text: 'Enter a date', href: '#exactDate-day' },
        { text: '"Updated after" must include a year', href: '#afterDate-year' }
      ])
    })

    test('falls back to #day anchor when missing is empty', () => {
      expect(dateFilter.toErrorItems({
        beforeDate: { message: 'order error', missing: [] }
      })).toEqual([{ text: 'order error', href: '#beforeDate-day' }])
    })

    test('empty for no errors', () => {
      expect(dateFilter.toErrorItems({})).toEqual([])
    })
  })

  describe('toFormViewModel', () => {
    test('exposes mode, selected flag, and input params for each endpoint', () => {
      const parsed = {
        dateInput: dateFilter.parse({ dateMode: 'range', 'afterDate-year': '2020' }),
        dateErrors: {}
      }
      const vm = dateFilter.toFormViewModel(parsed)
      expect(vm).toMatchObject({
        mode: 'range',
        selected: true,
        hasErrors: false,
        exactDateInput: { id: 'exactDate' },
        afterDateInput: { id: 'afterDate' },
        beforeDateInput: { id: 'beforeDate' }
      })
    })
  })
})
