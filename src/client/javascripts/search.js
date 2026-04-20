import {
  createAll,
  Button,
  Checkboxes,
  ErrorSummary,
  Radios
} from 'govuk-frontend'

import { createSessionStore } from '../common/helpers/session-store.js'

const GOVUK_PARTIAL_COMPONENTS = [Button, Checkboxes, ErrorSummary, Radios]

const openFiltersStore = createSessionStore('gep:search:openFilters')

const readOpenFilters = () => new Set(openFiltersStore.read() ?? [])

function applyOpenFilters (scope) {
  const details = scope?.querySelectorAll('details[data-filter-group]')
  if (!details?.length) {
    return
  }
  const open = readOpenFilters()
  details.forEach((el) => {
    if (open.has(el.dataset.filterGroup)) {
      el.open = true
    }
  })
}

function recordToggle (event) {
  const key = event.target?.dataset?.filterGroup
  if (!key) {
    return
  }
  const open = readOpenFilters()
  if (event.target.open) {
    open.add(key)
  } else {
    open.delete(key)
  }
  openFiltersStore.write([...open])
}

function buildUrl (form, endpoint) {
  const qs = new URLSearchParams(new FormData(form)).toString()
  return qs ? `${endpoint}?${qs}` : endpoint
}

function createPartialsLoader ({ resultsEl }) {
  let abortController = null

  const setBusy = (busy) => {
    if (busy) {
      resultsEl?.setAttribute('aria-busy', 'true')
    } else {
      resultsEl?.removeAttribute('aria-busy')
    }
  }

  const fetchPartials = async (url) => {
    abortController?.abort()
    abortController = new AbortController()
    const { signal } = abortController
    setBusy(true)

    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal
      })
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`)
      }
      return await response.json()
    } finally {
      if (!signal.aborted) {
        setBusy(false)
      }
    }
  }

  const swapPartials = (data) => {
    for (const [id, html] of Object.entries(data.partials || {})) {
      const el = document.getElementById(id)
      if (!el) {
        continue
      }
      el.innerHTML = html
      applyOpenFilters(el)
      for (const Component of GOVUK_PARTIAL_COMPONENTS) {
        createAll(Component, undefined, el)
      }
    }
  }

  const load = async (url, onFailure) => {
    try {
      const data = await fetchPartials(url)
      swapPartials(data)
      globalThis.history.pushState({}, '', data.url || url)
    } catch (error) {
      if (error.name !== 'AbortError') {
        onFailure()
      }
    }
  }

  const syncFromHistory = async (url) => {
    try {
      const data = await fetchPartials(url)
      swapPartials(data)
    } catch (error) {
      if (error.name !== 'AbortError') {
        globalThis.location.reload()
      }
    }
  }

  return { load, syncFromHistory }
}

function enhanceSearch (form) {
  const endpoint = form.dataset.endpoint || form.getAttribute('action') || '/'
  const filtersEl = document.getElementById('search-filters')
  const resultsEl = document.getElementById('search-results')
  const loader = createPartialsLoader({ resultsEl })

  const submitForm = () => {
    form.removeEventListener('submit', onSubmit)
    form.submit()
  }

  const onSubmit = (event) => {
    event.preventDefault()
    loader.load(buildUrl(form, endpoint), submitForm)
  }

  const onChange = (event) => {
    const target = event.target
    if (target.matches('input[type="radio"][aria-controls]')) {
      return // conditional-reveal radios submit via the revealed input's own change event
    }
    if (!target.matches('input[type="checkbox"], input[type="radio"], select')) {
      return
    }
    loader.load(buildUrl(form, endpoint), submitForm)
  }

  const onClick = (event) => {
    const link = event.target.closest(
      '[data-app-active-filters] a, [data-app-pagination] a'
    )
    if (link?.origin !== globalThis.location.origin) {
      return
    }
    event.preventDefault()
    loader.load(link.pathname + link.search, () => {
      globalThis.location.href = link.href
    })
  }

  const onPopstate = () => {
    loader.syncFromHistory(globalThis.location.href)
  }

  form.addEventListener('submit', onSubmit)
  form.addEventListener('change', onChange)
  resultsEl?.addEventListener('click', onClick)
  globalThis.addEventListener('popstate', onPopstate)
  filtersEl?.addEventListener('toggle', recordToggle, true)
  applyOpenFilters(filtersEl)
}

export function initSearch () {
  const form = document.querySelector('[data-module="app-search"]')
  if (!form) {
    return
  }
  enhanceSearch(form)
}
