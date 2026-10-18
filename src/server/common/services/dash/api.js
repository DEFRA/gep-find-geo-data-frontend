import { createLogger } from '../../helpers/logging/logger.js'
import { config } from '../../../../config/config.js'
import { DataLakeServiceClient } from '@azure/storage-file-datalake'
import { DefaultAzureCredential } from '@azure/identity'
import fs from 'fs'

const logger = createLogger()

function GetDataLakeServiceClientAD () {
  logger.info('Entered GetDataLakeServiceClientAD')

  const dataLakeServiceClient = new DataLakeServiceClient(
      `https://${config.get('dash.azureAccountName')}.dfs.core.windows.net`,
      new DefaultAzureCredential())

  logger.info('Created GetDataLakeServiceClientAD')

  return dataLakeServiceClient
}

/**
 * //@param {string} filepath
 */
async function postDownload () {
  const dataLakeServiceClient = GetDataLakeServiceClientAD()

  logger.info('Before getFileSystemClient')
  const fileSystemClient = dataLakeServiceClient.getFileSystemClient(`${config.get('dash.azureFileSystem')}`)
  logger.info('Completed getFileSystemClient')

  try {
    logger.info('Before getFileClient')
    const fileClient = fileSystemClient.getFileClient(`${config.get('dash.azureFilePath')}`)
    logger.info('Completed getFileClient')

    const downloadResponse = await fileClient.read()
    logger.info('Completed read')

    const downloaded = await streamToString(downloadResponse.readableStreamBody)
    logger.info('Completed streamToString')

    async function streamToString (readableStream) {
      return new Promise((resolve, reject) => {
        const chunks = []
        readableStream.on('data', (data) => {
          chunks.push(data.toString())
        })
        readableStream.on('end', () => {
          resolve(chunks.join(''))
        })
        readableStream.on('error', reject)
      })
    }

    fs.writeFile('mytestfiledownloaded.txt', downloaded, (err) => {
      if (err) throw err
    })
  } catch (err) {
    const errorCode = err?.code ?? 'NO_ERROR_CODE'
    logger.error(errorCode)
  }
}

/**
 * //@param {string} filepath
 */
async function download () {
  postDownload()
}

export { download }
