const curatedRecords = [
  // https://environment.data.gov.uk/dataset/92b43165-0dd0-4e69-a712-1e49bb5aa0d0
  {
    id: '92b43165-0dd0-4e69-a712-1e49bb5aa0d0',
    title: 'Priority Habitats Inventory (England)',
    abstract: `The Priority Habitat Inventory is a spatial dataset that maps priority habitats identified in the UK Biodiversity Action Plan and listed as being of principal importance for the purpose of conserving or enhancing biodiversity, under Section 41 of the Natural Environment and Rural Communities Act (2006).

The PHI is updated twice a year and where possible habitats are mapped to polygons in OS Mastermap. These polygons are merged or split where necessary to create resulting habitat patches.

The PHI currently maps 27 terrestrial and freshwater priority habitats across England.
These being: Blanket bog (BLBOG), Calaminarian grassland (CALAM), Coastal & floodplain grazing marsh (CFPGM), Coastal saltmarsh (SALTM), Coastal sand dunes (CSDUN), Coastal vegetated shingle (CVSHI), Deciduous woodland (DWOOD), Limestone pavements (LPAVE), Lowland calcareous grassland (LCGRA), Lowland dry acid grassland (LDAGR), Lowland Fens (LFENS), Lowland heathland (LHEAT), Lowland meadows (LMEAD), Lowland raised bog (LRBOG), Maritime cliff & slope (MCSLP), Mountain heath & willow scrub (MHWSC), Mudflats (MUDFL), Purple moor grass & rush pastures (PMGRP), Reedbeds (RBEDS), Saline lagoons (SLAGO), Traditional orchards (TORCH), Upland calcareous grassland (UCGRA), Upland hay meadows (UHMEA), Upland heathland (UHEAT), Upland flushes, fens & swamps (UFFSW), Lakes (LAKES), Ponds (PONDS).

The PHI also includes four habitat classes which are not priority habitats, but which hold potential importance for conservation of biodiversity in England. These can indicate a mosaic of habitat which may contain priority habitats, have restoration potential and/or contribute to ecological networks. Where evidence indicates the presence of unmapped or fragmented priority habitats within such polygons, these are attributed as additional habitats.
These being: Fragmented heath (FHEAT), Grass moorland (GMOOR), Good quality semi-improved grassland (GQSIG), No main habitat (NMHAB).

For some polygons the PHI contains additional information about the main habitats in the form of feature descriptions and corresponding feature codes.
These being:
Priority Ponds and lakes - Oligotrophic lakes (OLIGO), Dystrophic lakes (DYSTR), Mesotrophic lakes (MESOT), Eutrophic standing waters (EUTRO), Ice age pond (ICEAG), Pond with floating mats (PWFLM)
Deciduous woodland – Upland Oakwood (UPOWD), Lowland beech and yew woodland (LBYWD), Upland mixed ashwoods (UMAWD), Wet Woodland (WETWD), Lowland mixed deciduous woodland (ASNWD), Plantations on ancient woodland (PAWDS)
Grassland – Countryside Stewardship Option (CSOPT), Waxcap grassland (WAXCP)
Heathland – Dry Heathland (DRYHL), Wet heathland (WETHL)
Coastal sand dunes – Dunes under coniferous woodland (CWDUN), Dunes under deciduous woodland (DWDUN)
General – Degraded (DEGRD)
 Attribution statement: © Natural England copyright. Contains Ordnance Survey data © Crown copyright and database right [year].`,
    owner: 'Natural England',
    dataType: 'Vector',
    accessLevel: 'Restricted access',
    updateFrequency: 'Not planned',
    categories: ['Environment'],
    updatedAt: '2025-10-23T00:00:00.000Z',
    lineage: 'All data is captured to the British National Grid using the OS MasterMap Topographic Layer.',
    contactPoint: 'data.services@naturalengland.org.uk',
    licence: 'Custom licence terms: There are no public access constraints to this data. Use of this data is subject to the Open Government Licence - https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/. Contains data created and provided by Cumbria Biodiversity Data Centre on behalf of Cumbria Wildlife Trust. The data has been extracted from Cumbria Wildlife Trust\'s Grassland Inventory and is used under the CC BY 4.0 International licence terms - https://creativecommons.org/licenses/by/4.0/ (https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/)',
    useLimitation: 'There are no public access constraints to this data. Use of this data is subject to the licence identified.',
    language: 'eng',
    keywords: ['Habitats and biotopes', 'landscape', 'Natural England', 'ecology', 'habitats'],
    format: [
      'Proprietary format | ESRI File based Geodatabase (GDB)',
      'Open format | GeoPackage (GPKG)',
      'Open format | Comma Separated Values file (CSV)',
      'Proprietary format | MS Excel (XLS)',
      'OGC Web Services | JavaScript Object Notation (JSON)',
      'Open format | Shapefile (SHP)'
    ],
    links: [
      { url: 'https://environment.data.gov.uk/api/file/download?fileDataSetId=d30e3fa2-5ca6-4851-b19d-1429ad9d84e0&fileName=PHI V3 Datasets.xlsx', name: 'PHI V3 Datasets.xlsx', description: 'PHI V3 Datasets.xlsx download on Defra Data Services Platform' },
      { url: 'https://environment.data.gov.uk/api/file/download?fileDataSetId=d30e3fa2-5ca6-4851-b19d-1429ad9d84e0&fileName=Priority_Habitats_Inventory_Attribute_Metadata.pdf', name: 'Priority_Habitats_Inventory_Attribute_Metadata.pdf', description: 'Priority_Habitats_Inventory_Attribute_Metadata.pdf download on Defra Data Services Platform' },
      { url: 'https://environment.data.gov.uk/api/file/download?fileDataSetId=d30e3fa2-5ca6-4851-b19d-1429ad9d84e0&fileName=Priority_Habitats_Inventory_England.gdb.zip', name: 'Priority_Habitats_Inventory_England.gdb.zip', description: 'Priority_Habitats_Inventory_England.gdb.zip download on Defra Data Services Platform' },
      { url: 'https://environment.data.gov.uk/api/file/download?fileDataSetId=d30e3fa2-5ca6-4851-b19d-1429ad9d84e0&fileName=Priority_Habitats_Inventory_England.geojson.zip', name: 'Priority_Habitats_Inventory_England.geojson.zip', description: 'Priority_Habitats_Inventory_England.geojson.zip download on Defra Data Services Platform' },
      { url: 'https://environment.data.gov.uk/api/file/download?fileDataSetId=d30e3fa2-5ca6-4851-b19d-1429ad9d84e0&fileName=Priority_Habitats_Inventory_England.gpkg.zip', name: 'Priority_Habitats_Inventory_England.gpkg.zip', description: 'Priority_Habitats_Inventory_England.gpkg.zip download on Defra Data Services Platform' },
      { url: 'https://environment.data.gov.uk/api/file/download?fileDataSetId=d30e3fa2-5ca6-4851-b19d-1429ad9d84e0&fileName=Priority_Habitats_Inventory_England.lyrx', name: 'Priority_Habitats_Inventory_England.lyrx', description: 'Priority_Habitats_Inventory_England.lyrx download on Defra Data Services Platform' },
      { url: 'https://environment.data.gov.uk/api/file/download?fileDataSetId=d30e3fa2-5ca6-4851-b19d-1429ad9d84e0&fileName=Priority_Habitats_Inventory_Spatial_Metadata.pdf', name: 'Priority_Habitats_Inventory_Spatial_Metadata.pdf', description: 'Priority_Habitats_Inventory_Spatial_Metadata.pdf download on Defra Data Services Platform' },
      { url: 'https://naturalengland-defra.opendata.arcgis.com/datasets/Defra::priority-habitats-inventory-england/about', name: 'Priority Habitats Inventory (England) - Natural England Open Data Geoportal page', description: 'Priority Habitats Inventory (England) - Natural England Open Data Geoportal page' },
      { url: 'https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/Priority_Habitats_Inventory_England/FeatureServer', name: 'Priority Habitats Inventory (England) - ESRI REST Feature Service API', description: 'Priority Habitats Inventory (England) - ESRI REST Feature Service API' },
      { url: 'https://environment.data.gov.uk/explore/92b43165-0dd0-4e69-a712-1e49bb5aa0d0?download=true', name: 'Priority Habitats Inventory (England) Download', description: 'Download data by area of interest' },
      { url: 'https://environment.data.gov.uk/spatialdata/priority-habitat-inventory-england/wms', name: 'Priority Habitats Inventory (England) WMS', description: 'Priority Habitats Inventory (England) Web Map Service' },
      { url: 'https://environment.data.gov.uk/spatialdata/priority-habitat-inventory-england/wfs', name: 'Priority Habitats Inventory (England) WFS', description: 'Priority Habitats Inventory (England) Web Feature Service' },
      { url: 'https://environment.data.gov.uk/spatialdata/priority-habitat-inventory-england/ogc/features/v1', name: 'OGC API - Features service', description: 'OGC API - Features service' }
    ],
    temporalExtent: { start: '2014-11-24', end: '2099-12-31' },
    coordinateReferenceSystem: 'https://www.opengis.net/def/crs/EPSG/0/27700',
    geographicExtent: { west: -8.655, south: 49.9, east: 1.79, north: 60.85 },
    publicationDate: null,
    creationDate: '2014-11-24T00:00:00.000Z'
  },
  // https://environment.data.gov.uk/dataset/2c8553c9-aa45-4666-9824-8ce0c7faf6a9
  {
    id: '2c8553c9-aa45-4666-9824-8ce0c7faf6a9',
    title: 'Reservoir Flood Extents (Individual)',
    abstract: `The data consists of separate packages of data for each large raised reservoir showing the flood extents for two scenarios; a "dry-day" and "wet-day".

The dry day scenario shows the flood extent in the event that the reservoir were to fail and release the water held on a "dry day" when local rivers are at normal levels.

This wet day scenario shows the flood extent in the event that the reservoir were to fail and release the water held on a "wet day" when local rivers had already overflowed their banks.

Each scenario represents a prediction of a credible worst case scenario, however it's unlikely that any actual flood would be this large. The data gives no indication of the likelihood or probability of reservoir flooding.

Flood extents are not included for smaller reservoirs or for reservoirs commissioned after the reservoir modelling programme began in October 2016. Attribution statement: © Environment Agency copyright and/or database right 2025. All rights reserved.`,
    owner: 'Environment Agency',
    dataType: 'Vector',
    accessLevel: 'Restricted access',
    updateFrequency: 'As needed',
    categories: ['Environment'],
    updatedAt: '2026-03-10T00:00:00.000Z',
    lineage: 'In 2010 the Environment Agency published the National Reservoir Inundation Maps. The maps provided an indication of the flooding that would occur if a failure of a reservoir embankment or structure led to an uncontrolled release of water.\nThe Environment Agency has reviewed, updated and improved the reservoir flood maps as part of the Reservoir Flood Mapping Project. These maps show the extent of flooding for 1865 large-raised reservoirs that were in operation in October 2016. New reservoirs after that date will be modelled under the next review of the flood maps, which is due in by 2025.',
    contactPoint: 'DSPcustomerforum@environment-agency.gov.uk',
    licence: 'Open Government Licence',
    useLimitation: 'There are no public access constraints to this data. Use of this data is subject to the licence identified.',
    language: 'eng',
    keywords: ['ESDA', 'Flood Risk', 'Flood risk assessment', 'Reservoirs'],
    format: [
      'Open format | Shapefile (SHP)',
      'Open format | Portable Document Format - Standardized (PDF)'
    ],
    links: [
      { url: 'https://environment.data.gov.uk/api/file/download?fileDataSetId=c2edb379-05b0-4e4b-8c1f-dde09e3d0bba&fileName=Data Version.txt', name: 'Data Version.txt', description: 'Data Version.txt download on Defra Data Services Platform' },
      { url: 'https://environment.data.gov.uk/api/file/download?fileDataSetId=c2edb379-05b0-4e4b-8c1f-dde09e3d0bba&fileName=Reservoir_Flood_Maps_Data_Guide.pdf', name: 'Reservoir_Flood_Maps_Data_Guide.pdf', description: 'Reservoir_Flood_Maps_Data_Guide.pdf download on Defra Data Services Platform' },
      { url: 'https://environment.data.gov.uk/reservoir-flood-maps', name: 'Reservoir Flood Map Search Facility', description: 'External version on Defra Data Services Platform' }
    ],
    temporalExtent: { start: '2021-09-02', end: '2099-12-31' },
    coordinateReferenceSystem: 'https://www.opengis.net/def/crs/EPSG/0/27700',
    geographicExtent: { west: -6.236, south: 49.943, east: 2.072, north: 55.816 },
    publicationDate: null,
    creationDate: '2021-09-02T00:00:00.000Z'
  },
  // https://environment.data.gov.uk/dataset/ba8dc201-66ef-4983-9d46-7378af21027e
  {
    id: 'ba8dc201-66ef-4983-9d46-7378af21027e',
    title: 'Sites of Special Scientific Interest (England)',
    abstract: 'A Site of Special Scientific Interest (SSSI) is the land notified as an SSSI under the Wildlife and Countryside Act (1981), as amended. Sites notified under the 1949 Act only are not included in the Data set. SSSI are the finest sites for wildlife and natural features in England, supporting many characteristic, rare and endangered species, habitats and natural features. The data do not include "proposed" sites. Boundaries are generally mapped against Ordnance Survey MasterMap. Attribution statement: © Natural England copyright. Contains Ordnance Survey data © Crown copyright and database right [year].',
    owner: 'Natural England',
    dataType: 'Vector',
    accessLevel: 'Restricted access',
    updateFrequency: 'Monthly',
    categories: ['Environment'],
    updatedAt: '2025-04-15T00:00:00.000Z',
    lineage: 'All data is captured to the Ordnance Survey National Grid sometimes called the British National Grid. OS MasterMap Topographic Layer - produced and supplied by Ordnance Survey from data at 1:1250, 1:2500 and 1:10000 surveying and mapping standards - is used as the primary source. Other sources - acquired internally and from external suppliers - may include aerial imagery at resolutions ranging from 25cm to 2m, Ordnance Survey 1:10000 raster images, historical OS mapping, charts and chart data from UK Hydrographic Office and other sources, scanned images of paper designation mapping (mostly originally produced at 1:10560 or 1:10000 scales), GPS and other surveyed data, and absolute coordinates. The data was first captured against an August 2002 cut of OS MasterMap Topography. Natural England has successfully uploaded an up-to-date version of OS MasterMap Topographic Layer. However, we have not yet updated our designated data holding to this new version of MasterMap. This should occur in the near future, when we will simultaneously apply positional accuracy improvement (PAI) to our data.',
    contactPoint: 'data.services@naturalengland.org.uk',
    licence: 'Open Government Licence',
    useLimitation: 'There are no public access constraints to this data. Use of this data is subject to the licence identified.',
    language: 'eng',
    keywords: ['Protected sites', 'landscape', 'Designations', 'ESDA', 'ecology'],
    format: [
      'Open format | Shapefile (SHP)',
      'Open format | Keyhole Markup Language (KML)'
    ],
    links: [
      { url: 'https://environment.data.gov.uk/api/file/download?fileDataSetId=2e2d1185-1acb-469d-9f88-9f54e2506a5d&fileName=Sites_of_Special_Scientific_Interest_England.gdb.zip', name: 'Sites_of_Special_Scientific_Interest_England.gdb.zip', description: 'Sites_of_Special_Scientific_Interest_England.gdb.zip download on Defra Data Services Platform' },
      { url: 'https://environment.data.gov.uk/api/file/download?fileDataSetId=2e2d1185-1acb-469d-9f88-9f54e2506a5d&fileName=Sites_of_Special_Scientific_Interest_England.geojson.zip', name: 'Sites_of_Special_Scientific_Interest_England.geojson.zip', description: 'Sites_of_Special_Scientific_Interest_England.geojson.zip download on Defra Data Services Platform' },
      { url: 'https://environment.data.gov.uk/api/file/download?fileDataSetId=2e2d1185-1acb-469d-9f88-9f54e2506a5d&fileName=Sites_of_Special_Scientific_Interest_England.gpkg.zip', name: 'Sites_of_Special_Scientific_Interest_England.gpkg.zip', description: 'Sites_of_Special_Scientific_Interest_England.gpkg.zip download on Defra Data Services Platform' },
      { url: 'https://environment.data.gov.uk/api/file/download?fileDataSetId=2e2d1185-1acb-469d-9f88-9f54e2506a5d&fileName=Sites_of_Special_Scientific_Interest_England.lyr', name: 'Sites_of_Special_Scientific_Interest_England.lyr', description: 'Sites_of_Special_Scientific_Interest_England.lyr download on Defra Data Services Platform' },
      { url: 'https://environment.data.gov.uk/api/file/download?fileDataSetId=2e2d1185-1acb-469d-9f88-9f54e2506a5d&fileName=Sites_of_Special_Scientific_Interest_England.shp.zip', name: 'Sites_of_Special_Scientific_Interest_England.shp.zip', description: 'Sites_of_Special_Scientific_Interest_England.shp.zip download on Defra Data Services Platform' },
      { url: 'https://naturalengland-defra.opendata.arcgis.com/datasets/Defra::sites-of-special-scientific-interest-england/about', name: 'Natural England Open Data Geoportal Page', description: 'Natural England Open Data Geoportal Page' },
      { url: 'https://environment.data.gov.uk/explore/ba8dc201-66ef-4983-9d46-7378af21027e?download=true', name: 'SitesOfSpecialScientificInterestEngland_Download', description: 'Download data by area of interest' },
      { url: 'https://environment.data.gov.uk/spatialdata/sites-of-special-scientific-interest-england/wfs', name: 'SitesOfSpecialScientificInterestEngland_WFS', description: 'Sites of Special Scientific Interest (England) WFS' },
      { url: 'https://environment.data.gov.uk/spatialdata/sites-of-special-scientific-interest-england/wms', name: 'SitesOfSpecialScientificInterestEngland_WMS', description: 'Sites of Special Scientific Interest (England) WMS' },
      { url: 'https://environment.data.gov.uk/spatialdata/sites-of-special-scientific-interest-england/ogc/features/v1', name: 'OGC API - Features service', description: 'OGC API - Features service' }
    ],
    temporalExtent: { start: '1970-01-01', end: '2099-12-31' },
    coordinateReferenceSystem: 'https://www.opengis.net/def/crs/EPSG/0/27700',
    geographicExtent: { west: -6.41736, south: 49.8625, east: 2.05827, north: 55.7447 },
    publicationDate: '2017-09-14T00:00:00.000Z',
    creationDate: '2024-11-15T00:00:00.000Z'
  },
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
    dataType: 'Vector',
    accessLevel: 'Open data',
    updateFrequency: 'Monthly',
    categories: ['Environment'],
    updatedAt: '2026-03-15T00:00:00.000Z',
    lineage: 'Between 1981 and 1982 the Nature Conservancy Council began to compile an inventory of ancient woodland for England and Wales. This Ancient Woodland Inventory (AWI) was originally produced on a county basis with reports and paper maps published as they became available. It has since been digitised to create a national dataset which has been administered by the NCC\'s successor bodies, English Nature and now Natural England.The majority of the south east counties were updated in a pilot project (2006 - 2014) and this area includes smaller woods for the first time, dropping the threshold to 0.25 hectares from the previously mapped two hectares threshold.Datasets used include:National Forest Index - Forest Commission, OS MasterMap (PSGA), Historic Ordnance Survey data including Ordnance Surveyor\'s Drawings, County Maps and First Series 1 inch maps to current editions - Landmark (bespoke licence), Priority Habitat Inventory - Natural England (OGL), Ancient Tree Inventory - Woodland Trust Aerial Photography (APGB agreement)',
    contactPoint: 'data.services@naturalengland.org.uk',
    licence: 'Open Government Licence',
    useLimitation: 'There are no public access constraints to this data. Use of this data is subject to the licence identified.',
    language: 'eng',
    keywords: ['Habitats and biotopes', 'landscape', 'Habitats', 'Natural England', 'Open Data', 'ecology'],
    format: [
      'Proprietary format | ESRI File based Geodatabase (GDB)',
      'Open format | Shapefile (SHP)'
    ],
    links: [
      { url: 'https://environment.data.gov.uk/api/file/download?fileDataSetId=008cdfcf-893b-48f6-937a-3891a2a698c9&fileName=Ancient_Woodland.lyr', name: 'Ancient_Woodland.lyr', description: 'Ancient_Woodland.lyr download on Defra Data Services Platform' },
      { url: 'https://environment.data.gov.uk/api/file/download?fileDataSetId=008cdfcf-893b-48f6-937a-3891a2a698c9&fileName=Ancient_Woodland.lyrx', name: 'Ancient_Woodland.lyrx', description: 'Ancient_Woodland.lyrx download on Defra Data Services Platform' },
      { url: 'https://environment.data.gov.uk/api/file/download?fileDataSetId=008cdfcf-893b-48f6-937a-3891a2a698c9&fileName=Ancient_Woodland_England-Attribute_Metadata.pdf', name: 'Ancient_Woodland_England-Attribute_Metadata.pdf', description: 'Ancient_Woodland_England-Attribute_Metadata.pdf download on Defra Data Services Platform' },
      { url: 'https://environment.data.gov.uk/api/file/download?fileDataSetId=008cdfcf-893b-48f6-937a-3891a2a698c9&fileName=Ancient_Woodland_England-Spatial_Metadata.pdf', name: 'Ancient_Woodland_England-Spatial_Metadata.pdf', description: 'Ancient_Woodland_England-Spatial_Metadata.pdf download on Defra Data Services Platform' },
      { url: 'https://environment.data.gov.uk/api/file/download?fileDataSetId=008cdfcf-893b-48f6-937a-3891a2a698c9&fileName=Ancient_Woodland_England.gdb.zip', name: 'Ancient_Woodland_England.gdb.zip', description: 'Ancient_Woodland_England.gdb.zip download on Defra Data Services Platform' },
      { url: 'https://environment.data.gov.uk/api/file/download?fileDataSetId=008cdfcf-893b-48f6-937a-3891a2a698c9&fileName=Ancient_Woodland_England.geojson.zip', name: 'Ancient_Woodland_England.geojson.zip', description: 'Ancient_Woodland_England.geojson.zip download on Defra Data Services Platform' },
      { url: 'https://environment.data.gov.uk/api/file/download?fileDataSetId=008cdfcf-893b-48f6-937a-3891a2a698c9&fileName=Ancient_Woodland_England.gpkg.zip', name: 'Ancient_Woodland_England.gpkg.zip', description: 'Ancient_Woodland_England.gpkg.zip download on Defra Data Services Platform' },
      { url: 'https://environment.data.gov.uk/api/file/download?fileDataSetId=008cdfcf-893b-48f6-937a-3891a2a698c9&fileName=Ancient_Woodland_England.shp.zip', name: 'Ancient_Woodland_England.shp.zip', description: 'Ancient_Woodland_England.shp.zip download on Defra Data Services Platform' },
      { url: 'https://environment.data.gov.uk/api/file/download?fileDataSetId=008cdfcf-893b-48f6-937a-3891a2a698c9&fileName=Ancient_Woodland_Inventory_Handbook.url', name: 'Ancient_Woodland_Inventory_Handbook.url', description: 'Ancient_Woodland_Inventory_Handbook.url download on Defra Data Services Platform' },
      { url: 'https://environment.data.gov.uk/api/file/download?fileDataSetId=008cdfcf-893b-48f6-937a-3891a2a698c9&fileName=Open_Government_Licence.url', name: 'Open_Government_Licence.url', description: 'Open_Government_Licence.url download on Defra Data Services Platform' },
      { url: 'https://environment.data.gov.uk/spatialdata/ancient-woodland-england/wms', name: 'Ancient Woodland (England) - WMS', description: 'Ancient Woodland (England) - WMS' },
      { url: 'https://environment.data.gov.uk/explore/f425f1e1-fc18-4b5a-88d8-76934125627c?download=true', name: 'Ancient Woodland (England) - Download by area of interest', description: 'Ancient Woodland (England) - Download by area of interest' },
      { url: 'https://environment.data.gov.uk/spatialdata/ancient-woodland-england/wfs', name: 'Ancient Woodland (England) - WFS', description: 'Ancient Woodland (England) - WFS' },
      { url: 'https://naturalengland-defra.opendata.arcgis.com/datasets/ancient-woodland-england', name: 'Ancient Woodland (England) - Natural England Open Data Geoportal page', description: 'Ancient Woodland (England) - Natural England Open Data Geoportal page' },
      { url: 'https://s3-eu-west-1.amazonaws.com/data.defra.gov.uk/Natural_England/Habitat_Species/Habitats/Ancient_Woodland_England_NE/Ancient_Woodland_England_Docs.zip', name: 'Ancient Woodland (England) - Guidance documents', description: 'Ancient Woodland (England) - Guidance documents' },
      { url: 'https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/Ancient_Woodland_England/FeatureServer', name: 'Ancient Woodland (England) - ESRI REST Feature Service API', description: 'Ancient Woodland (England) - ESRI REST Feature Service API' },
      { url: 'https://environment.data.gov.uk/spatialdata/ancient-woodland-england/ogc/features/v1', name: 'Ancient Woodland (England) - OGC API - Features service', description: 'Ancient Woodland (England) - OGC API - Features service' }
    ],
    temporalExtent: { start: '2013-01-01', end: '2099-12-31' },
    coordinateReferenceSystem: 'https://www.opengis.net/def/crs/EPSG/0/27700',
    geographicExtent: { west: -6.375, south: 49.9, east: 1.79, north: 55.82 },
    publicationDate: null,
    creationDate: '2013-01-01T00:00:00.000Z'
  },
  // https://environment.data.gov.uk/dataset/13787b9a-26a4-4775-8523-806d13af58fc
  {
    id: '13787b9a-26a4-4775-8523-806d13af58fc',
    title: 'LIDAR Composite Digital Terrain Model (DTM) - 1m',
    abstract: `The LIDAR Composite DTM (Digital Terrain Model) is a raster elevation model covering ~99% of England at 1m spatial resolution. The DTM (Digital Terrain Model) is produced from the last or only laser pulse returned to the sensor. We remove surface objects from the Digital Surface Model (DSM), using bespoke algorithms and manual editing of the data, to produce a terrain model of just the surface.

Produced by the Environment Agency in 2022, the DTM is derived from a combination of our Time Stamped archive and National LIDAR Programme surveys, which have been merged and re-sampled to give the best possible coverage. Where repeat surveys have been undertaken the newest, best resolution data is used. Where data was resampled a bilinear interpolation was used before being merged.

The 2022 LIDAR Composite contains surveys undertaken between 6th June 2000 and 2nd April 2022. Please refer to the metadata index catalgoues which show for any location which survey was used in the production of the LIDAR composite.

The data is available to download as GeoTiff rasters in 5km tiles aligned to the OS National grid. The data is presented in metres, referenced to Ordinance Survey Newlyn and using the OSTN'15 transformation method. All individual LIDAR surveys going into the production of the composite had a vertical accuracy of +/-15cm RMSE. Attribution statement: © Environment Agency copyright and/or database right 2022. All rights reserved.`,
    owner: 'Environment Agency',
    dataType: 'Grid',
    accessLevel: 'Restricted access',
    updateFrequency: 'Annually',
    categories: ['Environment', 'Elevation'],
    updatedAt: '2023-12-15T00:00:00.000Z',
    lineage: 'Light Detection and Ranging (LIDAR) is an airborne mapping technique, which uses a laser to measure the height of the terrain and surface objects on the ground such as trees and buildings. Hundreds of thousands of measurements per second are made of the ground allowing highly detailed terrain models to be generated at spatial resolutions of between 25cm and 2 metres. The vertical accuracy of the LIDAR dataset is +/-15cm RMSE.',
    contactPoint: 'DSPcustomerforum@environment-agency.gov.uk',
    licence: 'Open Government Licence',
    useLimitation: 'There are no public access constraints to this data. Use of this data is subject to the licence identified.',
    language: 'eng',
    keywords: ['LIDAR'],
    format: [
      'Open format | Geo Tagged Image File Format (GeoTIFF)'
    ],
    links: [
      { url: 'https://environment.data.gov.uk/DefraDataDownload/?Mode=survey', name: 'Survey Data - Download', description: 'Download the survey data' },
      { url: 'https://environment.data.gov.uk/explore/9f0fa3fc-a860-4729-adc9-47fe53f658d0?download=true', name: 'Metadata Survey Index Catalogues - Download', description: 'Download the survey coverage metadata files' },
      { url: 'https://environment.data.gov.uk/spatialdata/lidar-composite-digital-terrain-model-dtm-1m/wms?request=GetCapabilities&service=WMS&version=1.3.0', name: 'LIDAR Composite Digital Terrain Model (DTM) - 1m - WMS', description: 'LIDAR Composite Digital Terrain Model (DTM) - 1m - WMS' },
      { url: 'https://environment.data.gov.uk/spatialdata/lidar-composite-digital-terrain-model-dtm-1m/wcs?request=GetCapabilities&service=WCS&version=2.0.1', name: 'LIDAR Composite Digital Terrain Model (DTM) - 1m - WCS', description: 'LIDAR Composite Digital Terrain Model (DTM) - 1m - WCS' },
      { url: 'https://environment.data.gov.uk/spatialdata/survey-index-files/wms?request=GetCapabilities&service=WMS', name: 'Metadata Survey Index Catalogues - WMS', description: 'Metadata Survey Index Catalogues - WMS' },
      { url: 'https://environment.data.gov.uk/spatialdata/survey-index-files/wfs?request=GetCapabilities&service=WFS', name: 'Metadata Survey Index Catalogues - WFS', description: 'Metadata Survey Index Catalogues - WFS' },
      { url: 'https://environment.data.gov.uk/support/faqs/275879146', name: 'Survey Data FAQs', description: 'Survey Data FAQs' },
      { url: 'https://environment.data.gov.uk/spatialdata/lidar-composite-digital-terrain-model-dtm-1m/wmts?request=GetCapabilities&service=WMTS&version=2.0.1', name: 'LIDAR Composite Digital Terrain Model (DTM) - 1m - WMTS', description: 'LIDAR Composite Digital Terrain Model (DTM) - 1m - WMTS' },
      { url: 'https://environment.data.gov.uk/spatialdata/survey-index-files/ogc/features/v1', name: 'OGC API - Features service', description: 'OGC API - Features service' }
    ],
    temporalExtent: { start: '2000-06-06', end: '2022-04-02' },
    coordinateReferenceSystem: 'https://www.opengis.net/def/crs/EPSG/0/27700',
    geographicExtent: { west: -6.236, south: 49.943, east: 2.072, north: 55.816 },
    publicationDate: null,
    creationDate: '2023-02-08T00:00:00.000Z'
  }
]

export { curatedRecords }
