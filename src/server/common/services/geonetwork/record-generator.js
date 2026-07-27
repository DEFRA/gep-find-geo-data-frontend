import seedrandom from 'seedrandom'

const defraOrgs = [
  'Natural England',
  'Environment Agency',
  'Forestry Commission',
  'Rural Payments Agency',
  'Animal and Plant Health Agency',
  'Agriculture and Horticulture Development Board',
  'Joint Nature Conservation Committee',
  'Department for Environment, Food and Rural Affairs'
]

const dataTypes = ['.tif', '.gpkg']

const accessLevels = ['Open data', 'Restricted access']

const updateFrequencies = ['Monthly', 'Annually', 'As needed', 'Not planned']

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
  'Soil Carbon',
  'Soil Texture',
  'Agricultural Land Use',
  'Species Occurrence',
  'Local Nature Reserves',
  'Peatland Extent',
  'Nitrate Vulnerable Zones'
]

const regions = [
  'England',
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

const topics = [
  'Environment',
  'Elevation',
  'Biota',
  'Boundaries',
  'Inland waters'
]

const openLicence = 'Open Government Licence'
const restrictedLicence = 'Restricted access - contact publisher'

const formatOptions = [
  'Open format | Shapefile (SHP)',
  'Open format | GeoPackage (GPKG)',
  'Open format | Geo Tagged Image File Format (GeoTIFF)',
  'Open format | Comma Separated Values file (CSV)',
  'Proprietary format | ESRI File based Geodatabase (GDB)',
  'Open format | Keyhole Markup Language (KML)'
]

const crsOptions = [
  'https://www.opengis.net/def/crs/EPSG/0/27700',
  'https://www.opengis.net/def/crs/EPSG/0/4326',
  'https://www.opengis.net/def/crs/EPSG/0/3857'
]

const keywordPool = [
  'environment', 'survey', 'monitoring', 'spatial data',
  'conservation', 'land use', 'habitat',
  'ecology', 'landscape', 'biodiversity', 'mapping'
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

function randomSubset (prng, list, min, max) {
  const count = min + Math.floor(prng() * (max - min + 1))
  const shuffled = [...list].sort(() => prng() - 0.5)
  return shuffled.slice(0, count)
}

function randomBbox (prng) {
  const west = -8 + prng() * 6
  const south = 49.5 + prng() * 2
  const east = west + 2 + prng() * 8
  const north = south + 2 + prng() * 6
  return {
    west: Math.round(west * 1000) / 1000,
    south: Math.round(south * 1000) / 1000,
    east: Math.round(east * 1000) / 1000,
    north: Math.round(north * 1000) / 1000
  }
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
  const id = generatedId(index)
  const categories = randomSubset(prng, topics, 1, 2)
  const categoryKeys = new Set(categories.map((category) => category.toLowerCase()))
  const keywords = randomSubset(prng, keywordPool, 2, 5)
    .filter((keyword) => !categoryKeys.has(keyword.toLowerCase()))
  const accessLevel = pick(prng, accessLevels)

  return {
    id,
    title: `EXAMPLE - ${theme} ${region}`,
    abstract,
    owner: org,
    dataType: pick(prng, dataTypes),
    accessLevel,
    updateFrequency: pick(prng, updateFrequencies),
    categories,
    updatedAt: randomIsoDate(prng),
    lineage: `Dataset produced by ${org} covering ${theme.toLowerCase()} for ${region}.`,
    contactPoint: 'example@defra.gov.uk',
    licence: accessLevel === 'Open data' ? openLicence : restrictedLicence,
    useLimitation: 'There are no public access constraints to this data. Use of this data is subject to the licence identified.',
    language: 'eng',
    keywords,
    format: randomSubset(prng, formatOptions, 1, 3),
    links: [
      {
        url: `https://environment.data.gov.uk/dataset/${id}`,
        name: `${theme} ${region} - Download`,
        description: `Download ${theme.toLowerCase()} data for ${region}`
      }
    ],
    temporalExtent: {
      start: randomIsoDate(prng).split('T')[0],
      end: '2099-12-31'
    },
    coordinateReferenceSystem: pick(prng, crsOptions),
    geographicExtent: randomBbox(prng),
    publicationDate: prng() > 0.5 ? randomIsoDate(prng) : null,
    creationDate: randomIsoDate(prng)
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
