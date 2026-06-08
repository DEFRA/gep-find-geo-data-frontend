import {
  createAll,
  Accordion,
  Button,
  Checkboxes,
  ErrorSummary,
  Radios,
  SkipLink
} from 'govuk-frontend'

import { initCookieBanner, initCookiesPage } from './cookie-consent.js'
import { initCopyLinks } from './copy-link.js'
import { initReadMore } from './read-more.js'
import { initSearch } from './search.js'

createAll(Accordion)
createAll(Button)
createAll(Checkboxes)
createAll(ErrorSummary)
createAll(Radios)
createAll(SkipLink)

initCookieBanner()
initCookiesPage()
initCopyLinks()
initReadMore()
initSearch()
