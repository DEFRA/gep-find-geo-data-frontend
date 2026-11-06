import nunjucks from 'nunjucks'

const env = new nunjucks.Environment()
const escapeFilter = env.getFilter('escape')
const urlizeFilter = env.getFilter('urlize')

/**
 * Nunjucks urlize on escaped text, with GOV.UK link styling.
 * @param {string | null | undefined} text
 * @returns {nunjucks.runtime.SafeString}
 */
function linkify (text) {
  const linked = urlizeFilter(escapeFilter(text).toString())

  return new nunjucks.runtime.SafeString(linked.replaceAll('<a href=', '<a class="govuk-link" href='))
}

export { linkify }
