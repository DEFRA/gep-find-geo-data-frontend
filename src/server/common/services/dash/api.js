import Boom from '@hapi/boom'
import { createLogger, logExternalCall } from '../../helpers/logging/logger.js'
import { config } from '../../../../config/config.js'
import { DataLakeServiceClient } from '@azure/storage-file-datalake'
import { DefaultAzureCredential } from '@azure/identity'
import { getRecord } from '../geonetwork/client.js'

const LAND_MODEL_DATA_PATH = 'land_model_data'

const logger = createLogger()

/**
 * @param {string} id
 * @param {string} fileName
 * @returns {Promise<string>} filepath
 */
async function GetDatasetFilepath (id, fileName) {
  logger.debug('Resolving dataset download link')
  const record = await getRecord(id)
  if (!record) {
    throw Boom.notFound()
  }

  for (const link of record.links) {
    if (link['name'] === fileName) {
      const splitString = link['url'].split('/')
      const index = splitString.indexOf('gep_raw_data')

      logger.debug('Dataset download link resolved')
      return decodeURIComponent(splitString.slice(index).join('/'))
    }
  }

  logger.debug('Dataset download link not found')
  return 'Dash file link not found'
}

function GetDataLakeServiceClientAD () {
  const dataLakeServiceClient = new DataLakeServiceClient(
      `https://${config.get('dash.azureAccountName')}.dfs.core.windows.net`,
      new DefaultAzureCredential())

  return dataLakeServiceClient
}

/**
 * @param {{ details?: { errorCode?: string } }} error
 * @returns {boolean}
 */
function isFileNotFound (error) {
  return error.details?.errorCode === 'BlobNotFound'
}

/**
 * @param {string} filePath
 * @returns {Promise<import('./client.js').FileStream>}
 */
async function streamFile (filePath) {
  const dataLakeServiceClient = GetDataLakeServiceClientAD()
  const fileSystemClient = dataLakeServiceClient.getFileSystemClient(`${config.get('dash.azureFileSystem')}`)

  try {
    const fileClient = fileSystemClient.getFileClient(filePath)
    const readResponse = await logExternalCall('Azure Data Lake', 'read', () => fileClient.read())
    logger.debug('Dataset download stream opened')

    return {
      file: readResponse.readableStreamBody,
      contentType: readResponse.contentType,
      contentLength: readResponse.contentLength,
      fileName: filePath.split('/').slice(-1)[0]
    }
  } catch (error) {
    if (isFileNotFound(error)) {
      logger.info('Dash file not found')
      throw Boom.notFound()
    } else if (
      error.name === 'CredentialUnavailableError' ||
        error.name === 'AggregateAuthenticationError' ||
        error.name === 'AuthenticationError'
    ) {
      logger.error(error, 'No credential available')
    } else if (error.code === 'Forbidden') {
      logger.error(error, 'Access denied. Check your RBAC role assignments')
    } else {
      logger.error(error, 'Dash file download request failed')
    }

    throw new Error('Dash file download request failed')
  }
}

/**
 * @param {string} id
 * @param {string} fileName
 * @returns {Promise<import('./client.js').FileStream>}
 */
async function openDatasetFile (id, fileName) {
  return streamFile(await GetDatasetFilepath(id, fileName))
}

/**
 * @param {string} filePath Relative to the land model data folder.
 * @returns {Promise<import('./client.js').FileStream>}
 */
async function openLandModelFile (filePath) {
  return streamFile(`${LAND_MODEL_DATA_PATH}/${filePath}`)
}

export { openDatasetFile, openLandModelFile }
