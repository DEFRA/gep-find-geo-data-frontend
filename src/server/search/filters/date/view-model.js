import { addDays } from 'date-fns'

import { formatDate } from '../../../../config/nunjucks/filters/format-date.js'

/**
 * @typedef {{ day: string, month: string, year: string }} DateParts
 *
 * @typedef DateInput
 * @property {'exact' | 'range' | null} mode
 * @property {DateParts} exactDate
 * @property {DateParts} afterDate
 * @property {DateParts} beforeDate
 *
 * @typedef {{ message: string, missing: string[] }} DateFieldError
 * @typedef {Partial<Record<'exactDate'|'afterDate'|'beforeDate', DateFieldError>>} DateErrors
 */

const MODE_EXACT = 'exact'
const MODE_RANGE = 'range'
const VALID_DATE_MODES = new Set([MODE_EXACT, MODE_RANGE])

const EXACT_DATE = 'exactDate'
const AFTER_DATE = 'afterDate'
const BEFORE_DATE = 'beforeDate'
const DATE_PREFIXES = [EXACT_DATE, AFTER_DATE, BEFORE_DATE]

const DAY = 'day'
const MONTH = 'month'
const YEAR = 'year'
const DATE_PART_NAMES = [DAY, MONTH, YEAR]
const EMPTY_PARTS = { day: '', month: '', year: '' }

function readDateParts (rawQuery, prefix) {
  const read = (part) => {
    const v = rawQuery[`${prefix}-${part}`]
    return typeof v === 'string' ? v : ''
  }
  return { day: read(DAY), month: read(MONTH), year: read(YEAR) }
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

const hasAnyParts = (parts) => Object.values(parts).some((v) => v !== '')

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

function validateExactDate (input) {
  const err = validateSingleDate(input.exactDate, {
    label: 'Date',
    required: true,
    emptyMessage: 'Enter a date',
    invalidMessage: 'Enter a valid date'
  })
  return err ? { exactDate: err } : {}
}

function validateDateOrder (input) {
  const after = partsToDate(input.afterDate)
  const before = partsToDate(input.beforeDate)
  if (after && before && after > before) {
    return {
      message: '"Updated before" must be on or after "Updated after"',
      missing: []
    }
  }
  return null
}

function validateRangeDates (input) {
  const errors = {}
  const afterErr = validateSingleDate(input.afterDate, {
    label: '"Updated after"',
    required: false,
    invalidMessage: '"Updated after" must be a valid date'
  })
  const beforeErr = validateSingleDate(input.beforeDate, {
    label: '"Updated before"',
    required: false,
    invalidMessage: '"Updated before" must be a valid date'
  })
  if (afterErr) {
    errors.afterDate = afterErr
  }
  if (beforeErr) {
    errors.beforeDate = beforeErr
  }

  if (!afterErr && !beforeErr) {
    const orderErr = validateDateOrder(input)
    if (orderErr) {
      errors.beforeDate = orderErr
    }
  }
  return errors
}

function buildUpdatedAtBetween (input) {
  if (input.mode === MODE_EXACT) {
    const date = partsToDate(input.exactDate)
    if (!date) {
      return null
    }
    return { from: date.toISOString(), to: addDays(date, 1).toISOString() }
  }
  if (input.mode === MODE_RANGE) {
    const from = partsToDate(input.afterDate)?.toISOString()
    const beforeDate = partsToDate(input.beforeDate)
    const to = beforeDate && addDays(beforeDate, 1).toISOString()
    if (!from && !to) {
      return null
    }
    return { ...(from && { from }), ...(to && { to }) }
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
  const widthClass = (name) => name === YEAR ? 'govuk-input--width-4' : 'govuk-input--width-2'
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
  const exactDate = readDateParts(rawQuery, EXACT_DATE)
  const afterDate = readDateParts(rawQuery, AFTER_DATE)
  const beforeDate = readDateParts(rawQuery, BEFORE_DATE)

  let mode = VALID_DATE_MODES.has(rawQuery.dateMode) ? rawQuery.dateMode : null
  if (!mode) {
    if (hasAnyParts(exactDate)) {
      mode = MODE_EXACT
    } else if (hasAnyParts(afterDate) || hasAnyParts(beforeDate)) {
      mode = MODE_RANGE
    } else {
      mode = null
    }
  }

  return { mode, exactDate, afterDate, beforeDate }
}

function validate (input) {
  if (input.mode === MODE_EXACT) {
    return validateExactDate(input)
  }
  if (input.mode === MODE_RANGE) {
    return validateRangeDates(input)
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
  params.set('dateMode', input.mode)
  if (input.mode === MODE_EXACT) {
    appendDateParts(params, input.exactDate, EXACT_DATE)
  } else {
    appendDateParts(params, input.afterDate, AFTER_DATE)
    appendDateParts(params, input.beforeDate, BEFORE_DATE)
  }
}

function toFormViewModel (parsed) {
  const { dateInput, dateErrors = {} } = parsed
  return {
    mode: dateInput.mode,
    selected: dateInput.mode !== null,
    hasErrors: Object.keys(dateErrors).length > 0,
    exactDateInput: buildDateInputParams(
      EXACT_DATE,
      dateInput.exactDate,
      { text: 'Exact date', classes: 'govuk-visually-hidden' },
      dateErrors.exactDate
    ),
    afterDateInput: buildDateInputParams(
      AFTER_DATE,
      dateInput.afterDate,
      { text: 'Updated after', classes: 'govuk-fieldset__legend--s' },
      dateErrors.afterDate
    ),
    beforeDateInput: buildDateInputParams(
      BEFORE_DATE,
      dateInput.beforeDate,
      { text: 'Updated before', classes: 'govuk-fieldset__legend--s' },
      dateErrors.beforeDate
    )
  }
}

function toChipItems (parsed, chipHref) {
  const { dateInput, dateErrors } = parsed
  if (!dateInput?.mode || Object.keys(dateErrors ?? {}).length > 0) {
    return []
  }

  if (dateInput.mode === MODE_EXACT) {
    const label = formatParts(dateInput.exactDate)
    if (!label) {
      return []
    }
    const removeHref = chipHref({
      dateInput: { mode: null, exactDate: EMPTY_PARTS, afterDate: EMPTY_PARTS, beforeDate: EMPTY_PARTS },
      page: 1
    })
    return [{ label, removeHref }]
  }

  const items = []
  const afterLabel = formatParts(dateInput.afterDate)
  const beforeLabel = formatParts(dateInput.beforeDate)
  if (afterLabel) {
    items.push({
      label: `After ${afterLabel}`,
      removeHref: chipHref({ dateInput: { ...dateInput, afterDate: EMPTY_PARTS }, page: 1 })
    })
  }
  if (beforeLabel) {
    items.push({
      label: `Before ${beforeLabel}`,
      removeHref: chipHref({ dateInput: { ...dateInput, beforeDate: EMPTY_PARTS }, page: 1 })
    })
  }
  return items
}

function toErrorItems (errors) {
  const items = []
  for (const prefix of DATE_PREFIXES) {
    const err = errors[prefix]
    if (!err) {
      continue
    }
    const firstMissing = err.missing[0] ?? DAY
    items.push({ text: err.message, href: `#${prefix}-${firstMissing}` })
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
