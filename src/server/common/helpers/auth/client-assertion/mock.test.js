import jwt from '@hapi/jwt'

import { mockClientAssertion } from './mock.js'

describe('#mockClientAssertion', () => {
  test('plugin name is client-assertion', () => {
    expect(mockClientAssertion.plugin.name).toBe('client-assertion')
  })

  test('decorates server with clientAssertion', () => {
    const server = { decorate: vi.fn() }

    mockClientAssertion.plugin.register(server)

    expect(server.decorate).toHaveBeenCalledWith(
      'server', 'clientAssertion', expect.any(Object)
    )
  })

  test('getToken returns a signed JWT with correct claims', async () => {
    const server = { decorate: vi.fn() }

    mockClientAssertion.plugin.register(server)

    const provider = server.decorate.mock.calls[0][2]
    const token = await provider.getToken()
    const decoded = jwt.token.decode(token)
    const payload = decoded.decoded.payload

    expect(payload.iss).toBe('26372ac9-d8f0-4da9-a17e-938eb3161d8e')
    expect(payload.sub).toBe('26372ac9-d8f0-4da9-a17e-938eb3161d8e')
    expect(payload.aud).toBe('http://localhost:8081/realms/defra-local')
    expect(payload.jti).toBeDefined()
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
  })
})
