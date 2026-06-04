import { subDays, subMonths } from 'date-fns'

import { formatDate } from '../../../../config/nunjucks/filters/format-date.js'

/**
 * @typedef {{ day: string, month: string, year: string }} DateParts
 *
 * @typedef DateInput
 * @property {'last30Days' | 'last12Months' | 'since' | 'period' | null} mode
 * @property {DateParts} sinceDate
 * @property {string} fromYear
 * @property {string} toYear
 *
 * @typedef {{ message: string, missing: string[] }} DateFieldError
 * @typedef {Partial<Record<'sinceDate'|'fromYear'|'toYear', DateFieldError>>} DateErrors
 */

const MODE_SINCE = 'since'
const MODE_PERIOD = 'period'

const RELATIVE_RANGES = [
  { value: 'last30Days', label: 'Last 30 days', from: (now) => subDays(now, 30) },
  { value: 'last12Months', label: 'Last 12 months', from: (now) => subMonths(now, 12) }
]
const relativeRange = (mode) => RELATIVE_RANGES.find((r) => r.value === mode)

const VALID_DATE_MODES = new Set([
  ...RELATIVE_RANGES.map((r) => r.value),
  MODE_SINCE,
  MODE_PERIOD
])

const SINCE_DATE = 'sinceDate'
const FROM_YEAR = 'fromYear'
const TO_YEAR = 'toYear'

const DAY = 'day'
const MONTH = 'month'
const YEAR = 'year'
const DATE_PART_NAMES = [DAY, MONTH, YEAR]
const EMPTY_PARTS = { day: '', month: '', year: '' }

const MIN_YEAR = 1900

function readDateParts (rawQuery, prefix) {
  const read = (part) => {
    const v = rawQuery[`${prefix}-${part}`]
    return typeof v === 'string' ? v : ''
  }
  return { day: read(DAY), month: read(MONTH), year: read(YEAR) }
}

function readString (rawQuery, name) {
  const v = rawQuery[name]
  return typeof v === 'string' ? v.trim() : ''
}

function partsToDate (parts) {
  const d = Number.parseInt(parts.day, 10)
  const m = Number.parseInt(parts.month, 10)
  const y = Number.parseInt(parts.year, 10)
  if (!Number.isFinite(d) || !Number.isFinite(m) || !Number.isFinite(y)) {
    return null
  }

  const date = new Date(Date.UTC(y, m - 1, d))
  if (
    date.getUTCDate() !== d ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCFullYear() !== y
  ) {
    return null
  }
  return date
}

function formatParts (parts) {
  const date = partsToDate(parts)
  return date ? formatDate(date) : null
}

function isValidYear (value) {
  if (!/^\d{4}$/.test(value)) {
    return false
  }
  return Number.parseInt(value, 10) >= MIN_YEAR
}

function parseOptionalYear (value) {
  return value === '' ? null : Number.parseInt(value, 10)
}

const hasAnyParts = (parts) => Object.values(parts).some((v) => v !== '')
const hasAnyPeriodParts = (input) => input.fromYear !== '' || input.toYear !== ''

/**
 * @param {DateParts} parts
 * @param {{ label: string, required: boolean, emptyMessage?: string, invalidMessage: string }} config
 */
function validateSingleDate (parts, { label, required, emptyMessage, invalidMessage }) {
  const missing = DATE_PART_NAMES.filter((k) => parts[k] === '')
  if (missing.length === 3) {
    if (!required) {
      return null
    }
    return { message: emptyMessage, missing }
  }
  if (missing.length > 0) {
    return {
      message: `${label} must include a ${missing.join(' and ')}`,
      missing
    }
  }
  if (!partsToDate(parts)) {
    return {
      message: invalidMessage,
      missing: [...DATE_PART_NAMES]
    }
  }
  return null
}

function validateSinceDate (input) {
  const err = validateSingleDate(input.sinceDate, {
    label: 'Date',
    required: true,
    emptyMessage: 'Enter a date',
    invalidMessage: 'Date must be a real date'
  })
  if (err) {
    return { sinceDate: err }
  }

  const date = partsToDate(input.sinceDate)
  if (date.getTime() > Date.now()) {
    return {
      sinceDate: { message: 'Date must be today or in the past', missing: [...DATE_PART_NAMES] }
    }
  }
  return {}
}

