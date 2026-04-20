import {
  createAll,
  Button,
  Checkboxes,
  ErrorSummary,
  Radios,
  SkipLink
} from 'govuk-frontend'

import { initCookieBanner, initCookiesPage } from './cookie-consent.js'
import { initSearch } from './search.js'

createAll(Button)
createAll(Checkboxes)
createAll(ErrorSummary)
createAll(Radios)
createAll(SkipLink)

initCookieBanner()
initCookiesPage()
initSearch()
