/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createSessionStore } from './session-store.js'

const KEY = 'test:store'

describe('createSessionStore', () => {
  afterEach(() => {
    globalThis.sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('reads null when nothing is stored', () => {
    const store = createSessionStore(KEY)
    expect(store.read()).toBeNull()
  })

  it('round-trips arrays', () => {
    const store = createSessionStore(KEY)
    store.write(['a', 'b'])
    expect(store.read()).toEqual(['a', 'b'])
  })

  it('round-trips plain objects', () => {
    const store = createSessionStore(KEY)
    store.write({ q: 'flood', page: 2 })
    expect(store.read()).toEqual({ q: 'flood', page: 2 })
  })

  it('clear removes the stored value', () => {
    const store = createSessionStore(KEY)
    store.write({ a: 1 })
    store.clear()
    expect(store.read()).toBeNull()
    expect(globalThis.sessionStorage.getItem(KEY)).toBeNull()
  })

  it('isolates values stored under different keys', () => {
    const a = createSessionStore('a')
    const b = createSessionStore('b')
    a.write([1])
    b.write([2])
    expect(a.read()).toEqual([1])
    expect(b.read()).toEqual([2])
  })

  it('returns null when stored JSON is malformed', () => {
    globalThis.sessionStorage.setItem(KEY, 'not json')
    const store = createSessionStore(KEY)
    expect(store.read()).toBeNull()
  })

  it('swallows sessionStorage errors on read, write, and clear', () => {
    for (const method of ['getItem', 'setItem', 'removeItem']) {
      vi.spyOn(globalThis.sessionStorage, method).mockImplementation(() => {
        throw new Error('blocked')
      })
    }
    const store = createSessionStore(KEY)
    expect(store.read()).toBeNull()
    expect(() => store.write({ a: 1 })).not.toThrow()
    expect(() => store.clear()).not.toThrow()
  })
})
