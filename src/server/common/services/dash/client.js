import * as api from './api.js'

/**
 * @typedef {Object} DownloadResponse
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
