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
    updatedAt: '2025-10-23T00:00:00.000Z'
  },
  // https://environment.data.gov.uk/dataset/2c8553c9-aa45-4666-9824-8ce0c7faf6a9
  {
    id: '2c8553c9-aa45-4666-9824-8ce0c7faf6a9',
    title: 'Reservoir Flood Extents (Individual)',
    abstract: `The data consists of separate packages of data for each large raised reservoir showing the flood extents for two scenarios; a “dry-day” and “wet-day”.

The dry day scenario shows the flood extent in the event that the reservoir were to fail and release the water held on a “dry day” when local rivers are at normal levels.

This wet day scenario shows the flood extent in the event that the reservoir were to fail and release the water held on a “wet day” when local rivers had already overflowed their banks.

Each scenario represents a prediction of a credible worst case scenario, however it’s unlikely that any actual flood would be this large. The data gives no indication of the likelihood or probability of reservoir flooding. 

Flood extents are not included for smaller reservoirs or for reservoirs commissioned after the reservoir modelling programme began in October 2016. Attribution statement: © Environment Agency copyright and/or database right 2025. All rights reserved.`,
    owner: 'Environment Agency',
    dataType: 'Vector',
    updatedAt: '2026-03-10T00:00:00.000Z'
  },
  // https://environment.data.gov.uk/dataset/ba8dc201-66ef-4983-9d46-7378af21027e
  {
    id: 'ba8dc201-66ef-4983-9d46-7378af21027e',
    title: 'Sites of Special Scientific Interest (England)',
    abstract: 'A Site of Special Scientific Interest (SSSI) is the land notified as an SSSI under the Wildlife and Countryside Act (1981), as amended. Sites notified under the 1949 Act only are not included in the Data set. SSSI are the finest sites for wildlife and natural features in England, supporting many characteristic, rare and endangered species, habitats and natural features. The data do not include "proposed" sites. Boundaries are generally mapped against Ordnance Survey MasterMap. Attribution statement: © Natural England copyright. Contains Ordnance Survey data © Crown copyright and database right [year].',
    owner: 'Natural England',
    dataType: 'Vector',
    updatedAt: '2025-04-15T00:00:00.000Z'
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
    updatedAt: '2026-03-15T00:00:00.000Z'
  },
  // https://environment.data.gov.uk/dataset/13787b9a-26a4-4775-8523-806d13af58fc
  {
    id: '13787b9a-26a4-4775-8523-806d13af58fc',
    title: 'LIDAR Composite Digital Terrain Model (DTM) - 1m',
    abstract: `The LIDAR Composite DTM (Digital Terrain Model) is a raster elevation model covering ~99% of England at 1m spatial resolution. The DTM (Digital Terrain Model) is produced from the last or only laser pulse returned to the sensor. We remove surface objects from the Digital Surface Model (DSM), using bespoke algorithms and manual editing of the data, to produce a terrain model of just the surface.

Produced by the Environment Agency in 2022, the DTM is derived from a combination of our Time Stamped archive and National LIDAR Programme surveys, which have been merged and re-sampled to give the best possible coverage. Where repeat surveys have been undertaken the newest, best resolution data is used. Where data was resampled a bilinear interpolation was used before being merged.

The 2022 LIDAR Composite contains surveys undertaken between 6th June 2000 and 2nd April 2022. Please refer to the metadata index catalgoues which show for any location which survey was used in the production of the LIDAR composite.

The data is available to download as GeoTiff rasters in 5km tiles aligned to the OS National grid. The data is presented in metres, referenced to Ordinance Survey Newlyn and using the OSTN’15 transformation method. All individual LIDAR surveys going into the production of the composite had a vertical accuracy of +/-15cm RMSE. Attribution statement: © Environment Agency copyright and/or database right 2022. All rights reserved.`,
    owner: 'Environment Agency',
    dataType: 'Grid',
    updatedAt: '2023-12-15T00:00:00.000Z'
  }
]

export { curatedRecords }
