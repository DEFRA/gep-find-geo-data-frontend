import { pino } from 'pino'
import { Writable } from 'node:stream'
import hapi from '@hapi/hapi'
import hapiPino from 'hapi-pino'
import { vi } from 'vitest'

const settings = vi.hoisted(() => ({ format: 'ecs' }))
vi.mock('../../../../config/config.js', () => ({
  config: {
    get: (key) => ({
      log: { enabled: true, level: 'trace', format: settings.format, redact: [] },
      serviceName: 'test-service',
      serviceVersion: '1.0.0'
    })[key]
  }
}))

const secret = 'sensitive-person@example.com-secret-password'

async function captureLogger (format) {
  settings.format = format
  vi.resetModules()
  const { loggerOptions } = await import('./logger-options.js')
  const lines = []
  const stream = new Writable({ write (chunk, encoding, callback) { lines.push(chunk.toString()); callback() } })
  // Capture JSON before the optional pretty transport; both share the policy.
  const logger = pino({ ...loggerOptions, transport: undefined }, stream)
  return { logger, loggerOptions, lines }
}

describe.each(['ecs', 'pino-pretty'])('logging privacy in %s', (format) => {
  test.each(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])('filters sensitive data at %s level', async (level) => {
    const { logger, lines } = await captureLogger(format)
    const error = Object.assign(new Error(secret), { code: secret, name: secret, credentials: secret })
    const data = {
      email: secret,
      user: { id: secret, displayName: secret },
      password: secret,
      accessToken: secret,
      refresh_token: secret,
      client_assertion: secret,
      headers: { authorization: secret, cookie: secret, 'set-cookie': secret },
      url: `https://user:${secret}@example.com/?code=${secret}`,
      query: { q: secret },
      payload: { value: secret },
      responseBody: secret,
      err: error,
      nested: { arbitrary: secret },
      service: secret,
      operation: secret,
      durationMs: secret,
      statusCode: secret,
      found: secret
    }
    logger[level](data, 'External API call failed')
    logger[level](error, secret)
    logger[level](secret)
    logger[level]('Request completed', secret)
    logger.child(data)[level](data, secret)
    logger[level]({ ...data, msg: secret, message: secret }, 'Request completed')

    expect(lines).toHaveLength(6)
    const output = lines.join('')
    expect(output).not.toContain(secret)
    expect(output).not.toContain('credentials')
    expect(output).not.toContain('headers')
    expect(output).not.toContain('responseBody')
    expect(output).toContain('Log details omitted')
    expect(output).toContain('External API call failed')
  })

  test('keeps approved operational metadata and drops non-finite values', async () => {
    const { logger, lines } = await captureLogger(format)
    logger.debug({
      service: 'GeoNetwork',
      operation: 'search',
      statusCode: 200,
      durationMs: 12.5,
      total: 10,
      resultCount: 5,
      found: false,
      timeoutMs: Infinity,
      responseTime: -1
    }, 'External API call completed')
    expect(JSON.parse(lines[0])).toMatchObject({
      service: 'GeoNetwork',
      operation: 'search',
      statusCode: 200,
      durationMs: 12.5,
      total: 10,
      resultCount: 5,
      found: false
    })
    expect(lines[0]).not.toContain('timeoutMs')
    expect(lines[0]).not.toContain('responseTime')
  })

  test('omits SDK and authentication secrets from HTTP success and error logging', async () => {
    const { loggerOptions, lines } = await captureLogger(format)
    const stream = new Writable({ write (chunk, encoding, callback) { lines.push(chunk.toString()); callback() } })
    const server = hapi.server({ debug: false })
    await server.register({ plugin: hapiPino, options: { ...loggerOptions, transport: undefined, stream, logRequestStart: true } })
    server.route({
      method: 'POST',
      path: '/test/{name}',
      handler: (request, h) => {
        request.logger.info({ credentials: request.payload, err: new Error(secret) }, secret)
        request.log(['error'], new Error(secret))
        if (request.query.fail) throw new Error(secret)
        return h.response('ok').header('set-cookie', `session=${secret}`)
      }
    })
    try {
      await server.initialize()
      for (const suffix of ['', '&fail=true']) {
        await server.inject({
          method: 'POST',
          url: `/test/${secret}?code=${secret}${suffix}`,
          headers: { authorization: `Bearer ${secret}`, cookie: `session=${secret}`, 'x-cdp-request-id': secret },
          payload: { email: secret, password: secret }
        })
      }
      const output = lines.join('')
      expect(output).not.toContain(secret)
      expect(output).not.toContain('/test/')
      expect(output).not.toContain('authorization')
      expect(output).toContain('Request completed')
      expect(output).toContain('500')
    } finally {
      await server.stop()
    }
  })

  test('uses safe request messages and serializers even on error responses', async () => {
    const { loggerOptions } = await captureLogger(format)
    expect(loggerOptions.getChildBindings()).toEqual({})
    expect(loggerOptions.customRequestStartMessage()).toBe('Request started')
    expect(loggerOptions.customRequestCompleteMessage()).toBe('Request completed')
    expect(loggerOptions.customRequestErrorMessage()).toBe('Request failed')
    expect(loggerOptions.serializers.req()).toBeUndefined()
    expect(loggerOptions.serializers.err()).toBeUndefined()
    expect(loggerOptions.serializers.res({ statusCode: 500, headers: { cookie: secret } })).toEqual({ statusCode: 500 })
  })
})
