import { resolutions } from '../../../server/common/constants/dataset-resolutions.js'

/**
 * @param {import('../../../server/common/services/geonetwork/client.js').SpatialResolution | null} resolution
 * @returns {string}
 */
export function formatResolution (resolution) {
  if (!resolution) {
    return ''
  }

  const scales = resolution.scaleDenominators
    .map((value) => `1:${value.toLocaleString('en-GB')}`)
  const distances = resolution.distances
    .map((value) => standardiseUnitOfMeasure(value.trim()).replace(/(\d)\s+(?=[a-z])/gi, '$1'))

  return [...new Set([...scales, ...distances])].join(', ')
}

function standardiseUnitOfMeasure (distance) {
  const values = distance.split(' ')
  const unit = resolutions.get(values[1])
  values[1] = unit || values[1]
  return values.join('')
}
