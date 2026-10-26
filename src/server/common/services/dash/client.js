import * as api from './api.js'

/**
 * @typedef {Object} DownloadResponse
 * @property {import('@azure/storage-file-datalake').NodeJSReadableStream} file
 * @property {string} contentType
 */

/**
 * @param {string} [id]
 * @param {string} [fileName]
 * @returns {Promise<DownloadResponse>}
 */
async function downloadFile (id, fileName) {
  const client = api
  return client.download(id, fileName)
}
export { downloadFile }
