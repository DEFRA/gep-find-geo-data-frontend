import { load } from 'cheerio'

import { config } from '../../config/config.js'
import { createServer } from '../server.js'
import { statusCodes } from '../common/constants/status-codes.js'
import { mockAuthCredentials } from '../common/test-helpers/auth.js'

const guidanceUrl = config.get('guidanceUrl')

describe('#homeController', () => {
  let server
  let $
  let statusCode

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()

    const response = await server.inject({
      method: 'GET',
      url: '/',
      auth: mockAuthCredentials
    })
    statusCode = response.statusCode
    $ = load(response.result)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('renders the hub page', () => {
    expect(statusCode).toBe(statusCodes.ok)
    expect($('title').text()).toContain('Home | ATLAS - Defra Group')
    expect($('h1').text()).toBe('Find and use Defra Group geospatial data')
  })

  test('links to the configured services', () => {
    const hrefs = $('main a').map((_i, el) => $(el).attr('href')).get()

    expect(hrefs).toEqual(expect.arrayContaining([
      '/search',
      config.get('landModelViewerUrl'),
      config.get('feedbackUrl'),
      guidanceUrl,
      `mailto:${config.get('contactEmail')}`
    ]))
  })

  test('opens guidance in a new tab', () => {
    const guidance = $(`main a[href="${guidanceUrl}"]`)

    expect(guidance.attr('target')).toBe('_blank')
    expect(guidance.attr('rel')).toBe('noreferrer noopener')
    expect(guidance.text()).toContain('(opens in a new tab)')
  })
})
