import { searchController } from './controller.js'

/**
 * Sets up the routes used in the search page.
 * These routes are registered in src/server/router.js.
 */
export const search = {
  plugin: {
    name: 'search',
    register (server) {
      server.route([
        {
          method: 'GET',
          path: '/',
          ...searchController
        }
      ])
    }
  }
}
