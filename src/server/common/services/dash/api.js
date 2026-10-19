import { createLogger } from '../../helpers/logging/logger.js'
import { config } from '../../../../config/config.js'
import { DataLakeServiceClient } from '@azure/storage-file-datalake'
import { DefaultAzureCredential } from '@azure/identity'
import fs from 'fs'
import { buffer } from 'stream/consumers'

const logger = createLogger()

function GetDataLakeServiceClientAD () {

  const dataLakeServiceClient = new DataLakeServiceClient(
      `https://${config.get('dash.azureAccountName')}.dfs.core.windows.net`,
      new DefaultAzureCredential())

  logger.info('Created GetDataLakeServiceClientAD')

  return dataLakeServiceClient
}

/**
 * //@param {string} filepath
 * @returns {Promise<object>}
 */
async function postDownload () {
  const dataLakeServiceClient = GetDataLakeServiceClientAD()

  const fileSystemClient = dataLakeServiceClient.getFileSystemClient(`${config.get('dash.azureFileSystem')}`)
  logger.info('Completed getFileSystemClient')

  try {
    const fileClient = fileSystemClient.getFileClient(`${config.get('dash.azureFilePath')}`)
    logger.info('Completed getFileClient')

    const downloadResponse = await fileClient.read()
    logger.info('Completed read')

    if (downloadResponse.readableStreamBody) {
      const downloaded = await buffer(downloadResponse.readableStreamBody);
      logger.info("Downloaded file content:" + downloaded.toString());  
      return downloaded;
    }
    
  } catch (error) {
    if (
        error.name === "CredentialUnavailableError" ||
        error.name === "AggregateAuthenticationError" ||
        error.name === "AuthenticationError"
    ) {
        logger.error("No credential available. " + error.message);
    } else if (error.code === "Forbidden") {
        logger.error("Access denied. Check your RBAC role assignments. " + + error.message);
    } else {
        logger.error("Unexpected error:" + error.message);
    }

    throw new Error('Dash file download request failed')
  }
}

/**
 * //@param {string} filepath
 * @returns {Promise<import('./client.js').DownloadResponse>}
 */
async function download () {
  return postDownload()
}

export { download }
