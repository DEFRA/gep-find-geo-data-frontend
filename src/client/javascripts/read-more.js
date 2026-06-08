const DEFAULT_LIMIT = 300

function truncateAtWord (text, limit) {
  if (text.length <= limit) {
    return text
  }

  const trimmed = text.slice(0, limit)
  if (/\s/.test(text.charAt(limit))) {
    return trimmed.trimEnd()
  }

  for (let index = trimmed.length - 1; index >= 0; index -= 1) {
    if (/\s/.test(trimmed.charAt(index))) {
      return trimmed.slice(0, index)
    }
  }

  return trimmed
}

function getContentParagraphs (contentEl) {
  const paragraphs = contentEl.querySelectorAll('p')
  if (!paragraphs.length) {
    return [contentEl.textContent.replace(/\s+/g, ' ').trim()].filter(Boolean)
  }

  return Array.from(paragraphs)
    .map((paragraph) => paragraph.textContent.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

function truncateParagraphs (paragraphs, limit) {
  const truncatedParagraphs = []
  let remainingCharacters = limit

  for (const paragraph of paragraphs) {
    let shouldStop = false

    if (paragraph.length < remainingCharacters) {
      truncatedParagraphs.push(paragraph)
      remainingCharacters -= paragraph.length
    } else if (paragraph.length === remainingCharacters) {
      truncatedParagraphs.push(`${paragraph}...`)
      shouldStop = true
    } else {
      truncatedParagraphs.push(`${truncateAtWord(paragraph, remainingCharacters)}...`)
      shouldStop = true
    }

    if (shouldStop) {
      break
    }
  }

  return truncatedParagraphs
}

function renderParagraphs (paragraphs) {
  const wrapper = document.createElement('div')

  for (const paragraph of paragraphs) {
    const paragraphEl = document.createElement('p')
    paragraphEl.className = 'govuk-body'
    paragraphEl.textContent = paragraph
    wrapper.append(paragraphEl)
  }

  return wrapper.innerHTML
}

function initReadMore () {
  const modules = document.querySelectorAll('[data-module="app-read-more"]')

  modules.forEach((module) => {
    const contentEl = module.querySelector('[id]')
    const button = module.querySelector('button')
    if (!contentEl || !button) {
      return
    }

    const limit = module.dataset.appReadMoreLimit
      ? Number.parseInt(module.dataset.appReadMoreLimit, 10)
      : DEFAULT_LIMIT

    const paragraphs = getContentParagraphs(contentEl)
    const characterCount = paragraphs.join('').length
    if (characterCount <= limit) {
      return
    }

    const fullHtml = contentEl.innerHTML
    const truncatedHtml = renderParagraphs(truncateParagraphs(paragraphs, limit))

    contentEl.innerHTML = truncatedHtml
    button.removeAttribute('hidden')

    let expanded = false

    button.addEventListener('click', () => {
      expanded = !expanded
      contentEl.innerHTML = expanded ? fullHtml : truncatedHtml
      button.setAttribute('aria-expanded', String(expanded))
      button.textContent = expanded ? 'Show less' : 'Show more'

      if (!expanded) {
        module.scrollIntoView({ block: 'nearest' })
      }
    })
  })
}

export { initReadMore }
