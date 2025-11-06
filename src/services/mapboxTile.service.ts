/**
 * Mapbox tile fetching and stitching service
 * Handles raster tile fetching from Mapbox WMTS API
 */

import { lon2tile, lat2tile, lonLatToGlobalPixel } from '../utils/tileCalculations.utils';
import { loadImage } from '../utils/imageProcessing.utils';

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const TILE_PX = 512; // @2x tiles (512×512 instead of 256×256)

/**
 * Fetch and stitch raster tiles from Mapbox
 * Returns a canvas with the stitched image cropped precisely to the bbox
 */
export async function fetchAndStitchRasterTiles(
  bboxLatLon: [number, number, number, number],
  zoom: number,
  outputDimensions: { width: number; height: number }
): Promise<string> {
  const [west, south, east, north] = bboxLatLon;
  
  console.log(`Fetching tiles at zoom ${zoom} for bbox:`, bboxLatLon);
  
  // Calculate tile range
  const xMin = lon2tile(west, zoom);
  const xMax = lon2tile(east, zoom);
  const yMin = lat2tile(north, zoom); // North has smaller Y
  const yMax = lat2tile(south, zoom); // South has larger Y
  
  const tilesX = xMax - xMin + 1;
  const tilesY = yMax - yMin + 1;
  
  console.log(`Tile range: X[${xMin}-${xMax}] (${tilesX} tiles), Y[${yMin}-${yMax}] (${tilesY} tiles)`);
  
  // Create canvas for stitching all tiles
  const stitchedCanvas = document.createElement('canvas');
  stitchedCanvas.width = tilesX * TILE_PX;
  stitchedCanvas.height = tilesY * TILE_PX;
  const stitchedCtx = stitchedCanvas.getContext('2d')!;
  stitchedCtx.imageSmoothingEnabled = false;
  
  // Fetch and stitch all tiles
  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const x = xMin + tx;
      const y = yMin + ty;
      const tileUrl = `https://api.mapbox.com/v4/mapbox.satellite/${zoom}/${x}/${y}@2x.png?access_token=${MAPBOX_ACCESS_TOKEN}`;
      
      try {
        const img = await loadImage(tileUrl);
        stitchedCtx.drawImage(img, tx * TILE_PX, ty * TILE_PX);
      } catch (err) {
        console.warn(`Failed to load tile ${x},${y}:`, err);
        // Continue with other tiles
      }
    }
  }
  
  console.log(`Stitched ${tilesX * tilesY} tiles into ${stitchedCanvas.width}×${stitchedCanvas.height} canvas`);
  
  // Calculate precise pixel crop coordinates within stitched canvas
  const topLeftGlobal = lonLatToGlobalPixel(west, north, zoom, TILE_PX);
  const botRightGlobal = lonLatToGlobalPixel(east, south, zoom, TILE_PX);
  const originGlobal = { x: xMin * TILE_PX, y: yMin * TILE_PX };
  
  const cropX = Math.round(topLeftGlobal.x - originGlobal.x);
  const cropY = Math.round(topLeftGlobal.y - originGlobal.y);
  const cropW = Math.round(botRightGlobal.x - topLeftGlobal.x);
  const cropH = Math.round(botRightGlobal.y - topLeftGlobal.y);
  
  console.log(`Cropping to precise bbox: [${cropX}, ${cropY}, ${cropW}×${cropH}]`);
  
  // Create output canvas with exact output dimensions
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = outputDimensions.width;
  outputCanvas.height = outputDimensions.height;
  const outputCtx = outputCanvas.getContext('2d')!;
  outputCtx.imageSmoothingEnabled = true;
  outputCtx.imageSmoothingQuality = 'high';
  
  // Draw cropped region scaled to output dimensions
  outputCtx.drawImage(
    stitchedCanvas,
    cropX, cropY, cropW, cropH,
    0, 0, outputCanvas.width, outputCanvas.height
  );
  
  console.log(`Output canvas: ${outputCanvas.width}×${outputCanvas.height}`);
  
  // Convert to blob URL for further processing
  return new Promise((resolve, reject) => {
    outputCanvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create blob from canvas'));
        return;
      }
      const blobUrl = URL.createObjectURL(blob);
      resolve(blobUrl);
    }, 'image/png');
  });
}
