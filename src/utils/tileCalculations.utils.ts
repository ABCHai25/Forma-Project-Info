/**
 * Tile calculation utilities for Web Mercator projection
 */

import type { Point } from '../types/geometry.types';

/**
 * Convert longitude to tile X coordinate at given zoom
 */
export function lon2tile(lon: number, zoom: number): number {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

/**
 * Convert latitude to tile Y coordinate at given zoom
 */
export function lat2tile(lat: number, zoom: number): number {
  const n = Math.pow(2, zoom);
  return Math.floor(
    (1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2 * n
  );
}

/**
 * Convert lat/lon to global pixel coordinates in the tile grid
 */
export function lonLatToGlobalPixel(lon: number, lat: number, zoom: number, tilePx: number): Point {
  const n = Math.pow(2, zoom);
  const x = (lon + 180) / 360 * n * tilePx;
  const sin = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * n * tilePx;
  return { x, y };
}
