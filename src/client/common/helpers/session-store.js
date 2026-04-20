/**
 * A JSON-serialisable value persisted in sessionStorage under a single key.
 * Returns null when nothing is stored, the data is unreadable, or
 * sessionStorage is unavailable (private browsing, quota, disabled).
 *
 * @param {string} storageKey
 */
export function createSessionStore (storageKey) {
  return {
    read () {
      try {
        const raw = globalThis.sessionStorage.getItem(storageKey)
        return raw ? JSON.parse(raw) : null
      } catch {
        return null
      }
    },

    write (value) {
      try {
        globalThis.sessionStorage.setItem(storageKey, JSON.stringify(value))
      } catch {}
    },

    clear () {
      try {
        globalThis.sessionStorage.removeItem(storageKey)
      } catch {}
    }
  }
}
