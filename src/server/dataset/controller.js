import Boom from '@hapi/boom'

import * as geonetwork from '../common/services/geonetwork/client.js'
import { buildViewModel } from './view-model.js'

export const datasetController = {
  async handler (request, h) {
    const { id } = request.params

    const record = await geonetwork.getRecord(id)
    if (!record) {
      throw Boom.notFound()
    }

    return h.view('dataset/index', buildViewModel(record))
  }
}
