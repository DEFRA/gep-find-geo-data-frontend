import { buildUrl, fetchPartials } from '../common/helpers/fetch-partials.js'

/**
 * @param {HTMLFormElement} form
 * @param {HTMLSelectElement | null} select
 * @param {boolean} busy
 */
function setBusy (form, select, busy) {
  for (const partial of form.querySelectorAll('[data-app-partial]')) {
    if (busy && !partial.contains(select) && !partial.parentElement.closest('[aria-busy]')) {
      partial.setAttribute('aria-busy', 'true')
      partial.setAttribute('inert', '')
    } else {
      partial.removeAttribute('aria-busy')
      partial.removeAttribute('inert')
    }
  }
}

/**
 * @param {Record<string, string>} partials HTML by element id
 * @param {HTMLSelectElement | null} select
 */
function swapPartials (partials, select) {
  for (const [id, html] of Object.entries(partials)) {
    const el = document.getElementById(id)
    // Don't replace the in-use select unless it is errored
    const keep = el?.contains(select) && !select.closest('.govuk-form-group--error')
    if (el && !keep) {
      el.innerHTML = html
    }
  }

  if (select && !select.isConnected && document.activeElement === document.body) {
    document.getElementById(select.id)?.focus()
  }

  document.getElementById('land-model-error-summary')?.remove()
  document.title = document.title.replace(/^Error: /, '')
}

/**
 * @param {HTMLFormElement} form
 */
function enhanceLandModelDownload (form) {
  const endpoint = form.dataset.endpoint
  let abortController = null

  /**
   * @param {HTMLSelectElement | null} select that triggered the update or null on submit
   */
  const update = async (select) => {
    abortController?.abort()
    abortController = new AbortController()
    const { signal } = abortController
    const url = buildUrl(form, endpoint)
    setBusy(form, select, true)

    try {
      const data = await fetchPartials(url, signal)
      swapPartials(data.partials, select)
      globalThis.history.replaceState({}, '', data.url || url)
    } catch (error) {
      if (error.name !== 'AbortError' && select !== null) {
        // Reload the page with the current params to retry
        globalThis.location.assign(`${url}#${form.id}`)
      }
    } finally {
      if (!signal.aborted) {
        setBusy(form, select, false)
      }
    }
  }

  form.addEventListener('change', async (event) => {
    if (event.target.matches('select')) {
      await update(event.target)
    }
  })

  // A successful download does not reload the page, clear any errors here
  form.addEventListener('submit', async () => {
    if (document.getElementById('land-model-error-summary')) {
      await update(null)
    }
  })
}

export function initLandModelDownload () {
  const form = document.querySelector('[data-module="app-land-model-download"]')
  if (!form) {
    return
  }
  enhanceLandModelDownload(form)
}
