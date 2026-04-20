import Accept from '@hapi/accept'

import * as geonetwork from '../common/services/geonetwork/client.js'
import { buildViewModel, parseQuery, toSearchRequest } from './view-model.js'

const BASE_PATH = '/'

export const searchController = {
  async handler (request, h) {
    const parsed = parseQuery(request.query)
    let response = { total: 0, results: [], facets: {} }
    if (!parsed.hasErrors) {
      response = await geonetwork.search(toSearchRequest(parsed))
    }

    const viewModel = buildViewModel({
      parsed,
      response,
      basePath: BASE_PATH
    })

    const mediaType = Accept.mediaType(
      request.headers.accept,
      ['text/html', 'application/json']
    )

    if (mediaType === 'application/json') {
      const [filtersHtml, resultsHtml, errorSummaryHtml, statusHtml] = await Promise.all([
        request.render('search/_filters', viewModel),
        request.render('search/_results-column', viewModel),
        request.render('search/_error-summary', viewModel),
        request.render('search/_status', viewModel)
      ])

      return h
        .response({
          partials: {
            'search-filters': filtersHtml,
            'search-results': resultsHtml,
            'search-error-summary': errorSummaryHtml,
            'search-status': statusHtml
          },
          url: viewModel.currentUrl
        })
        .type('application/json')
    }

    return h.view('search/index', viewModel)
  }
}
