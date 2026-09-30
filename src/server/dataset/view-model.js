import { fileFormat } from '../common/constants/file-formats.js'
import { licenceUrl } from '../common/constants/licences.js'

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
 * Checks the URL path, its `fileName` query value and the link name, preferring
 * the most specific format, e.g. `flood.gdb.zip` over a plain `12345.zip`.
 * The name is free text, so only known formats count there.
 * @param {import('../common/services/geonetwork/client.js').MetadataLink} link
 * @returns {string}
 */
function extractFormat (link) {
  const url = parseUrl(link.url)
  const nameFormat = fileFormat(link.name)
  const formats = [
    fileFormat(url?.pathname),
    fileFormat(url?.searchParams.get('fileName')),
    nameFormat?.known ? nameFormat : null
  ].filter((format) => format !== null)
  if (!formats.length) {
    return ''
  }

  const specific = formats.find((format) => format.known && format.extension !== 'zip')
  return (specific ?? formats[0]).label
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
 * @param {string} datasetId
 * @param {string} landModelViewerUrl
 * @returns {string}
 */
function mapHref (datasetId, landModelViewerUrl) {
  const url = new URL('/', landModelViewerUrl)
  url.searchParams.set('dataset', datasetId)
  return url.href
}

/**
 * @param {import('../common/services/geonetwork/client.js').MetadataRecord} record
 * @param {string} landModelViewerUrl
 * @returns {object}
 */
function buildViewModel (record, landModelViewerUrl) {
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
    mapHref: mapHref(record.id, landModelViewerUrl),
    serviceLinks,
    downloadLinks,
    licenceHref: licenceUrl(record.licence),
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
