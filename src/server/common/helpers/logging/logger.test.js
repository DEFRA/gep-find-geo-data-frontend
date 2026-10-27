import { vi } from 'vitest'

const { debug } = vi.hoisted(() => ({ debug: vi.fn() }))
vi.mock('pino', () => ({ pino: () => ({ debug }) }))
vi.mock('./logger-options.js', () => ({ loggerOptions: {} }))

const { createLogger, logExternalCall } = await import('./logger.js')

describe('logExternalCall', () => {
  test('preserves the response and logs timing and HTTP status without payloads', async () => {
    const response = { statusCode: 200, token: 'secret' }
    await expect(logExternalCall('test', 'request', async () => response)).resolves.toBe(response)
    expect(debug).toHaveBeenNthCalledWith(1, { service: 'test', operation: 'request' }, 'External API call started')
    expect(debug).toHaveBeenNthCalledWith(2, {
      service: 'test', operation: 'request', durationMs: expect.any(Number), statusCode: 200
    }, 'External API call completed')
    expect(JSON.stringify(debug.mock.calls)).not.toContain('secret')
  })

  test('rethrows the original error and logs safe failure metadata', async () => {
    const error = Object.assign(new Error('sensitive response'), { code: 'ECONNRESET' })
    await expect(logExternalCall('test', 'request', async () => { throw error })).rejects.toBe(error)
    expect(debug).toHaveBeenLastCalledWith({
      service: 'test',
      operation: 'request',
      durationMs: expect.any(Number)
    }, 'External API call failed')
    expect(JSON.stringify(debug.mock.calls)).not.toContain('sensitive response')
  })
})

describe('createLogger', () => {
  test('returns the shared application logger', () => {
    expect(createLogger()).toBe(createLogger())
    expect(createLogger().debug).toBe(debug)
  })
})
