import * as _openid from 'openid-client'
import { config as _config } from '../../../../config/config.js'

import { oidcClient } from './oidc-client.js'

vi.mock('openid-client')
const openid = vi.mocked(_openid)

const configValues = vi.hoisted(() => ({
  'cognito.enabled': false,
  'oidc.wellKnownConfigurationUrl': 'http://localhost:8081/realms/defra-local/.well-known/openid-configuration',
  'oidc.clientId': 'test-client-id',
  log: { enabled: false, level: 'silent', format: 'pino-pretty', redact: [] },
  serviceName: 'test-service',
  serviceVersion: '1.0.0'
}))

vi.mock('../../../../config/config.js', () => ({
  config: {
    get: vi.fn((key) => configValues[key])
  }
}))
const config = vi.mocked(_config)

const mockServerMetadata = {
  supportsPKCE: () => true
}

const mockOidcConfig = {
  serverMetadata: () => mockServerMetadata
}

function createMockServer () {
  return {
    decorate: vi.fn(),
    clientAssertion: {
      getToken: vi.fn().mockResolvedValue('mock-federated-token')
    }
  }
}

function getOidcMethods (server) {
  oidcClient.plugin.register(server)
  const call = server.decorate.mock.calls.find((c) => c[1] === 'oidc')
  return call[2]
}

describe('#oidcClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    openid.discovery.mockResolvedValue(
      /** @type {import('openid-client').Configuration} */ (mockOidcConfig)
    )
    // @ts-expect-error Configuration is mocked by Vitest at runtime.
    openid.Configuration.mockImplementation(function () { return mockOidcConfig })
    config.get.mockImplementation((key) => configValues[key])
  })

  test('has the correct plugin name', () => {
    expect(oidcClient.plugin.name).toBe('oidc-client')
  })

  test('depends on client-assertion', () => {
    expect(oidcClient.plugin.dependencies).toContain('client-assertion')
  })

  test('decorates server with oidc', () => {
    const server = createMockServer()
    oidcClient.plugin.register(server)

    expect(server.decorate).toHaveBeenCalledWith(
      'server',
      'oidc',
      expect.objectContaining({
        getConfig: expect.any(Function),
        refresh: expect.any(Function),
        scope: expect.any(String)
      })
    )
  })

  test('requests base scope when cognito is disabled', () => {
    const server = createMockServer()
    const { scope } = getOidcMethods(server)

    expect(scope).toBe('openid profile email offline_access')
  })

  test('adds Graph user.read when cognito is enabled', () => {
    config.get.mockImplementation((key) => {
      if (key === 'cognito.enabled') {
        return true
      }
      return configValues[key]
    })

    const server = createMockServer()
    const { scope } = getOidcMethods(server)

    expect(scope).toBe('openid profile email offline_access user.read')
  })

  describe('getConfig', () => {
    test('calls discovery on first request, uses cache on second', async () => {
      const server = createMockServer()
      const { getConfig } = getOidcMethods(server)

      await getConfig()
      expect(openid.discovery).toHaveBeenCalledTimes(1)

      await getConfig()
      expect(openid.discovery).toHaveBeenCalledTimes(1)
      expect(openid.Configuration).toHaveBeenCalledWith(
        mockServerMetadata,
        'test-client-id',
        {},
        expect.any(Function)
      )
    })

    test('builds client authentication with the current federated assertion', async () => {
      const server = createMockServer()
      const { getConfig } = getOidcMethods(server)
      await getConfig()

      const authenticate = openid.Configuration.mock.calls[0][3]
      const body = new URLSearchParams()
      authenticate({}, { client_id: 'test-client-id' }, body)

      expect(Object.fromEntries(body)).toEqual({
        client_id: 'test-client-id',
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: 'mock-federated-token'
      })
    })

    test('refreshes discovery metadata after the cache expires', async () => {
      const now = vi.spyOn(Date, 'now').mockReturnValue(1000)
      try {
        const { getConfig } = getOidcMethods(createMockServer())
        await getConfig()
        now.mockReturnValue(1000 + 60 * 60 * 1000 + 1)
        await getConfig()
        expect(openid.discovery).toHaveBeenCalledTimes(2)
      } finally {
        now.mockRestore()
      }
    })

    test('shares discovery across concurrent configuration requests', async () => {
      let resolveDiscovery
      openid.discovery.mockReturnValue(new Promise((resolve) => { resolveDiscovery = resolve }))
      const { getConfig } = getOidcMethods(createMockServer())
      const first = getConfig()
      const second = getConfig()
      await vi.waitFor(() => expect(openid.discovery).toHaveBeenCalledOnce())
      resolveDiscovery(mockOidcConfig)
      await Promise.all([first, second])
      expect(openid.discovery).toHaveBeenCalledOnce()
    })

    test('retries discovery after a failed request', async () => {
      const error = new Error('Discovery unavailable')
      openid.discovery.mockRejectedValueOnce(error)
      const { getConfig } = getOidcMethods(createMockServer())
      await expect(getConfig()).rejects.toBe(error)
      await expect(getConfig()).resolves.toBe(mockOidcConfig)
      expect(openid.discovery).toHaveBeenCalledTimes(2)
    })

    test('applies execute functions when using cached metadata', async () => {
      const server = createMockServer()
      const { getConfig } = getOidcMethods(server)

      await getConfig()
      await getConfig()

      expect(openid.allowInsecureRequests).toHaveBeenCalledWith(mockOidcConfig)
    })

    test('omits execute when cognito is enabled', async () => {
      config.get.mockImplementation((key) => {
        if (key === 'cognito.enabled') {
          return true
        }
        return configValues[key]
      })

      const server = createMockServer()
      const { getConfig } = getOidcMethods(server)

      await getConfig()

      expect(openid.discovery).toHaveBeenCalledWith(
        expect.any(URL),
        'test-client-id',
        {},
        expect.any(Function),
        {}
      )
    })
  })

  describe('refresh', () => {
    test('gets federated token and calls refreshTokenGrant', async () => {
      const mockResponse = { access_token: 'new-token', token_type: 'bearer' }
      // @ts-expect-error The mocked token response only includes fields used by this unit test.
      openid.refreshTokenGrant.mockResolvedValue(mockResponse)

      const server = createMockServer()
      const { refresh } = getOidcMethods(server)

      const result = await refresh('old-refresh-token')

      expect(server.clientAssertion.getToken).toHaveBeenCalled()
      expect(openid.refreshTokenGrant).toHaveBeenCalledWith(
        mockOidcConfig,
        'old-refresh-token',
        { scope: 'openid profile email offline_access' }
      )
      expect(result).toBe(mockResponse)
    })
  })
})
