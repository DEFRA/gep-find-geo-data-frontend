const licenceUrls = new Map([
  ['open government licence', 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/'],
  ['creative commons attribution 4.0', 'https://creativecommons.org/licenses/by/4.0/']
])

/**
 * @param {string | undefined} name
 * @returns {string | null}
 */
function licenceUrl (name) {
  if (!name) {
    return null
  }
  return licenceUrls.get(name.toLowerCase()) ?? null
}

export { licenceUrl }
