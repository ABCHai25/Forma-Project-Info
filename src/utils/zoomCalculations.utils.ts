/**
 * Zoom calculation utilities for Mapbox tiles
 */

import type { BBox, ImageSize } from '../types/geometry.types';

/**
 * Calculate image dimensions from bbox aspect ratio
 */
export function calculateImageDimensions(
  bbox: BBox,
  maxSize: number = 1280
): ImageSize {
  const bboxWidth = Math.abs(bbox.east - bbox.west);
  const bboxHeight = Math.abs(bbox.north - bbox.south);
  const aspectRatio = bboxWidth / bboxHeight;
  
  let width: number;
  let height: number;
  
  if (aspectRatio > 1) {
    // Wider than tall
    width = maxSize;
    height = Math.round(maxSize / aspectRatio);
  } else {
    // Taller than wide
    height = maxSize;
    width = Math.round(maxSize * aspectRatio);
  }
  
  // Ensure both dimensions are valid for Mapbox (max 1280)
  width = Math.min(width, 1280);
  height = Math.min(height, 1280);
  
  console.log(`Image dimensions: ${width}×${height} (aspect ratio: ${aspectRatio.toFixed(3)})`);
  return { width, height };
}

/**
 * Calculate optimal zoom level based on desired meters per pixel
 * Formula: zoom = log2((earthCircumference/256) / desiredMPP / cos(lat))
 */
export function calculateOptimalZoom(
  bboxMeters: { width: number; height: number },
  outputPixels: { width: number; height: number },
  centerLat: number
): number {
  // Calculate desired meters per pixel (use the dimension that needs higher resolution)
  const desiredMPP = Math.min(
    bboxMeters.width / outputPixels.width,
    bboxMeters.height / outputPixels.height
  );
  
  // Earth's circumference in meters / tile size at zoom 0
  const earthCircumferenceAt0 = 40075017 / 256;
  
  // Account for latitude distortion in Web Mercator
  const latRadians = centerLat * Math.PI / 180;
  const cosLat = Math.cos(latRadians);
  
  // Calculate zoom level
  const zoom = Math.log2(earthCircumferenceAt0 / desiredMPP / cosLat);
  
  // Round to nearest integer zoom level
  const roundedZoom = Math.round(zoom);
  
  console.log(`Calculated optimal zoom: ${zoom.toFixed(2)} → ${roundedZoom}`);
  console.log(`  Desired m/px: ${desiredMPP.toFixed(3)}`);
  console.log(`  At zoom ${roundedZoom}: ${(earthCircumferenceAt0 / Math.pow(2, roundedZoom) / cosLat).toFixed(3)} m/px`);
  
  return roundedZoom;
}
