import { createLogger } from '../../helpers/logging/logger.js'
import { config } from '../../../../config/config.js';
import { DataLakeServiceClient } from '@azure/storage-file-datalake';
import { DefaultAzureCredential } from '@azure/identity';

const logger = createLogger()

function GetDataLakeServiceClientAD() {
  logger.info("Entered GetDataLakeServiceClientAD");

  const dataLakeServiceClient = new DataLakeServiceClient(
      `https://${config.get('dash.azureAccountName')}.dfs.core.windows.net`,
      new DefaultAzureCredential());

  logger.info("Created GetDataLakeServiceClientAD");

  return dataLakeServiceClient;
}

/**
 * @param {string} filepath
 */
async function postDownload (filepath) {

  const dataLakeServiceClient = GetDataLakeServiceClientAD();
  const fileSystemClient = dataLakeServiceClient.getFileSystemClient('invalid_data');

  try {
    const fileClient = fileSystemClient.getFileClient(filepath);

    const downloadResponse = await fileClient.read();

    const downloaded = await streamToString(downloadResponse.readableStreamBody);

    async function streamToString(readableStream) {
      return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (data) => {
          chunks.push(data.toString());
        });
        readableStream.on("end", () => {
          resolve(chunks.join(""));
        });
        readableStream.on("error", reject);
      });
    }

    const fs = require('fs');

    fs.writeFile('mytestfiledownloaded.txt', downloaded, (err) => {
      if (err) throw err;
    });
    
  } catch (err) {
    const errorCode = err?.code ?? 'NO_ERROR_CODE'
  }
}

/**
 * @param {string} filepath
 */
async function download (filepath) {
  logger.info("Entered download in api");
  postDownload(filepath);
}

export { download }
