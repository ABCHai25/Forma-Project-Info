/**
 * Geometry utility functions for bounding box calculations
 */

import type { BBox, Dimensions } from '../types/geometry.types';

/**
 * Calculate the area of a bounding box in square meters
 */
export function calculateArea(bbox: BBox): number {
  const width = Math.abs(bbox.east - bbox.west);
  const height = Math.abs(bbox.north - bbox.south);
  return width * height;
}

/**
 * Calculate the dimensions (width and length) of a bounding box
 */
export function calculateDimensions(bbox: BBox): Dimensions {
  return {
    width: Math.abs(bbox.east - bbox.west),
    length: Math.abs(bbox.north - bbox.south)
  };
}
