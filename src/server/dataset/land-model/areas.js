// 100km British National Grid squares that intersect England
/** @type {string[]} */
const areas = [
  'NT', 'NU', 'NX', 'NY', 'NZ',
  'SD', 'SE', 'SJ', 'SK', 'SO', 'SP', 'SS', 'ST', 'SU', 'SV', 'SW', 'SX', 'SY', 'SZ',
  'TA', 'TF', 'TG', 'TL', 'TM', 'TQ', 'TR', 'TV'
]

const ALL_OF_ENGLAND = 'all'

const areaCodes = new Set(areas)

/**
 * @param {string} value
 * @returns {boolean}
 */
function isAreaCode (value) {
  return areaCodes.has(value)
}

/**
 * @param {string} area
 * @returns {string}
 */
function areaPhrase (area) {
  return area === ALL_OF_ENGLAND ? 'all of England' : `area ${area}`
}

export { ALL_OF_ENGLAND, areaPhrase, areas, isAreaCode }
