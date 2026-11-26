export class FetchError extends Error {
  /**
   * @param {number} status
   */
  constructor (status) {
    super(`Partials request failed: ${status}`)
    this.status = status
  }
}

/**
 * @param {HTMLFormElement} form
 * @param {string} endpoint
 */
export function buildUrl (form, endpoint) {
  const qs = new URLSearchParams(new FormData(form)).toString()
  return qs ? `${endpoint}?${qs}` : endpoint
}

/**
 * @param {string} url
 * @param {AbortSignal} signal
 * @returns {Promise<{ partials: Record<string, string>, url?: string }>}
 */
export async function fetchPartials (url, signal) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal
  })
  if (!response.ok) {
    throw new FetchError(response.status)
  }
  return response.json()
}
