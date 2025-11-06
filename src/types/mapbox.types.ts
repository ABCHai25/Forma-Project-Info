/**
 * Mapbox Related Types
 * Extracted from App.tsx - Phase 1.1
 */

/**
 * Mapbox tile data with image URL and metadata
 */
export type MapboxData = {
  center: { latitude: number; longitude: number };
  zoom: number;
  style: string;
  size: { width: number; height: number };
  bbox: { west: number; south: number; east: number; north: number };
  url: string;
};
