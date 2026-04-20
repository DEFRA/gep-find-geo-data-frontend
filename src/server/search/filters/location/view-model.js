/**
 * @typedef {{ latitude: string, longitude: string }} LocationInput
 * @typedef {Partial<Record<'latitude'|'longitude', { message: string }>>} LocationErrors
 */

const EMPTY_LOCATION = { latitude: '', longitude: '' }

function parse (rawQuery) {
  return {
    latitude: typeof rawQuery.latitude === 'string' ? rawQuery.latitude.trim() : '',
    longitude: typeof rawQuery.longitude === 'string' ? rawQuery.longitude.trim() : ''
  }
}

function validate (input) {
  const errors = {}
  if (input.latitude === '' && input.longitude === '') {
    return errors
  }

  const validateCoord = (value, { name, min, max }) => {
    if (value === '') {
      return { message: `Enter a ${name.toLowerCase()}` }
    }
    const n = Number.parseFloat(value)
    if (!Number.isFinite(n)) {
      return { message: `${name} must be a number` }
    }
    if (n < min || n > max) {
      return { message: `${name} must be between ${min} and ${max}` }
    }
    return null
  }

  const latError = validateCoord(input.latitude, { name: 'Latitude', min: -90, max: 90 })
  const lngError = validateCoord(input.longitude, { name: 'Longitude', min: -180, max: 180 })

  if (latError) {
    errors.latitude = latError
  }
  if (lngError) {
    errors.longitude = lngError
  }

  return errors
}

function applyFilter (filters, input, errors) {
  if (Object.keys(errors).length > 0) {
    return
  }
  if (input.latitude === '' || input.longitude === '') {
    return
  }
  filters.location = {
    latitude: Number.parseFloat(input.latitude),
    longitude: Number.parseFloat(input.longitude)
  }
}

function appendToParams (params, input) {
  if (input.latitude) {
    params.set('latitude', input.latitude)
  }
  if (input.longitude) {
    params.set('longitude', input.longitude)
  }
}

function buildLocationInputParams ({ id, label, value, error }) {
  const params = {
    id,
    name: id,
    label: { text: label },
    classes: 'govuk-input--width-10',
    inputmode: 'decimal',
    value
  }
  if (error) {
    params.errorMessage = { text: error.message }
  }
  return params
}

function toFormViewModel (parsed) {
  const { locationInput, locationErrors = {} } = parsed
  return {
    selected: locationInput.latitude !== '' || locationInput.longitude !== '',
    hasErrors: Object.keys(locationErrors).length > 0,
    latitudeInput: buildLocationInputParams({
      id: 'latitude',
      label: 'Latitude',
      value: locationInput.latitude,
      error: locationErrors.latitude
    }),
    longitudeInput: buildLocationInputParams({
      id: 'longitude',
      label: 'Longitude',
      value: locationInput.longitude,
      error: locationErrors.longitude
    })
  }
}

function toChipItems (parsed, chipHref) {
  const { locationInput, locationErrors } = parsed
  if (locationInput.latitude === '' && locationInput.longitude === '') {
    return []
  }
  if (Object.keys(locationErrors ?? {}).length > 0) {
    return []
  }
  const removeHref = chipHref({
    locationInput: EMPTY_LOCATION,
    page: 1
  })
  return [{
    label: `${locationInput.latitude}, ${locationInput.longitude}`,
    removeHref
  }]
}

function toErrorItems (errors) {
  const items = []
  if (errors.latitude) {
    items.push({ text: errors.latitude.message, href: '#latitude' })
  }
  if (errors.longitude) {
    items.push({ text: errors.longitude.message, href: '#longitude' })
  }
  return items
}

export const locationFilter = {
  chipGroup: { name: 'location', legend: 'Location' },
  parse,
  validate,
  applyFilter,
  appendToParams,
  toFormViewModel,
  toChipItems,
  toErrorItems
}
