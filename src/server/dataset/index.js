import Boom from '@hapi/boom'
import Validate from '@hapi/validate'

import { datasetController } from './controller.js'

export const dataset = {
  plugin: {
    name: 'dataset',
    register (server) {
      server.route([
        {
          method: 'GET',
          path: '/dataset/{id}',
          options: {
            validate: {
              params: Validate.object({
                id: Validate.string().guid().required()
              }),
              failAction: () => {
                throw Boom.notFound()
              }
            }
          },
          ...datasetController
        }
      ])
    }
  }
}
