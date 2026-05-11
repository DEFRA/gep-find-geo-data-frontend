/**
 * @param {string} name
 * @returns {(src: object) => string[]}
 */
function allDefaults (name) {
  return (src) => (src[name] ?? []).map((entry) => entry?.default).filter(Boolean)
}

/**
 * @param {string} name
 * @returns {(src: object) => import('./client.js').BoundingBox | null}
 */
function boundingBox (name) {
  return (src) => {
    const ring = src[name]?.[0]?.coordinates?.[0]
    if (!ring || ring.length < 4) {
      return null
    }

    const coordinates = ring.filter((point) =>
      Array.isArray(point) &&
      Number.isFinite(point[0]) &&
      Number.isFinite(point[1])
    )
    if (coordinates.length < 4) {
      return null
    }

    const longitudes = coordinates.map((point) => point[0])
    const latitudes = coordinates.map((point) => point[1])

    return {
      west: Math.min(...longitudes),
      south: Math.min(...latitudes),
      east: Math.max(...longitudes),
      north: Math.max(...latitudes)
    }
  }
}

/**
 * @param {string} name
 * @param {string} type
 * @returns {(src: object) => string | null}
 */
function datedEntry (name, type) {
  return (src) => {
    const entry = (src[name] ?? []).find((e) => e?.type === type)
    return entry?.date ?? null
  }
}

/**
 * @param {string} name
 * @param {string | null} [fallback]
 * @returns {(src: object) => string | null}
 */
function firstDefault (name, fallback = null) {
  return (src) => src[name]?.[0]?.default ?? fallback
}

/**
 * @param {string} name
 * @returns {(src: object) => string | null}
 */
function firstEmail (name) {
  return (src) => src[name]?.[0]?.email ?? null
}

/**
 * @param {string} name
 * @returns {(src: object) => string | null}
 */
function firstNestedCode (name) {
  return (src) => src[name]?.[0]?.code ?? null
}

/**
 * @param {string} name
 * @returns {(src: object) => string | null}
 */
function latestNestedDate (name) {
  return (src) => {
    const dates = (src[name] ?? [])
      .map((entry) => entry?.date)
      .filter(Boolean)
    return dates.length === 0 ? null : dates.reduce((a, b) => (a > b ? a : b))
  }
}

/**
 * @param {string} name
 * @returns {(src: object) => import('./client.js').MetadataLink[]}
 */
function linkArray (name) {
  return (src) => (src[name] ?? []).map((entry) => ({
    url: entry?.urlObject?.default ?? '',
    name: entry?.nameObject?.default ?? '',
    description: entry?.descriptionObject?.default ?? ''
  }))
}

/**
 * @param {string} inspireName
 * @param {string} otherName
 * @param {string} topicName
 * @returns {(src: object) => string[]}
 */
function keywordDefaults (inspireName, otherName, topicName) {
  return (src) => {
    const topics = new Set((src[topicName] ?? [])
      .flatMap((entry) => [entry?.default, entry?.key])
      .filter(Boolean)
      .map((value) => value.toLowerCase()))

    const structuredKeywords = [
      ...(src[inspireName] ?? []),
      ...(src[otherName] ?? [])
    ]

    const seen = new Set()
    const keywords = []
    for (const entry of structuredKeywords) {
      const value = entry?.default
      if (value) {
        const key = value.toLowerCase()
        if (!topics.has(key) && !seen.has(key)) {
          seen.add(key)
          keywords.push(value)
        }
      }
    }

    return keywords
  }
}

/**
 * @param {string} name
 * @param {Record<string, string>} valueMap
 * @returns {(src: object) => string | null}
 */
function mappedValue (name, valueMap) {
  return (src) => valueMap[src[name]] ?? null
}

/**
 * @param {string} name
 * @param {string | null} [fallback]
 * @returns {(src: object) => string | null}
 */
function objectDefault (name, fallback = null) {
  return (src) => src[name]?.default ?? fallback
}

/**
 * @param {string} name
 * @returns {(src: object) => string[]}
 */
function rawArray (name) {
  return (src) => src[name] ?? []
}

/**
 * @param {string} name
 * @returns {(src: object) => import('./client.js').TemporalExtent | null}
 */
function temporalExtent (name) {
  return (src) => {
    const entry = src[name]?.[0]
    if (!entry) {
      return null
    }
    return {
      start: entry.start?.date ?? null,
      end: entry.end?.date ?? null
    }
  }
}

export {
  allDefaults,
  boundingBox,
  datedEntry,
  firstDefault,
  firstEmail,
  firstNestedCode,
  keywordDefaults,
  latestNestedDate,
  linkArray,
  mappedValue,
  objectDefault,
  rawArray,
  temporalExtent
}
