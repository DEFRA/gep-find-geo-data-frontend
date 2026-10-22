import Boom from '@hapi/boom'
import { createLogger } from '../../helpers/logging/logger.js'
import { config } from '../../../../config/config.js'
import { DataLakeServiceClient } from '@azure/storage-file-datalake'
import { DefaultAzureCredential } from '@azure/identity'
import { buffer } from 'stream/consumers'
import { getRecord } from '../geonetwork/client.js'

const logger = createLogger()

/**
 * @param {string} id
 * @param {string} fileName
 * @returns {Promise<string>} filepath
 */
async function GetDatasetFilepath (id, fileName) {
  const record = await getRecord(id)
  if (!record) {
    throw Boom.notFound()
  }

  for (const link of record.links) {
    if (link['name'] === fileName) {
      const splitString = link['url'].split('/')
      const index = splitString.indexOf("gep_raw_data")

      return link['url'].slice(index)
    }
  }

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
 * @returns {Promise<object>}
 */
async function postDownload (id, fileName) {
  const filePath = await GetDatasetFilepath(id, fileName)
  const dataLakeServiceClient = GetDataLakeServiceClientAD()
  const fileSystemClient = dataLakeServiceClient.getFileSystemClient(`${config.get('dash.azureFileSystem')}`)

  try {
    const fileClient = fileSystemClient.getFileClient(filePath)
    logger.info(`Filepath ${filePath}`)
    const fileProperties = await fileClient.getProperties()

    if (fileProperties != null && fileProperties?.contentType != null) {
      logger.info(`Fileproperties content type ${fileProperties.contentType}`)
    } else {
      logger.info('FileProperties or content type does not exist')
    }

    const downloadResponse = await fileClient.read()

    if (downloadResponse.readableStreamBody) {
      const downloaded = await buffer(downloadResponse.readableStreamBody)

      return {
        body: downloaded,
        headers: {
          filename: '$fileName',
          'Content-Type': fileProperties.contentType,
          'Content-Disposition': 'attachment'
        }
      }
    }
  } catch (error) {
    if (
      error.name === 'CredentialUnavailableError' ||
        error.name === 'AggregateAuthenticationError' ||
        error.name === 'AuthenticationError'
    ) {
      logger.error('No credential available. ' + error.message)
    } else if (error.code === 'Forbidden') {
      logger.error('Access denied. Check your RBAC role assignments. ' + +error.message)
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
