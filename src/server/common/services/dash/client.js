import * as api from './api.js'

/**
 * @typedef {Object} DownloadResponse
 * @property {number} total
 */

/**
 * //@param {string} [filepath]
 * //@returns {Promise<DownloadResponse>}
 */
async function downloadFile () {
  const client = api;
  return client.download();
}
export { downloadFile }
