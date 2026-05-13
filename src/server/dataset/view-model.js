/**
 * @param {string} value
 * @returns {string}
 */
function extractExtension (value) {
  const dot = value.lastIndexOf('.')
  if (dot === -1) {
    return ''
  }
  const ext = value.slice(dot + 1)
  if (!ext || ext.includes('/') || ext.includes('?') || !/[a-z]/i.test(ext)) {
    return ''
  }
  return ext.toUpperCase()
}

/**
 * @param {string} value
 * @returns {URL | null}
 */
function parseUrl (value) {
  if (!URL.canParse(value)) {
    return null
  }

  return new URL(value)
}

/**
 * @param {import('../common/services/geonetwork/client.js').MetadataLink} link
 * @returns {string}
 */
function extractFormat (link) {
  const url = parseUrl(link.url)
  const format = url ? extractExtension(url.pathname) : ''
  if (format) {
    return format
  }

  return extractExtension(link.name)
}

/**
 * @param {import('../common/services/geonetwork/client.js').MetadataLink} link
 * @returns {boolean}
 */
function hasSafeUrl (link) {
  return Boolean(safeUrl(link.url))
}

/**
 * @param {string} value
 * @returns {string | null}
 */
function safeUrl (value) {
  const url = parseUrl(value)
  if (!url) {
    return null
  }

  return url.protocol === 'http:' || url.protocol === 'https:' ? value : null
}

/**
 * @param {string} name
 * @param {string} value
 * @returns {string}
 */
function searchHref (name, value) {
  const params = new URLSearchParams()
  params.set(name, value)
  return `/?${params.toString()}`
}

/**
 * @param {string[]} values
 * @param {string} filterName
 * @returns {{ text: string, href: string }[]}
 */
function tagLinks (values, filterName) {
  const seen = new Set()
  const links = []
  for (const value of values) {
    const key = value?.toLowerCase()
    if (!key || seen.has(key)) {
      continue
    }

    seen.add(key)
    links.push({
      text: value,
      href: searchHref(filterName, value)
    })
  }
  return links
}

/**
 * @param {import('../common/services/geonetwork/client.js').MetadataRecord} record
 * @returns {object}
 */
function buildViewModel (record) {
  const links = (record.links ?? []).filter(hasSafeUrl)

  const serviceLinks = []
  const downloadLinks = []

  for (const link of links) {
    const format = extractFormat(link)
    if (format) {
      downloadLinks.push({ ...link, format })
    } else {
      serviceLinks.push(link)
    }
  }

  return {
    pageTitle: record.title,
    heading: record.title,
    record,
    serviceLinks,
    downloadLinks,
    coordinateReferenceSystemHref: safeUrl(record.coordinateReferenceSystem),
    categoryLinks: tagLinks(record.categories ?? [], 'category'),
    keywordLinks: tagLinks(record.keywords ?? [], 'keyword'),
    breadcrumbs: [
      { text: 'Search', href: '/' },
      { text: record.title }
    ]
  }
}

export { buildViewModel }
