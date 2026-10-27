import path from 'node:path'
import { readFileSync } from 'node:fs'

import { config } from '../../config.js'
import { buildNavigation } from './build-navigation.js'
import { createLogger } from '../../../server/common/helpers/logging/logger.js'

const logger = createLogger()
const assetPath = config.get('assetPath')
const manifestPath = path.join(
  config.get('root'),
  '.public/assets-manifest.json'
)

let webpackManifest

export function context (request) {
  if (!webpackManifest) {
    try {
      webpackManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
    } catch (error) {
      logger.error(error, `Webpack ${path.basename(manifestPath)} not found`)
    }
  }

  const credentials = request.auth?.credentials
  const user = credentials
    ? { id: credentials.id, displayName: credentials.displayName, email: credentials.email }
    : null

  return {
    user,
    assetPath: `${assetPath}/assets`,
    serviceName: config.get('serviceDisplayName'),
    serviceUrl: '/',
    breadcrumbs: [],
    navigation: buildNavigation(request),
    cspNonce: request.plugins?.blankie?.nonces?.script ?? null,
    googleTagManagerKey: config.get('googleAnalytics.googleTagManagerKey'),
    cookieName: config.get('cookieConsent.name'),
    currentUrl: request.path,
    getAssetPath (asset) {
      const webpackAssetPath = webpackManifest?.[asset]
      return `${assetPath}/${webpackAssetPath ?? asset}`
    }
  }
}
