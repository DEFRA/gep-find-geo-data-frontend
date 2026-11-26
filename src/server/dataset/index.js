import Boom from '@hapi/boom'
import Validate from '@hapi/validate'

import { datasetController, downloadController, landModelDownloadController } from './controller.js'

const validateId = {
  params: Validate.object({
    id: Validate.string().guid().required()
  }),
  failAction: () => {
    throw Boom.notFound()
  }
}

// Disable ranges, Hapi serves a range by reading from 0, so a resumed download would re-read the whole file
// TODO: support range requests from Azure
const fileResponse = { ranges: false }

export const dataset = {
  plugin: {
    name: 'dataset',
    register (server) {
      server.route([
        {
          method: 'GET',
          path: '/dataset/{id}',
          options: {
            validate: validateId
          },
          ...datasetController
        },
        {
          method: 'GET',
          path: '/dataset/{id}/land-model-download',
          options: {
            validate: validateId,
            response: fileResponse
          },
          ...landModelDownloadController
        }
      ])
    }
  }
}

export const download = {
  plugin: {
    name: 'download',
    register (server) {
      server.route([
        {
          method: 'GET',
          path: '/dataset/download/{id}/{fileName}',
          options: {
            validate: {
              failAction: () => {
                throw Boom.notFound()
              }
            },
            response: fileResponse
          },
          ...downloadController
        }
      ])
    }
  }
}
