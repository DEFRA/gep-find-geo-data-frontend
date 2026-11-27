import Accept from '@hapi/accept'
import Boom from '@hapi/boom'

import { config } from '../../config/config.js'
import { statusCodes } from '../common/constants/status-codes.js'
import * as geonetwork from '../common/services/geonetwork/client.js'
import { buildViewModel, canDownload, landModelKind } from './view-model.js'
import * as dash from '../common/services/dash/client.js'
import { ALL_OF_ENGLAND } from './land-model/areas.js'
import { landModelFileName, landModelFilePath } from './land-model/paths.js'
import { formats } from './land-model/downloads.js'
import { downloadErrors, missingAreaError, parseSelection, selectionUrl } from './land-model/selection.js'

const JSON_MEDIA_TYPE = 'application/json'

const landModelErrorsKey = (recordId) => `landModelErrors:${recordId}`

/**
 * @param {string} id
 * @returns {Promise<import('../common/services/geonetwork/client.js').MetadataRecord>}
 */
async function getRecordOrNotFound (id) {
  const record = await geonetwork.getRecord(id)
  if (!record) {
    throw Boom.notFound()
  }

  return record
}

const LAND_MODEL_PARTIALS = {
  'land-model-grid-size': 'dataset/land-model/_grid-size',
  'land-model-options': 'dataset/land-model/_options',
  'land-model-area': 'dataset/land-model/_area',
  'land-model-warning': 'dataset/land-model/_warning',
  'land-model-format': 'dataset/land-model/_format',
  'land-model-details': 'dataset/land-model/_details'
}

/**
 * @param {import('@hapi/hapi').Request} request
 * @param {{ landModelDownload: import('./land-model/view-model.js').LandModelDownload }} viewModel
 * @returns {Promise<{ partials: Record<string, string>, url: string }>} Rendered HTML by element id
 */
async function landModelPartials (request, viewModel) {
  const partials = await Promise.all(
    Object.entries(LAND_MODEL_PARTIALS).map(async ([id, template]) => [id, await request.render(template, viewModel)])
  )

  return {
    partials: Object.fromEntries(partials),
    url: viewModel.landModelDownload.url
  }
}

/**
 * @param {import('@hapi/hapi').ResponseObject} response
 * @param {number} [contentLength]
 * @returns {import('@hapi/hapi').ResponseObject}
 */
function withContentLength (response, contentLength) {
  if (contentLength) {
    response.header('Content-Length', String(contentLength))
  }

  return response
}

export const datasetController = {
  async handler (request, h) {
    const record = await getRecordOrNotFound(request.params.id)

    const mediaType = Accept.mediaType(
      request.headers.accept,
      ['text/html', JSON_MEDIA_TYPE]
    )
    const isJson = mediaType === JSON_MEDIA_TYPE

    const errors = landModelKind(record) && !isJson ? request.yar.flash(landModelErrorsKey(record.id)) : []
    const viewModel = buildViewModel(record, config.get('landModelViewerUrl'), { query: request.query, errors })

    if (isJson && viewModel.landModelDownload) {
      return h
        .response(await landModelPartials(request, viewModel))
        .type(JSON_MEDIA_TYPE)
    }

    return h.view('dataset/index', viewModel)
  }
}

export const downloadController = {
  async handler (request, h) {
    const { id, fileName } = request.params

    const fileStream = await dash.openDatasetFile(id, fileName)

    const response = h.response(fileStream.file).type(fileStream.contentType).header('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileStream.fileName)}`)

    return withContentLength(response, fileStream.contentLength)
  }
}

export const landModelDownloadController = {
  async handler (request, h) {
    const record = await getRecordOrNotFound(request.params.id)

    const kind = landModelKind(record)
    if (!kind || !canDownload(record)) {
      throw Boom.notFound()
    }

    const selection = parseSelection(kind, request.query)
    const redirectWithErrors = (fieldErrors) => {
      request.yar.flash(landModelErrorsKey(record.id), fieldErrors, true)
      return h.redirect(`${selectionUrl(record.id, selection)}#land-model-error-summary`)
    }

    const errors = downloadErrors(selection, request.query)
    if (errors.length) {
      return redirectWithErrors(errors)
    }

    let fileStream
    try {
      fileStream = await dash.openLandModelFile(landModelFilePath(selection))
    } catch (error) {
      if (Boom.isBoom(error, statusCodes.notFound) && selection.area !== ALL_OF_ENGLAND) {
        return redirectWithErrors([missingAreaError(selection.area)])
      }

      throw error
    }

    const response = h
      .response(fileStream.file)
      .type(formats[selection.format].contentType)
      .header('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(landModelFileName(selection))}`)

    return withContentLength(response, fileStream.contentLength)
  }
}