function validatePeriod (input) {
  const errors = {}
  const fromYear = parseOptionalYear(input.fromYear)
  const toYear = parseOptionalYear(input.toYear)

  if (input.fromYear !== '' && !isValidYear(input.fromYear)) {
    errors.fromYear = { message: `From year must be a 4-digit year from ${MIN_YEAR} onwards`, missing: [] }
  }
  if (input.toYear !== '' && !isValidYear(input.toYear)) {
    errors.toYear = { message: `To year must be a 4-digit year from ${MIN_YEAR} onwards`, missing: [] }
  }

  const bothYearsValid =
    !errors.fromYear && !errors.toYear &&
    fromYear !== null && toYear !== null

  if (bothYearsValid && fromYear > toYear) {
    errors.toYear = {
      message: 'To year must be the same as or after from year',
      missing: []
    }
  }
  return errors
}

function yearStartIso (year) {
  return new Date(Date.UTC(year, 0, 1)).toISOString()
}

/**
 * Converts an inclusive toYear into the exclusive upper query bound.
 *
 * Period filters treat toYear as a whole year, but the search query uses a
 * date < to range, so the upper bound must be the start of the following year.
 *
 * @param {number} year
 * @returns {string} ISO date string
 */
function yearEndExclusiveIso (year) {
  return yearStartIso(year + 1)
}

function periodRange (input) {
  const fromYear = parseOptionalYear(input.fromYear)
  const toYear = parseOptionalYear(input.toYear)

  if (fromYear === null && toYear === null) {
    return null
  }

  if (fromYear === null) {
    return { to: yearEndExclusiveIso(toYear) }
  }

  if (toYear === null) {
    return { from: yearStartIso(fromYear) }
  }

  return { from: yearStartIso(fromYear), to: yearEndExclusiveIso(toYear) }
}

function buildUpdatedAtBetween (input) {
  const relative = relativeRange(input.mode)
  if (relative) {
    return { from: relative.from(new Date()).toISOString() }
  }
  if (input.mode === MODE_SINCE) {
    const date = partsToDate(input.sinceDate)
    if (!date) {
      return null
    }
    return { from: date.toISOString() }
  }
  if (input.mode === MODE_PERIOD) {
    return periodRange(input)
  }
  return null
}

function appendDateParts (params, parts, prefix) {
  for (const name of DATE_PART_NAMES) {
    if (parts[name] !== '') {
      params.set(`${prefix}-${name}`, parts[name])
    }
  }
}

function dateInputItems (parts, error) {
  const missing = new Set(error?.missing ?? [])
  const widthClass = (name) => name === YEAR ? 'govuk-input--width-3' : 'govuk-input--width-2'
  const errorSuffix = (name) => missing.has(name) ? ' govuk-input--error' : ''
  return DATE_PART_NAMES.map((name) => ({
    classes: widthClass(name) + errorSuffix(name),
    name,
    label: name.charAt(0).toUpperCase() + name.slice(1),
    value: parts[name]
  }))
}

function buildDateInputParams (namePrefix, parts, legend, error) {
  const params = {
    id: namePrefix,
    namePrefix,
    fieldset: { legend },
    hint: { text: 'For example, 28 2 2024' },
    items: dateInputItems(parts, error)
  }
  if (error) {
    params.errorMessage = { text: error.message }
  }
  return params
}

function parse (rawQuery) {
  const sinceDate = readDateParts(rawQuery, SINCE_DATE)
  const fromYear = readString(rawQuery, FROM_YEAR)
  const toYear = readString(rawQuery, TO_YEAR)

  let mode = VALID_DATE_MODES.has(rawQuery.dateMode) ? rawQuery.dateMode : null
  if (!mode) {
    if (hasAnyParts(sinceDate)) {
      mode = MODE_SINCE
    } else if (fromYear !== '' || toYear !== '') {
      mode = MODE_PERIOD
    } else {
      mode = null
    }
  }

  return { mode, sinceDate, fromYear, toYear }
}

