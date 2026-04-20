import { buildPagination } from './pagination.js'

const hrefFor = (page) => `/?page=${page}`

const summarise = (pagination) =>
  pagination.items.map((item) => item.ellipsis ? '…' : (item.current ? `[${item.number}]` : item.number))

describe('#buildPagination', () => {
  test('returns null when there are no pages to render', () => {
    const none = { page: 1, hrefFor }
    expect(buildPagination({ ...none, pageSize: 10, total: 0 })).toBeNull()
    expect(buildPagination({ ...none, pageSize: 10, total: 10 })).toBeNull()
    expect(buildPagination({ ...none, pageSize: 0, total: 100 })).toBeNull()
  })

  describe('GOV.UK Design System sequences', () => {
    // https://design-system.service.gov.uk/components/pagination/
    test('first page: [1] 2 … 100', () => {
      const pagination = buildPagination({ page: 1, pageSize: 1, total: 100, hrefFor })
      expect(summarise(pagination)).toEqual(['[1]', 2, '…', 100])
    })

    test('second page: 1 [2] 3 … 100', () => {
      const pagination = buildPagination({ page: 2, pageSize: 1, total: 100, hrefFor })
      expect(summarise(pagination)).toEqual([1, '[2]', 3, '…', 100])
    })

    test('third page: 1 2 [3] 4 … 100', () => {
      const pagination = buildPagination({ page: 3, pageSize: 1, total: 100, hrefFor })
      expect(summarise(pagination)).toEqual([1, 2, '[3]', 4, '…', 100])
    })

    test('middle: 1 … 4 [5] 6 … 100', () => {
      const pagination = buildPagination({ page: 5, pageSize: 1, total: 100, hrefFor })
      expect(summarise(pagination)).toEqual([1, '…', 4, '[5]', 6, '…', 100])
    })

    test('near end: 1 … 97 [98] 99 100', () => {
      const pagination = buildPagination({ page: 98, pageSize: 1, total: 100, hrefFor })
      expect(summarise(pagination)).toEqual([1, '…', 97, '[98]', 99, 100])
    })

    test('last page: 1 … 99 [100]', () => {
      const pagination = buildPagination({ page: 100, pageSize: 1, total: 100, hrefFor })
      expect(summarise(pagination)).toEqual([1, '…', 99, '[100]'])
    })
  })

  describe('previous and next links', () => {
    test('omits previous on the first page', () => {
      const pagination = buildPagination({ page: 1, pageSize: 10, total: 100, hrefFor })
      expect(pagination.previous).toBeUndefined()
      expect(pagination.next).toEqual({ href: '/?page=2' })
    })

    test('omits next on the last page', () => {
      const pagination = buildPagination({ page: 10, pageSize: 10, total: 100, hrefFor })
      expect(pagination.previous).toEqual({ href: '/?page=9' })
      expect(pagination.next).toBeUndefined()
    })

    test('includes both on a middle page', () => {
      const pagination = buildPagination({ page: 5, pageSize: 10, total: 100, hrefFor })
      expect(pagination.previous).toEqual({ href: '/?page=4' })
      expect(pagination.next).toEqual({ href: '/?page=6' })
    })
  })

  describe('out-of-range current page', () => {
    test('clamps page above totalPages to the last page', () => {
      const pagination = buildPagination({ page: 999, pageSize: 10, total: 30, hrefFor })
      expect(summarise(pagination)).toEqual([1, 2, '[3]'])
      expect(pagination.next).toBeUndefined()
    })

    test('clamps page below 1 to the first page', () => {
      const pagination = buildPagination({ page: 0, pageSize: 10, total: 30, hrefFor })
      expect(summarise(pagination)).toEqual(['[1]', 2, 3])
      expect(pagination.previous).toBeUndefined()
    })
  })

  test('hrefFor is invoked with each page number it renders', () => {
    const seen = []
    buildPagination({
      page: 5,
      pageSize: 1,
      total: 100,
      hrefFor: (page) => { seen.push(page); return `/p/${page}` }
    })
    expect(seen).toEqual(expect.arrayContaining([1, 4, 5, 6, 100]))
  })
})
