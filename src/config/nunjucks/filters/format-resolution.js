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
    .map((value) => value.trim().replace(/(\d)\s+(?=[a-z])/gi, '$1'))

  return [...new Set([...scales, ...distances])].join(', ')
}
