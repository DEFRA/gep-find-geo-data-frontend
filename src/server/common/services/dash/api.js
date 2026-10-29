import Boom from '@hapi/boom'
import { createLogger, logExternalCall } from '../../helpers/logging/logger.js'
import { config } from '../../../../config/config.js'
import { DataLakeServiceClient } from '@azure/storage-file-datalake'
import { DefaultAzureCredential } from '@azure/identity'
import { getRecord } from '../geonetwork/client.js'

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
 * @param {string} id
 * @param {string} fileName
 * @returns {Promise<import('./client.js').DownloadResponse>}
 */
async function postDownload (id, fileName) {
  const filePath = await GetDatasetFilepath(id, fileName)
  const dataLakeServiceClient = GetDataLakeServiceClientAD()
  const fileSystemClient = dataLakeServiceClient.getFileSystemClient(`${config.get('dash.azureFileSystem')}`)

  try {
    const fileClient = fileSystemClient.getFileClient(filePath)
    const fileProperties = await logExternalCall('Azure Data Lake', 'getProperties', () => fileClient.getProperties())
    const downloadResponse = (await logExternalCall('Azure Data Lake', 'read', () => fileClient.read())).readableStreamBody
    logger.debug('Dataset download stream opened')

    return {
      file: downloadResponse,
      contentType: fileProperties.contentType,
      fileName: filePath.split('/').slice(-1)[0]
    }
  } catch (error) {
    if (
      error.name === 'CredentialUnavailableError' ||
        error.name === 'AggregateAuthenticationError' ||
        error.name === 'AuthenticationError'
    ) {
      logger.error('No credential available. ' + error.message)
    } else if (error.code === 'Forbidden') {
      logger.error('Access denied. Check your RBAC role assignments. ' + error.message)
    } else {
      logger.error('Unexpected error:' + error.message)
    }

    throw new Error('Dash file download request failed')
  }
}

/**
 * @param {string} id
 * @param {string} fileName
 * @returns {Promise<import('./client.js').DownloadResponse>}
 */
async function download (id, fileName) {
  return postDownload(id, fileName)
}

export { download }
