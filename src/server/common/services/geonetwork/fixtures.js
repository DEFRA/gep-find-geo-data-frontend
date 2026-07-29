const curatedRecords = [
  // https://environment.data.gov.uk/dataset/f425f1e1-fc18-4b5a-88d8-76934125627c
  {
    id: 'f425f1e1-fc18-4b5a-88d8-76934125627c',
    title: 'Ancient Woodland (England)',
    abstract: `This is a spatial dataset that describes the geographic extent and location of ancient woodland habitat in England (excluding the Isles of Scilly). Ancient woodland is an area that has been wooded continuously since at least 1600AD

This dataset is one of two resources used to identify the location and extent of ancient woodland in England. The Ancient Woodland Inventory (AWI) is currently undergoing revision. Updated AWI data can be accessed at Ancient Woodland - Revised (England) - Completed Counties. Where a county has been updated and is included in that dataset, the revised information takes precedence. If a county has not yet been updated and so does not appear in the Ancient Woodland - Revised (England) - Completed Counties dataset, the Ancient Woodland Inventory (AWI) dataset should be used as the primary reference.

Ancient woodland includes Ancient Semi-Natural Woodland (ASNW), which retains a native tree and shrub cover, Plantation on Ancient Woodland Sites (PAWS) where the original tree cover has been felled and replaced by planting, often with conifers, Ancient Wood Pasture and Parkland (AWPP) where the trees are managed in tandem with a long established tradition of grazing, characteristically with at least some veteran trees or shrubs and Infilled Ancient Wood Pasture and Parkland where the open habitat between open grown or veteran trees in AWPP has infilled, either through natural regeneration or planting, resulting in closed canopy woodland. In total 53,637 polygons were captured, covering approximately 364971.81 Ha.
Our guidance document can be accessed below.
 Attribution statement: © Natural England [Year]; © Crown Copyright and database rights [year]. Ordnance Survey AC0000851168; © 2015 Getmapping plc and Bluesky International Ltd; © Woodland Trust; © Forest Commission; Contains, or is based on, information supplied by the Forestry Commission. © Crown copyright and database right [Year] Ordnance Survey [100021242]; © and database right Crown copyright and Landmark Information Group Ltd. All rights reserved [year]; © Ancient Tree Hunt`,
    owner: 'Natural England',
    dataType: '.gpkg',
    accessLevel: 'Open data',
    updateFrequency: 'Monthly',
    categories: [
      'Environment'
    ],
    updatedAt: '2026-03-15T00:00:00.000Z',
    lineage: 'Between 1981 and 1982 the Nature Conservancy Council began to compile an inventory of ancient woodland for England and Wales. This Ancient Woodland Inventory (AWI) was originally produced on a county basis with reports and paper maps published as they became available. It has since been digitised to create a national dataset which has been administered by the NCC’s successor bodies, English Nature and now Natural England.The majority of the south east counties were updated in a pilot project (2006 - 2014) and this area includes smaller woods for the first time, dropping the threshold to 0.25 hectares from the previously mapped two hectares threshold.Datasets used include:National Forest Index - Forest Commission, OS MasterMap (PSGA), Historic Ordnance Survey data including Ordnance Surveyor\'s Drawings, County Maps and First Series 1 inch maps to current editions - Landmark (bespoke licence), Priority Habitat Inventory - Natural England (OGL), Ancient Tree Inventory - Woodland Trust Aerial Photography (APGB agreement)',
    contactPoint: 'data.services@naturalengland.org.uk',
    licence: 'Open Government Licence',
    useLimitation: 'There are no public access constraints to this data. Use of this data is subject to the licence identified.',
    language: 'eng',
    keywords: [
      'Habitats and biotopes',
      'landscape',
      'Habitats',
      'Natural England',
      'Open Data',
      'ecology'
    ],
    format: [
      'Proprietary format | ESRI File based Geodatabase (GDB)',
      'Open format | Shapefile (SHP)'
    ],
    links: [
      {
        url: 'https://example.com/mock-download.zip',
        name: 'Ancient_Woodland_England.gpkg.zip',
        description: 'Ancient_Woodland_England.gpkg.zip download'
      }
    ],
    temporalExtent: {
      start: '2013-01-01',
      end: '2099-12-31'
    },
    coordinateReferenceSystem: 'https://www.opengis.net/def/crs/EPSG/0/27700',
    geographicExtent: {
      west: -6.375,
      south: 49.9,
      east: 1.79,
      north: 55.82
    },
    publicationDate: null,
    creationDate: '2013-01-01T00:00:00.000Z'
  },
  // https://environment.data.gov.uk/dataset/04dc895b-e25d-485d-9b0c-d912a0259da8
  {
    id: '04dc895b-e25d-485d-9b0c-d912a0259da8',
    title: 'Crop Map of England (CROME) 2025',
    abstract: 'The Crop Map of England (CROME) is a polygon vector dataset mainly containing the crop types of England. The dataset contains approximately 32 million hexagonal cells classifying England into over 15 main crop types, grassland, and non-agricultural land covers, such as Woodland, Water Bodies, Fallow Land and other non-agricultural land covers. The classification was created automatically using supervised classification (Random Forest Classification) from the combination of Sentinel-1 Radar Satellite time series images during the period January 2025 – August 2025. The dataset was created to aid the classification of crop types from optical imagery, which can be affected by cloud cover. The results were checked against survey data collected by field inspectors and visually validated. The data has been split into the Ordnance Survey Ceremonial Counties and each county is given a three letter code. Please refer to the CROME specification document to see which county each CODE label represents. Attribution statement: © Rural Payments Agency copyright and/or database right 2024. All rights reserved.',
    owner: 'Rural Payments Agency',
    dataType: '.gpkg',
    accessLevel: 'Open data',
    updateFrequency: 'Annually',
    categories: [
      'Environment'
    ],
    updatedAt: '2026-04-17T00:00:00.000Z',
    lineage: 'The sources for crop classification are satellite images from the Sentinel constellation and Planet Fusion. A combination of radar and multispectral imagery from Sentinel sensors was used for automatic crop classification based on ground truth observation on crop types. The classification was also validated using independent ground observation points.',
    contactPoint: 'open.data@rpa.gov.uk',
    licence: 'Open Government Licence',
    useLimitation: 'N/A',
    language: 'eng',
    keywords: [
      'Land cover',
      'Land use',
      'Crop Map',
      'RPA crop map',
      'crop types'
    ],
    format: [
      'Open format | Shapefile (SHP)'
    ],
    links: [
      {
        url: 'https://example.com/mock-download.zip',
        name: 'Crop_Map_of_England_CROME_2025.gpkg.zip',
        description: 'Crop_Map_of_England_CROME_2025.gpkg.zip download'
      }
    ],
    temporalExtent: {
      start: null,
      end: '2099-12-31'
    },
    coordinateReferenceSystem: 'https://www.opengis.net/def/crs/EPSG/0/27700',
    geographicExtent: {
      west: -6.236,
      south: 49.943,
      east: 2.072,
      north: 55.816
    },
    publicationDate: null,
    creationDate: '2026-02-02T00:00:00.000Z'
  },
  // https://environment.data.gov.uk/dataset/04532375-a198-476e-985e-0579a0a11b47
  {
    id: '04532375-a198-476e-985e-0579a0a11b47',
    title: 'Flood Map for Planning - Flood Zones',
    abstract: `The Flood Map for Planning Service includes several layers of information. This includes the Flood Zones data which shows the extent of land at present day risk of flooding from rivers and the sea, ignoring the benefits of defences, for the following scenarios:

•\tFlood Zone 1 – Land having a less than 0.1% (1 in 1000) annual probability of flooding.
•\tFlood Zone 2 – Land having between 0.1% - 1% (1 in 100 to 1 in 1000) annual probability of flooding from rivers or between 0.1% - 0.5% (1 in 200 to 1 in 1000) annual probability of flooding from the sea, and accepted recorded flood outlines .
•\tFlood Zone 3 – Areas shown to be at a 1% (1 in 100) or greater annual probability of flooding from rivers or, 0.5% (1 in 200) or greater annual probability of flooding from the sea.

Flood Zone 1 is not shown in this dataset, but covers all areas not contained within Flood Zones 2 and 3.
Local Planning Authorities (LPAs) use the Flood Zones to determine if they must consult the Environment Agency on planning applications. They are also used to determine if development is incompatible and whether development is subject to the exception test. The Flood Zones are one of several flood risk datasets used to determine the need for planning applications to be supported by a Flood Risk Assessment (FRA) and subject to the sequential test.

The Flood Zones are a composite dataset including national and local modelled data, and information from past floods.

The Flood Zones are designed to only give an indication of flood risk to an area of land and are not suitable for showing whether an individual property is at risk of flooding. This is because we cannot know all the details about each property.

Users of these datasets should always check they are suitable for the intended use.

Please note, if downloading data for an area of interest, all polygons that intersect this area will be provided. Some polygons may be quite large and extend beyond the drawn area of interest. Any polygons that do not intersect the area of interest will not be provided. Please check your area of interest is sufficient or use the data feeds (e.g. WMS) to view the latest available data for all of England. Attribution statement: © Environment Agency copyright and/or database right 2025. All rights reserved.`,
    owner: 'Environment Agency',
    dataType: '.gpkg',
    accessLevel: 'Open data',
    updateFrequency: 'As needed',
    categories: [
      'Environment',
      'Inland waters',
      'Oceans'
    ],
    updatedAt: '2026-05-20T00:00:00.000Z',
    lineage: 'The Flood Zones are created using local flood model outputs, recorded flood outlines and national flood model information. These are combined by our new National Flood Risk Assessment (NaFRA2) system to generate extents of land at flood risk, with the aim of using the best available flood risk information in any one location.',
    contactPoint: 'example@environment-agency.gov.uk',
    licence: 'Open Government Licence',
    useLimitation: 'There are no public access constraints to this data. Use of this data is subject to the licence identified.',
    language: 'eng',
    keywords: [
      'Natural risk zones',
      'Area management/restriction/regulation zones and reporting units',
      'Development planning',
      'Flood Risk Management',
      'Flood Zones',
      'Spatial Planning',
      'rivers',
      'sea'
    ],
    format: [
      'OGC Web Services | JavaScript Object Notation (JSON)',
      'Proprietary format | ESRI File based Geodatabase (GDB)',
      'Open format | Shapefile (SHP)',
      'Open format | JavaScript Object Notation (GeoJSON)',
      'Open format | Keyhole Markup Language (KML)',
      'Open format | Geography Markup Language (GML)',
      'Proprietary format | MapInfo (TAB)',
      'Proprietary format | MapInfo MIF/MID (MIF)'
    ],
    links: [
      {
        url: 'https://example.com/mock-download.zip',
        name: 'Flood_Map_for_Planning_Flood_Zones.gpkg.zip',
        description: 'Flood_Map_for_Planning_Flood_Zones.gpkg.zip download'
      }
    ],
    temporalExtent: {
      start: null,
      end: '2099-12-31'
    },
    coordinateReferenceSystem: 'https://www.opengis.net/def/crs/EPSG/0/27700',
    geographicExtent: {
      west: -6.236,
      south: 49.943,
      east: 2.072,
      north: 55.816
    },
    publicationDate: '2025-03-25T00:00:00.000Z',
    creationDate: '2025-01-29T00:00:00.000Z'
  },
  // https://environment.data.gov.uk/dataset/042f14b2-3076-420d-b604-9657c0398fae
  {
    id: '042f14b2-3076-420d-b604-9657c0398fae',
    title: 'Living England 2022-23',
    abstract: 'Living England is a multi-year project which delivers a broad habitat map for the whole of England, created using satellite imagery, field data records and other geospatial data in a machine learning framework. The Living England habitat map shows the extent and distribution of broad habitats across England aligned to the UKBAP classification, providing a valuable insight into our natural capital assets and helping to inform land management decisions. Living England is a project within Natural England, funded by and supports the Defra Natural Capital and Ecosystem Assessment (NCEA) Programme and Environmental Land Management (ELM) Schemes to provide an openly available national map of broad habitats across England. Attribution statement: © Natural England 2024. Contains: OS data © Crown copyright and database rights 2023 OS AC0000851168; Natural England Licence No. 2011/052 British Geological Survey © NERC. All rights reserved; © Environment Agency 2023. All rights reserved; © Rural Payments Agency 2022; NERC EDS Environmental Information Data Centre; National Plant Monitoring Scheme and survey data (2015-2023) organised and funded by the UKCEH, BSBI, Plantlife and JNCC, indebted to all volunteers who contribute data to the scheme; Modified Copernicus Sentinel data 2023; © Forestry Commission 2022; Soils Data © Cranfield University (NSRI) and for the Controller of HMSO 2005; © Carlos Bedson & Manchester Metropolitan University 2019; British Geological Survey materials © UKRI 2016; HadUK-Grid data © Met Office 2018; Modified Copernicus Climate Change Service information 2023; © Bluesky International Ltd 2024; Map services and data available from U.S. Geological Survey, National Geospatial Program; © Department for Energy Security and Net Zero; © OpenStreetMap 2024.',
    owner: 'Natural England',
    dataType: '.gpkg',
    accessLevel: 'Open data',
    updateFrequency: 'As needed',
    categories: [
      'Environment'
    ],
    updatedAt: '2024-09-16T00:00:00.000Z',
    lineage: `Process Description: A number of data layers are used to develop a ground dataset of habitat reference data, which are then used to inform a machine-learning model and spatial analyses to generate a map of the likely locations and distributions of habitats across England. The main source data layers underpinning the spatial framework and models are Sentinel-2 and Sentinel-1 satellite data from the ESA Copernicus programme, Lidar from the EA's national Lidar Programme and collected data through the project's national survey programme. Additional datasets informing the approach as detailed below and outlined in the accompanying technical user guide. 

Datasets used:
OS MasterMap® Topography Layer; Geology aka BGS Bedrock Mapping 1:50k; Long Term Monitoring Network; Uplands Inventory; Coastal Dune Geomatics Mapping Ground Truthing; Crop Map of England (RPA) CROME; Lowland Heathland Survey; National Grassland Survey; National Plant Monitoring Scheme; NE field Unit Surveys; Northumberland Border Mires Survey; Sentinel-2 multispectral imagery; Sentinel-1 backscatter imagery; Sentinel-1 single look complex (SLC) imagery; National forest inventory (NFI); Cranfield NATMAP; Agri-Environment HLS Monitoring; Living England desktop validation; Priority Habitat Inventory; Space2 Eye Lens: Ainsdale NNR, State of the Bog Bowland Survey, State of the Bog Dark Peak Condition Survey, State of the Bog Manchester Metropolitan University (MMU) Mountain Hare Habitat Survey Dark Peak, State of the Bog; Moors for the Future Dark Peak Survey; West Pennines Designation NVC Survey; Wetland Annex 1 inventory; Soils-BGS Soil Parent Material; Met Office HadUK gridded climate product; Saltmarsh Extent and Zonation; EA LiDAR DSM & DTM; New Forest Mires Wetland Survey; New Forest Mires Wetland Survey; West Cumbria Mires Survey; England Peat Map Vegetation Surveys; NE protected sites monitoring; ERA5; OS Open Built-up Areas; OS Boundaries dataset; EA IHM (Integrated height model) DTM; OS VectorMap District; EA Coastal Flood Boundary: Extreme Sea Levels; AIMS Spatial Sea Defences; LIDAR Sand Dunes 2022; EA Coastal saltmarsh species surveys; Aerial Photography GB (APGB); NASA SRT (Shuttle Radar Topography Mission) M30; Provisional Agricultural Land Classification; Renewable Energy Planning Database (REPD); Open Street Map 2024.`,
    contactPoint: 'data.services@naturalengland.org.uk',
    licence: 'Open Government Licence',
    useLimitation: 'There are no public access constraints to this data. Use of this data is subject to the licence identified.',
    language: 'eng',
    keywords: [
      'landscape',
      'Living England',
      'NCEA',
      'Natural England',
      'ecology',
      'habitats'
    ],
    format: [
      'Open format | GeoPackage (GPKG)',
      'Proprietary format | ESRI File based Geodatabase (GDB)',
      'Proprietary format | MS Excel (XLS)',
      'Open format | Shapefile (SHP)',
      'Open format | Keyhole Markup Language (KML)',
      'Open format | Comma Separated Values file (CSV)',
      'Open format | JavaScript Object Notation (GeoJSON)'
    ],
    links: [
      {
        url: 'https://example.com/mock-download.zip',
        name: 'Living_England_2022_23.gpkg.zip',
        description: 'Living_England_2022_23.gpkg.zip download'
      }
    ],
    temporalExtent: {
      start: null,
      end: '2099-12-31'
    },
    coordinateReferenceSystem: 'https://www.opengis.net/def/crs/EPSG/0/27700',
    geographicExtent: {
      west: -6.236,
      south: 49.943,
      east: 2.072,
      north: 55.816
    },
    publicationDate: '2024-09-16T00:00:00.000Z',
    creationDate: '2024-04-23T00:00:00.000Z'
  },
  // https://environment.data.gov.uk/dataset/b5aaa28d-6eb9-460e-8d6f-43caa71fbe0e
  {
    id: 'b5aaa28d-6eb9-460e-8d6f-43caa71fbe0e',
    title: 'Risk of Flooding from Surface Water',
    abstract: `Risk of Flooding from Surface Water (RoFSW) map is an assessment of where surface water flooding may occur when rainwater does not drain away through the normal drainage systems or soak into the ground, but lies on or flows over the ground instead. It is produced using national scale modelling and enhanced with compatible, locally produced modelling from lead local flood authorities (LLFAs). The RoFSW datasets include information about flooding extents, depths, speed and hazards.

This dataset shows information about flooding extents and depths. The depth of water during a flood is an important factor in how dangerous a flood might be.

RoFSW is a probabilistic product, meaning that it shows the overall risk, rather than the risk associated with a specific event or scenario. In externally published versions of this dataset, risk is displayed as one of three likelihood bandings:

High - greater than or equal to 3.3% (1 in 30) chance in any given year;
Medium - less than 3.3% (1 in 30) but greater than or equal to 1% (1 in 100) chance in any given year;
Low - less than 1% (1 in 100) but greater than or equal to 0.1% (1 in 1000) chance in any given year.

This dataset shows the likelihood of a flood occurring with water at a given depth (or higher). There are separate layers with thresholds for depths of 0m (i.e. flooding extent), 0.2m, 0.3m, 0.6m, 0.9m, and 1.2m.

NB. This is a complex dataset, with preview available only on certain zoom levels. The Web Mapping service has been set to 1:50 000 in the <MaxScaleDenominator> attribute. The services are set to be visible from the 1:50 000 scale range. There may be some variation, since end client software may interpret the request differently. Attribution statement: © Environment Agency copyright and/or database right 2025. All rights reserved.`,
    owner: 'Environment Agency',
    dataType: '.gpkg',
    accessLevel: 'Open data',
    updateFrequency: 'As needed',
    categories: [
      'Environment',
      'Inland waters'
    ],
    updatedAt: '2025-09-17T00:00:00.000Z',
    lineage: 'RoFSW is created using a combination of local flood model information and national flood modelling. These are used to generate the probabilities of flood risk for each 2m grid square of land, with the aim of using the best available flood risk information in any one location.',
    contactPoint: 'example@environment-agency.gov.uk',
    licence: 'Open Government Licence',
    useLimitation: 'There are no public access constraints to this data. Use of this data is subject to the licence identified.',
    language: 'eng',
    keywords: [
      'Natural risk zones',
      'Flood Risk Management',
      'surface waters'
    ],
    format: [
      'OGC Web Services | JavaScript Object Notation (JSON)',
      'Proprietary format | ESRI File based Geodatabase (GDB)',
      'Open format | Shapefile (SHP)',
      'Open format | JavaScript Object Notation (GeoJSON)',
      'Open format | Keyhole Markup Language (KML)',
      'Open format | Geography Markup Language (GML)',
      'Proprietary format | MapInfo (TAB)',
      'Proprietary format | MapInfo MIF/MID (MIF)'
    ],
    links: [
      {
        url: 'https://example.com/mock-download.zip',
        name: 'RoFSW.gpkg',
        description: 'RoFSW.gpkg download'
      }
    ],
    temporalExtent: {
      start: null,
      end: '2099-12-31'
    },
    coordinateReferenceSystem: 'https://www.opengis.net/def/crs/EPSG/0/27700',
    geographicExtent: {
      west: -6.236,
      south: 49.943,
      east: 2.072,
      north: 55.816
    },
    publicationDate: '2025-01-28T00:00:00.000Z',
    creationDate: '2024-10-30T00:00:00.000Z'
  },
  // https://environment.data.gov.uk/dataset/ba8dc201-66ef-4983-9d46-7378af21027e
  {
    id: 'ba8dc201-66ef-4983-9d46-7378af21027e',
    title: 'Sites of Special Scientific Interest (England)',
    abstract: 'A Site of Special Scientific Interest (SSSI) is the land notified as an SSSI under the Wildlife and Countryside Act (1981), as amended. Sites notified under the 1949 Act only are not included in the Data set. SSSI are the finest sites for wildlife and natural features in England, supporting many characteristic, rare and endangered species, habitats and natural features. The data do not include "proposed" sites. Boundaries are generally mapped against Ordnance Survey MasterMap. Attribution statement: © Natural England copyright. Contains Ordnance Survey data © Crown copyright and database right [year].',
    owner: 'Natural England',
    dataType: '.gpkg',
    accessLevel: 'Open data',
    updateFrequency: 'Monthly',
    categories: [
      'Environment'
    ],
    updatedAt: '2025-04-15T00:00:00.000Z',
    lineage: 'All data is captured to the Ordnance Survey National Grid sometimes called the British National Grid. OS MasterMap Topographic Layer ? produced and supplied by Ordnance Survey from data at 1:1250, 1:2500 and 1:10000 surveying and mapping standards - is used as the primary source. Other sources ? acquired internally and from external suppliers - may include aerial imagery at resolutions ranging from 25cm to 2m, Ordnance Survey 1:10000 raster images, historical OS mapping, charts and chart data from UK Hydrographic Office and other sources, scanned images of paper designation mapping (mostly originally produced at 1:10560 or 1:10000 scales), GPS and other surveyed data, and absolute coordinates. The data was first captured against an August 2002 cut of OS MasterMap Topography. Natural England has successfully uploaded an up-to-date version of OS MasterMap Topographic Layer. However, we have not yet updated our designated data holding to this new version of MasterMap. This should occur in the near future, when we will simultaneously apply positional accuracy improvement (PAI) to our data.',
    contactPoint: 'data.services@naturalengland.org.uk',
    licence: 'Open Government Licence',
    useLimitation: 'There are no public access constraints to this data. Use of this data is subject to the licence identified.',
    language: 'eng',
    keywords: [
      'Protected sites',
      'landscape',
      'Designations',
      'ESDA',
      'ecology'
    ],
    format: [
      'Open format | Shapefile (SHP)',
      'Open format | Keyhole Markup Language (KML)'
    ],
    links: [
      {
        url: 'https://example.com/mock-download.zip',
        name: 'Sites_of_Special_Scientific_Interest_England.gpkg.zip',
        description: 'Sites_of_Special_Scientific_Interest_England.gpkg.zip download'
      }
    ],
    temporalExtent: {
      start: '1970-01-01',
      end: '2099-12-31'
    },
    coordinateReferenceSystem: 'https://www.opengis.net/def/crs/EPSG/0/27700',
    geographicExtent: {
      west: -6.41736,
      south: 49.8625,
      east: 2.05827,
      north: 55.7447
    },
    publicationDate: '2017-09-14T00:00:00.000Z',
    creationDate: '2024-11-15T00:00:00.000Z'
  }
]

export { curatedRecords }
