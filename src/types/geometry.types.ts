/**
 * Geometry and Coordinate Types
 * Extracted from App.tsx - Phase 1.1
 */

/**
 * Normalized bounding box (offsets from reference point in meters)
 */
export type BBox = {
  west: number;
  south: number;
  east: number;
  north: number;
  crs?: string;
};

/**
 * 2D dimensions
 */
export type Dimensions = {
  width: number;
  length: number;
};

/**
 * Image size in pixels
 */
export type ImageSize = {
  width: number;
  height: number;
};

/**
 * 2D point (pixel coordinates or lat/lon)
 */
export type Point = {
  x: number;
  y: number;
};

/**
 * Geographic coordinate
 */
export type LatLon = {
  lat: number;
  lon: number;
};
