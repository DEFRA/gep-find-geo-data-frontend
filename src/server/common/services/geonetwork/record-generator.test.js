import { generateRecords } from './record-generator.js'

describe('#record-generator', () => {
  test('returns the requested number of records', () => {
    expect(generateRecords(25, { seed: 1 })).toHaveLength(25)
    expect(generateRecords(0, { seed: 1 })).toEqual([])
  })

  test('assigns unique prefixed ids', () => {
    const records = generateRecords(200, { seed: 7 })
    const ids = records.map((r) => r.id)
    expect(new Set(ids).size).toBe(200)
    for (const id of ids) {
      expect(id.startsWith('fffff005-')).toBe(true)
    }
  })
})
