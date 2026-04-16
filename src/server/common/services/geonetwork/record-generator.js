import seedrandom from 'seedrandom'

const defraOrgs = [
  'Natural England',
  'Environment Agency',
  'Forestry Commission',
  'Rural Payments Agency',
  'Animal and Plant Health Agency',
  'Centre for Environment, Fisheries and Aquaculture Science',
  'Agriculture and Horticulture Development Board',
  'Marine Management Organisation',
  'Joint Nature Conservation Committee',
  'Department for Environment, Food and Rural Affairs'
]

const dataTypes = ['vector', 'grid']

const themes = [
  'Forest Cover',
  'Tree Density',
  'Woodland Condition',
  'Heathland Survey',
  'Grassland Condition',
  'River Levels',
  'Groundwater Monitoring',
  'Catchment Boundaries',
  'Water Quality',
  'Air Quality Monitoring',
  'Coastal Erosion',
  'Shoreline Change',
  'Soil Carbon',
  'Soil Texture',
  'Agricultural Land Use',
  'Species Occurrence',
  'Local Nature Reserves',
  'Marine Habitats',
  'Seabed Sediments',
  'Peatland Extent',
  'Nitrate Vulnerable Zones',
  'Bathing Water Quality'
]

const regions = [
  'England',
  'Wales',
  'Scotland',
  'Northern Ireland',
  'Great Britain',
  'United Kingdom',
  'Yorkshire and the Humber',
  'South West',
  'South East',
  'East of England',
  'North West',
  'West Midlands',
  'East Midlands',
  'North East'
]

const abstractTemplates = [
  (theme, region, org) =>
    `A spatial dataset describing ${theme.toLowerCase()} across ${region}, compiled by ${org}. Used for monitoring, reporting and evaluation across environmental and rural affairs programmes.`,
  (theme, region, org) =>
    `Survey data showing ${theme.toLowerCase()} for ${region}. Produced by ${org} as part of routine national monitoring and published under the Open Government Licence.`,
  (theme, region, org) =>
    `Inventory of ${theme.toLowerCase()} coverage for ${region}, maintained by ${org}. Suitable for spatial analysis, policy evaluation and public reporting.`
]

function pick (prng, list) {
  return list[Math.floor(prng() * list.length)]
}

function generatedId (index) {
  const hex = index.toString(16).padStart(12, '0')
  return `fffff005-0000-4000-a000-${hex}`
}

const DATE_ORIGIN_MS = Date.UTC(2020, 0, 1)
const DATE_WINDOW_MS = 5 * 365 * 24 * 60 * 60 * 1000

function randomIsoDate (prng) {
  const ms = DATE_ORIGIN_MS + Math.floor(prng() * DATE_WINDOW_MS)
  return new Date(ms).toISOString()
}

/**
 * @param {number} index
 * @param {() => number} prng
 * @returns {import('./client.js').MetadataRecord}
 */
function generateRecord (index, prng) {
  const theme = pick(prng, themes)
  const region = pick(prng, regions)
  const org = pick(prng, defraOrgs)
  const abstract = pick(prng, abstractTemplates)(theme, region, org)

  return {
    id: generatedId(index),
    title: `${theme} ${region}`,
    abstract,
    owner: org,
    dataType: pick(prng, dataTypes),
    updatedAt: randomIsoDate(prng)
  }
}

/**
 * @param {number} count
 * @param {{ seed?: number }} [options]
 * @returns {import('./client.js').MetadataRecord[]}
 */
function generateRecords (count, { seed = 42 } = {}) {
  const prng = seedrandom(String(seed))
  const records = []
  for (let i = 0; i < count; i++) {
    records.push(generateRecord(i, prng))
  }
  return records
}

export { generateRecords }
