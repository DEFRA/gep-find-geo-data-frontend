import { ClientSecretCredential } from '@azure/identity'
import { createHttpHeaders } from '@azure/core-rest-pipeline'
import { vi } from 'vitest'

// Use the real Identity and MSAL packages to exercise their scoped dependency
// override. The injected HTTP client keeps credentials and requests local.
test('Azure Identity acquires a storage token with the overridden MSAL dependency', async () => {
  const tenant = '11111111-1111-4111-8111-111111111111'
  const clientId = '22222222-2222-4222-8222-222222222222'
  const authority = `https://login.microsoftonline.com/${tenant}`
  const sendRequest = vi.fn(async (request) => {
    const path = new URL(request.url).pathname
    let body
    if (path.endsWith('/.well-known/openid-configuration')) {
      body = {
        issuer: `${authority}/v2.0`,
        authorization_endpoint: `${authority}/oauth2/v2.0/authorize`,
        token_endpoint: `${authority}/oauth2/v2.0/token`,
        jwks_uri: `${authority}/discovery/v2.0/keys`
      }
    } else if (path === `/${tenant}/oauth2/v2.0/token`) {
      expect(request.method).toBe('POST')
      body = { token_type: 'Bearer', expires_in: 3600, access_token: 'test-only-access-token' }
    } else {
      throw new Error('Unexpected SDK request')
    }
    return {
      request,
      status: 200,
      headers: createHttpHeaders({ 'content-type': 'application/json' }),
      bodyAsText: JSON.stringify(body)
    }
  })
  const credential = new ClientSecretCredential(tenant, clientId, 'test-only-secret', {
    disableInstanceDiscovery: true,
    httpClient: { sendRequest }
  })

  const token = await credential.getToken('https://storage.azure.com/.default')

  expect(token.token).toBe('test-only-access-token')
  expect(token.expiresOnTimestamp).toBeGreaterThan(Date.now())
  expect(sendRequest).toHaveBeenCalledWith(expect.objectContaining({
    method: 'POST',
    url: expect.stringContaining(`/${tenant}/oauth2/v2.0/token`)
  }))
})
