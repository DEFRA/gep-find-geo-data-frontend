import { Readable } from 'node:stream'
import Boom from '@hapi/boom'

import { getRecord } from '../geonetwork/client.js'

// The last two in the select to test failure paths
const MISSING_AREA = 'TR'
const FAILING_AREA = 'TV'

/**
 * @param {string} fileName
 * @returns {import('./client.js').FileStream}
 */
function placeholder (fileName) {
  const body = `Mock download of ${fileName}\n`
  return {
    file: Readable.from([Buffer.from(body)], { objectMode: false }),
    contentType: 'text/plain',
    contentLength: Buffer.byteLength(body),
    fileName
  }
}

/**
 * @param {string} id
 * @param {string} fileName
 * @returns {Promise<import('./client.js').FileStream>}
 */
async function openDatasetFile (id, fileName) {
  const record = await getRecord(id)
  if (!record?.links?.some((link) => link.name === fileName)) {
    throw Boom.notFound()
  }

  return placeholder(fileName)
}

/**
 * @param {string} filePath
 * @returns {Promise<import('./client.js').FileStream>}
 */
async function openLandModelFile (filePath) {
  const parts = filePath.split('/')
  const fileName = parts.pop()
  const area = parts.pop()
  if (area === MISSING_AREA) {
    throw Boom.notFound()
  } else if (area === FAILING_AREA) {
    throw new Error('Dash file download request failed')
  } else {
    return placeholder(fileName)
  }
}

export { openDatasetFile, openLandModelFile }
