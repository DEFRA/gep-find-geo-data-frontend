import inert from '@hapi/inert'

import { cookies } from './cookies/index.js'
import { dataset } from './dataset/index.js'
import { privacy } from './privacy/index.js'
import { accessibilityStatement } from './accessibility-statement/index.js'
import { health } from './health/index.js'
import { search } from './search/index.js'
import { serveStaticFiles } from './common/helpers/serve-static-files.js'

export const router = {
  plugin: {
    name: 'router',
    async register (server) {
      await server.register([inert])

      // Health-check route. Used by platform to check if service is running, do not remove!
      await server.register([health])

      // Application specific routes, add your own routes here
      await server.register([cookies, privacy, accessibilityStatement, search, dataset])

      // Static assets
      await server.register([serveStaticFiles])
    }
  }
}
