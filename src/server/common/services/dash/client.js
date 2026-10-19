import * as api from './api.js'

/**
 * @typedef {Object} DownloadResponse
 * @property {string} fileName
 */

/**
 * //@param {string} [filepath]
 * @returns {Promise<DownloadResponse>}
 */
async function downloadFile () {
  const client = api
  const downloadedFile = client.download()
  return downloadedFile
}
export { downloadFile }
