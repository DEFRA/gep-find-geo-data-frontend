import { vi } from 'vitest'

const testRecordCount = 30

vi.mock('../../../../config/config.js', () => ({
  config: {
    get: vi.fn((key) =>
      key === 'geonetwork.mockRecordCount' ? testRecordCount : null
    )
  }
}))

const { search } = await import('./mock.js')

describe('#mock', () => {
  describe('#search', () => {
    test('returns a total and results array shaped for pagination', async () => {
      const result = await search({ size: 10 })
      expect(result.total).toBe(testRecordCount)
      expect(result.results).toHaveLength(10)
    })

    test('narrows the result set when a keyword query is given', async () => {
      const result = await search({ query: 'woodland', size: testRecordCount })
      expect(result.total).toBeGreaterThan(0)
      expect(result.total).toBeLessThan(testRecordCount)
    })

    test('returns no results for a non-matching query', async () => {
      const result = await search({ query: 'zzz-nonexistent-term-zzz' })
      expect(result.total).toBe(0)
      expect(result.results).toHaveLength(0)
    })

    test('paginates with from and size', async () => {
      const page1 = await search({ from: 0, size: 5 })
      const page2 = await search({ from: 5, size: 5 })
      expect(page1.results).toHaveLength(5)
      expect(page2.results).toHaveLength(5)
      const page1Ids = new Set(page1.results.map((r) => r.id))
      for (const record of page2.results) {
        expect(page1Ids.has(record.id)).toBe(false)
      }
    })

    test('narrows the result set when an owner filter is applied', async () => {
      const filtered = await search({
        filters: { owner: ['Natural England'] },
        size: testRecordCount
      })
      expect(filtered.total).toBeGreaterThan(0)
      expect(filtered.total).toBeLessThan(testRecordCount)
    })

    test('narrows the result set when a dataType filter is applied', async () => {
      const filtered = await search({
        filters: { dataType: ['vector'] },
        size: testRecordCount
      })
      expect(filtered.total).toBeGreaterThan(0)
      expect(filtered.total).toBeLessThan(testRecordCount)
    })

    test('treats an empty filter array as absent', async () => {
      const result = await search({ filters: { owner: [] }, size: 10 })
      expect(result.total).toBe(testRecordCount)
    })

    test('throws on an unknown filter key', async () => {
      // @ts-expect-error verify unknown keys are rejected at runtime
      await expect(search({ filters: { unknown: ['value'] }, size: 10 })).rejects.toThrow('Unknown filter key')
    })

    test('applies updatedAtBetween.from', async () => {
      const cutoff = '2026-01-01T00:00:00.000Z'
      const result = await search({
        filters: { updatedAtBetween: { from: cutoff } },
        size: testRecordCount
      })
      expect(result.total).toBeGreaterThan(0)
      for (const record of result.results) {
        expect(record.updatedAt >= cutoff).toBe(true)
      }
    })

    test('applies updatedAtBetween.from and .to', async () => {
      const result = await search({
        filters: {
          updatedAtBetween: {
            from: '2026-03-01T00:00:00.000Z',
            to: '2026-04-01T00:00:00.000Z'
          }
        },
        size: testRecordCount
      })
      for (const record of result.results) {
        expect(record.updatedAt >= '2026-03-01T00:00:00.000Z').toBe(true)
        expect(record.updatedAt < '2026-04-01T00:00:00.000Z').toBe(true)
      }
    })

    test('empty updatedAtBetween is a no-op', async () => {
      const result = await search({ filters: { updatedAtBetween: {} }, size: 10 })
      expect(result.total).toBe(testRecordCount)
    })

    test('sorts by newest', async () => {
      const result = await search({ sort: 'newest', size: testRecordCount })
      const dates = result.results.map((r) => r.updatedAt)
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1] >= dates[i]).toBe(true)
      }
    })

    test('sorts by oldest', async () => {
      const result = await search({ sort: 'oldest', size: testRecordCount })
      const dates = result.results.map((r) => r.updatedAt)
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1] <= dates[i]).toBe(true)
      }
    })

    test('sorts by titleAsc', async () => {
      const result = await search({ sort: 'titleAsc', size: testRecordCount })
      const titles = result.results.map((r) => r.title)
      const sorted = [...titles].sort((a, b) => a.localeCompare(b))
      expect(titles).toEqual(sorted)
    })

    test('sorts by titleDesc', async () => {
      const result = await search({ sort: 'titleDesc', size: testRecordCount })
      const titles = result.results.map((r) => r.title)
      const sorted = [...titles].sort((a, b) => b.localeCompare(a))
      expect(titles).toEqual(sorted)
    })

    test('throws on an unknown sort value', async () => {
      // @ts-expect-error verify unknown sort is rejected at runtime
      await expect(search({ sort: 'unknown', size: 3 })).rejects.toThrow('Unknown sort')
    })

    test('computes facets when requested', async () => {
      const result = await search({ facets: ['owner'], size: 0 })
      expect(result.facets.owner.length).toBeGreaterThan(0)
      const total = result.facets.owner.reduce((s, b) => s + b.count, 0)
      expect(total).toBe(testRecordCount)
    })

    test('a facet bucket set excludes its own filter', async () => {
      const result = await search({
        filters: { owner: ['Environment Agency'] },
        facets: ['owner'],
        size: 0
      })
      const owners = result.facets.owner.map((bucket) => bucket.value)
      expect(owners.length).toBeGreaterThan(1)
      expect(owners).toContain('Environment Agency')
    })

    test('facet buckets filters for other facets', async () => {
      const result = await search({
        filters: { dataType: ['vector'] },
        facets: ['owner'],
        size: 0
      })
      const vectorTotal = result.total
      const ownerTotal = result.facets.owner.reduce((s, b) => s + b.count, 0)
      expect(ownerTotal).toBe(vectorTotal)
    })

    test('returns an empty facets map when none are requested', async () => {
      const result = await search({})
      expect(result.facets).toEqual({})
    })

    test('throws on an unknown facet name', async () => {
      await expect(search({ facets: ['unknown'], size: 0 })).rejects.toThrow('Unknown facet')
    })
  })
})