function validate (input) {
  if (input.mode === MODE_SINCE) {
    return validateSinceDate(input)
  }
  if (input.mode === MODE_PERIOD) {
    return validatePeriod(input)
  }
  return {}
}

function applyFilter (filters, input, errors) {
  if (Object.keys(errors).length > 0) {
    return
  }
  const range = buildUpdatedAtBetween(input)
  if (range) {
    filters.updatedAtBetween = range
  }
}

function appendToParams (params, input) {
  if (!input.mode) {
    return
  }
  if (relativeRange(input.mode)) {
    params.set('dateMode', input.mode)
  } else if (input.mode === MODE_SINCE) {
    params.set('dateMode', input.mode)
    appendDateParts(params, input.sinceDate, SINCE_DATE)
  } else {
    if (!hasAnyPeriodParts(input)) {
      return
    }
    params.set('dateMode', input.mode)
    if (input.fromYear !== '') {
      params.set(FROM_YEAR, input.fromYear)
    }
    if (input.toYear !== '') {
      params.set(TO_YEAR, input.toYear)
    }
  }
}

function toFormViewModel (parsed) {
  const { dateInput, dateErrors = {} } = parsed
  const selected = Boolean(relativeRange(dateInput.mode)) ||
    dateInput.mode === MODE_SINCE ||
    (dateInput.mode === MODE_PERIOD && hasAnyPeriodParts(dateInput))

  return {
    mode: dateInput.mode,
    selected,
    hasErrors: Object.keys(dateErrors).length > 0,
    relativeOptions: RELATIVE_RANGES.map((r) => ({
      value: r.value,
      text: r.label,
      checked: dateInput.mode === r.value
    })),
    sinceDateInput: buildDateInputParams(
      SINCE_DATE,
      dateInput.sinceDate,
      { text: 'Since date', classes: 'govuk-visually-hidden' },
      dateErrors.sinceDate
    ),
    fromYear: dateInput.fromYear,
    toYear: dateInput.toYear,
    fromYearError: dateErrors.fromYear?.message ?? null,
    toYearError: dateErrors.toYear?.message ?? null
  }
}

const clearedDateInput = {
  mode: null,
  sinceDate: EMPTY_PARTS,
  fromYear: '',
  toYear: ''
}

function toChipItems (parsed, chipHref) {
  const { dateInput, dateErrors } = parsed
  if (!dateInput?.mode || Object.keys(dateErrors ?? {}).length > 0) {
    return []
  }

  const relative = relativeRange(dateInput.mode)
  if (relative) {
    return [{
      label: relative.label,
      removeHref: chipHref({ dateInput: clearedDateInput, page: 1 })
    }]
  }

  if (dateInput.mode === MODE_SINCE) {
    const label = formatParts(dateInput.sinceDate)
    if (!label) {
      return []
    }
    return [{
      label: `Since ${label}`,
      removeHref: chipHref({ dateInput: clearedDateInput, page: 1 })
    }]
  }

  const items = []
  if (dateInput.fromYear !== '') {
    items.push({
      label: `From ${dateInput.fromYear}`,
      removeHref: chipHref({ dateInput: { ...dateInput, fromYear: '' }, page: 1 })
    })
  }
  if (dateInput.toYear !== '') {
    items.push({
      label: `To ${dateInput.toYear}`,
      removeHref: chipHref({ dateInput: { ...dateInput, toYear: '' }, page: 1 })
    })
  }
  return items
}

function toErrorItems (errors) {
  const items = []
  if (errors.sinceDate) {
    const firstMissing = errors.sinceDate.missing[0] ?? DAY
    items.push({ text: errors.sinceDate.message, href: `#${SINCE_DATE}-${firstMissing}` })
  }
  if (errors.fromYear) {
    items.push({ text: errors.fromYear.message, href: `#${FROM_YEAR}` })
  }
  if (errors.toYear) {
    items.push({ text: errors.toYear.message, href: `#${TO_YEAR}` })
  }
  return items
}

export const dateFilter = {
  chipGroup: { name: 'updatedAt', legend: 'Date' },
  parse,
  validate,
  applyFilter,
  appendToParams,
  toFormViewModel,
  toChipItems,
  toErrorItems
}
