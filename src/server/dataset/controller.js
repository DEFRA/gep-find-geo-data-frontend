import Boom from '@hapi/boom'

import { config } from '../../config/config.js'
import * as geonetwork from '../common/services/geonetwork/client.js'
import { buildViewModel } from './view-model.js'
import * as dash from '../common/services/dash/client.js'

export const datasetController = {
  async handler (request, h) {
    const { id } = request.params

    const record = await geonetwork.getRecord(id)
    if (!record) {
      throw Boom.notFound()
    }

    return h.view(
      'dataset/index',
      buildViewModel(record, config.get('landModelViewerUrl'))
    )
  }
}

export const downloadController = {
  async handler (request, h) {
    const { id, fileName } = request.params

    const downloadResponse = await dash.downloadFile(id, fileName)

    return h.response(downloadResponse.file).type(downloadResponse.contentType).header('Content-Disposition', `attachment; filename*=UTF-8''${downloadResponse.fileName}`)
  }
}
