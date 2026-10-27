import { ecsFormat } from '@elastic/ecs-pino-format'

import { config } from '../../../../config/config.js'

const logConfig = config.get('log')

// Only reviewed, constant event messages may reach the log output. Never add
// user input, URLs, identifiers, error messages or interpolation to this list.
const messages = new Set([
  'External API call started',
  'External API call completed',
  'External API call failed',
  'Request started',
  'Request completed',
  'Request failed',
  'server started',
  'server stopped',
  'Server started successfully',
  'GeoNetwork client: mock',
  'GeoNetwork client: live',
  'GeoNetwork search timed out',
  'GeoNetwork search request failed',
  'GeoNetwork search returned non-200',
  'Searching metadata records',
  'Metadata search completed',
  'Metadata record lookup completed',
  'Resolving dataset download link',
  'Dataset download link resolved',
  'Dataset download link not found',
  'Dataset download stream opened',
  'Azure credentials unavailable',
  'Azure access denied',
  'Azure download failed',
  'Connected to Redis server',
  'Redis connection failed',
  'Using Redis session cache',
  'Using Catbox Memory session cache',
  'Catbox Memory is for local development only, it should not be used in production!',
  'Using MOCK credential provider! This should NOT be used in real environments!',
  'Creating user session',
  'User logged in',
  'Login complete',
  'User session cleared',
  'User session stored',
  'User session refreshed',
  'Session token expired, attempting refresh',
  'Clearing user session after token refresh failure',
  'User session token refresh failed during validation',
  'Failed to resolve OIDC end_session_endpoint',
  'OIDC authorization failed',
  'OIDC pre-login failed',
  'OIDC post-login failed',
  "server doesn't support PKCE",
  'OIDC authorization redirect prepared',
  'Exchanging authorization code for tokens',
  'Using cached OIDC discovery metadata',
  'OIDC discovery metadata cached',
  'Cognito token received',
  'Failed to get Cognito Token',
  'Refreshing cognito token',
  'Cognito token has expired',
  'setting up global proxies',
  'Webpack manifest unavailable',
  'Unhandled rejection'
])

const services = new Set(['GeoNetwork', 'Azure Data Lake', 'OIDC', 'Cognito'])
const operations = new Set(['search', 'getProperties', 'read', 'discovery', 'refreshTokenGrant', 'authorizationCodeGrant', 'GetOpenIdTokenForDeveloperIdentity'])

// An allowlist also protects against new sensitive fields and nested payloads.
// No free-form strings, request objects, raw errors or externally supplied IDs.
function safeMetadata (data) {
  const safe = {}
  const statusCode = data?.statusCode ?? data?.res?.statusCode
  if (Number.isInteger(statusCode) && statusCode >= 100 && statusCode <= 599) safe.statusCode = statusCode
  for (const key of ['durationMs', 'responseTime', 'timeoutMs', 'total', 'resultCount']) {
    if (Number.isFinite(data?.[key]) && data[key] >= 0) {
      safe[key] = data[key]
    }
  }
  if (typeof data?.found === 'boolean') safe.found = data.found
  if (services.has(data?.service)) safe.service = data.service
  if (operations.has(data?.operation)) safe.operation = data.operation
  return safe
}

const format = logConfig.format === 'ecs'
  ? ecsFormat({
    serviceName: config.get('serviceName'),
    serviceVersion: config.get('serviceVersion'),
    apmIntegration: false
  })
  : { transport: { target: 'pino-pretty', options: { ignore: 'responseTime' } } }

export const loggerOptions = {
  ...format,
  enabled: logConfig.enabled,
  level: logConfig.level,
  ignorePaths: ['/health', '/favicon.ico'],
  ignoreTags: ['asset'],
  // Hapi must never attach an entire request to a child logger's bindings.
  getChildBindings: () => ({}),
  logPayload: false,
  logQueryParams: false,
  logPathParams: false,
  logRouteTags: false,
  customRequestStartMessage: () => 'Request started',
  customRequestCompleteMessage: () => 'Request completed',
  customRequestErrorMessage: () => 'Request failed',
  wrapSerializers: false,
  serializers: {
    req: () => undefined,
    res: (res) => safeMetadata({ statusCode: res?.statusCode }),
    err: () => undefined
  },
  formatters: {
    ...format.formatters,
    // Apply the same policy to child bindings and ordinary log data.
    bindings: (bindings) => format.formatters?.bindings?.(safeMetadata(bindings)) ?? safeMetadata(bindings),
    log: (data) => safeMetadata(data)
  },
  hooks: {
    // Pino child bindings can bypass bindings formatters. Filter the final
    // record too, before any output stream or pretty-print transport sees it.
    streamWrite (line) {
      const record = JSON.parse(line)
      const output = safeMetadata(record)
      const messageKey = logConfig.format === 'ecs' ? 'message' : 'msg'
      const message = record[messageKey]
      output[messageKey] = messages.has(message) ? message : 'Log details omitted'
      if (logConfig.format === 'ecs') {
        output['@timestamp'] = new Date().toISOString()
        output['log.level'] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'].includes(record['log.level']) ? record['log.level'] : 'info'
        output['ecs.version'] = '8.10.0'
        output['service.name'] = config.get('serviceName')
        output['service.version'] = config.get('serviceVersion')
      } else {
        output.time = Date.now()
        output.level = [10, 20, 30, 40, 50, 60].includes(record.level) ? record.level : 30
      }
      return JSON.stringify(output) + '\n'
    },
    logMethod (args, method) {
      const message = typeof args[0] === 'string' ? args[0] : args[1]
      // Discard interpolation arguments as they can contain arbitrary data.
      method.call(this, safeMetadata(args[0]), messages.has(message) ? message : 'Log details omitted')
    }
  },
  redact: {
    paths: logConfig.redact,
    remove: true
  },
  nesting: true
}
