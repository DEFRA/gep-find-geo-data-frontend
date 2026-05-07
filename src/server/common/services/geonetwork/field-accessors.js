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
 * @param {Record<string, string>} valueMap
 * @returns {(src: object) => string | null}
 */
function mappedValue (name, valueMap) {
  return (src) => valueMap[src[name]] ?? null
}

export { firstDefault, latestNestedDate, mappedValue, objectDefault }
