import Crumb from '@hapi/crumb'
import { config } from '../../config/config.js'

export const csrf = {
  plugin: Crumb,
  options: {
    // Limit validation to cookie preferences; other application forms use their existing handling.
    skip: (request) => request.path.startsWith(config.get('assetPath')) ||
      (request.method !== 'get' && request.path !== '/cookies'),
    cookieOptions: {
      isSecure: config.get('isProduction')
    }
  }
}
