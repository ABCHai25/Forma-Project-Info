/**
 * Coordinate transformation utilities using proj4
 */

import proj4 from 'proj4';
import type { BBox, LatLon } from '../types/geometry.types';

/**
 * Convert UTM coordinates to WGS84 lat/lon
 */
export function utmToLatLon(
  utmEasting: number,
  utmNorthing: number,
  projString: string
): LatLon {
  // WGS84 lat/lon projection
  const projWgs84 = "+proj=longlat +datum=WGS84 +no_defs +type=crs";
  
  // Convert
  const [lon, lat] = proj4(projString, projWgs84, [utmEasting, utmNorthing]);
  
  return { lat, lon };
}

/**
 * Transform terrain bbox from UTM offsets to WGS84 lat/lon
 */
export function transformBboxCorrectly(
  terrainBounds: BBox, // Offsets in meters from refPoint
  refPointUTM: [number, number], // Absolute UTM coordinates [easting, northing]
  projString: string
): {
  corners: LatLon[];
  bboxLatLon: [number, number, number, number]; // [west, south, east, north]
} {
  const [refEasting, refNorthing] = refPointUTM;
  
  console.log('Reference Point (absolute UTM):', refPointUTM);
  console.log('Terrain Bounds (relative offsets from refPoint):', terrainBounds);
  console.log('Projection string:', projString);
  
  // Step 1: Calculate corner coordinates in UTM
  const cornersAbsoluteUTM = [
    { 
      easting: refEasting + terrainBounds.west, 
      northing: refNorthing + terrainBounds.south 
    }, // SW
    { 
      easting: refEasting + terrainBounds.west, 
      northing: refNorthing + terrainBounds.north 
    }, // NW
    { 
      easting: refEasting + terrainBounds.east, 
      northing: refNorthing + terrainBounds.north 
    }, // NE
    { 
      easting: refEasting + terrainBounds.east, 
      northing: refNorthing + terrainBounds.south 
    }, // SE
  ];
  
  console.log('Corner coordinates (absolute UTM):', cornersAbsoluteUTM);
  
  // Step 2: Convert each corner from UTM to lat/lon
  const cornersLatLon = cornersAbsoluteUTM.map(corner => 
    utmToLatLon(corner.easting, corner.northing, projString)
  );
  
  console.log('Corner coordinates (WGS84 lat/lon):', cornersLatLon);
  
  // Step 3: Create axis-aligned bbox from corners
  const lats = cornersLatLon.map(c => c.lat);
  const lons = cornersLatLon.map(c => c.lon);
  
  const bboxLatLon: [number, number, number, number] = [
    Math.min(...lons), // west (min longitude)
    Math.min(...lats), // south (min latitude)
    Math.max(...lons), // east (max longitude)
    Math.max(...lats)  // north (max latitude)
  ];
  
  console.log('Axis-aligned bbox (WGS84):', bboxLatLon);
  
  return { corners: cornersLatLon, bboxLatLon };
}
