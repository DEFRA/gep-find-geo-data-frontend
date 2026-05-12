function initCopyLinks () {
  const writeText = globalThis.navigator?.clipboard?.writeText?.bind(globalThis.navigator.clipboard)
  if (!writeText) {
    return
  }

  const links = document.querySelectorAll('[data-module="app-copy-link"]')
  document.documentElement.classList.add('app-copy-link-supported')

  for (const link of links) {
    link.removeAttribute('hidden')

    link.addEventListener('click', async (e) => {
      e.preventDefault()
      const status = link.getAttribute('aria-describedby')
        ? document.getElementById(link.getAttribute('aria-describedby'))
        : null

      try {
        await writeText(link.dataset.appCopyUrl)
        if (status) {
          status.textContent = 'Link copied'
        }
      } catch {
        if (status) {
          status.textContent = 'Unable to copy link'
        }
      }
    })
  }
}

export { initCopyLinks }
