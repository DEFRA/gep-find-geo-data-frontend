import { config } from '../../config.js'

const newTabAttributes = { target: '_blank', rel: 'noreferrer noopener' }

/**
 * @param {string} [path]
 * @returns {boolean}
 */
function isSearchPath (path) {
  return path === '/search' || Boolean(path?.startsWith('/dataset/'))
}

export function buildNavigation (request) {
  return [
    {
      text: 'Home',
      href: '/',
      current: request?.path === '/'
    },
    {
      text: 'ATLAS Search',
      href: '/search',
      current: isSearchPath(request?.path)
    },
    {
      text: 'ATLAS Viewer',
      href: config.get('landModelViewerUrl')
    },
    {
      text: 'Report an issue',
      href: config.get('feedbackUrl')
    },
    {
      html: 'Guidance<span class="govuk-visually-hidden"> (opens in a new tab)</span>',
      href: config.get('guidanceUrl'),
      attributes: newTabAttributes
    }
  ]
}
