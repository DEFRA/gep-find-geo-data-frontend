import { pino } from 'pino'

import { loggerOptions } from './logger-options.js'

const logger = pino(loggerOptions)

function createLogger () {
  return logger
}

/**
 * Log an SDK or HTTP operation without exposing request data or credentials.
 * @template T
 * @param {string} service
 * @param {string} operation
 * @param {() => Promise<T>} call
 * @returns {Promise<T>}
 */
async function logExternalCall (service, operation, call) {
  const context = { service, operation }
  const startedAt = performance.now()
  logger.debug(context, 'External API call started')
  try {
    const result = await call()
    logger.debug({
      ...context,
      durationMs: performance.now() - startedAt,
      statusCode: /** @type {{ statusCode?: number }} */ (result)?.statusCode
    }, 'External API call completed')
    return result
  } catch (error) {
    logger.debug({
      ...context,
      durationMs: performance.now() - startedAt
    }, 'External API call failed')
    throw error
  }
}

export { createLogger, logExternalCall }
