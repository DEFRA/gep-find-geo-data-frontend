import * as api from './api.js'
import * as mock from './mock.js'
import { config } from '../../../../config/config.js'

/**
 * @typedef {Object} FileStream
 * @property {import('@azure/storage-file-datalake').NodeJSReadableStream} file
 * @property {string} contentType
 * @property {number} [contentLength]
 * @property {string} fileName
 */

function client () {
  return config.get('dash.useMock') ? mock : api
}

/**
 * Rejects with a Boom 404 when the file does not exist.
 * @param {string} [id]
 * @param {string} [fileName]
 * @returns {Promise<FileStream>}
 */
async function openDatasetFile (id, fileName) {
  return client().openDatasetFile(id, fileName)
}

/**
 * Rejects with a Boom 404 when the file does not exist.
 * @param {string} filePath Relative to the land model data folder.
 * @returns {Promise<FileStream>}
 */
async function openLandModelFile (filePath) {
  return client().openLandModelFile(filePath)
}

export { openDatasetFile, openLandModelFile }
