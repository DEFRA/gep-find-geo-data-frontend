import { createServer } from '../../server.js'
import { config } from '../../../config/config.js'

async function startServer () {
  const server = await createServer()
  await server.start()

  const useMock = config.get('geonetwork.useMock')
  server.logger.info('Server started successfully')
  server.logger.info(
    `Access your frontend on http://localhost:${config.get('port')}`
  )
  server.logger.info(
    useMock
      ? 'GeoNetwork client: mock'
      : `GeoNetwork client: live at ${config.get('geonetwork.apiUrl')}`
  )
  server.logger.info(
    config.get('dash.useMock')
      ? 'Dash client: mock'
      : `Dash client: live at ${config.get('dash.azureAccountName')}`
  )

  return server
}

export { startServer }
