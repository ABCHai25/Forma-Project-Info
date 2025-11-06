/**
 * Tree detection service - API calls to Python backend for tree detection
 */

import type { 
  HSVThresholds, 
  DetectionParameters, 
  TreeDetectionResult,
  ImageDimensions
} from '../types/treeDetection.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * Detect trees in a satellite image using HSV color thresholding
 * 
 * @param imageUrl - Data URL or blob URL of the satellite image
 * @param hsvThresholds - HSV color range for tree detection
 * @param detectionParams - Tree size constraints and clustering rules
 * @param realDimensions - Real-world dimensions in meters for coordinate conversion
 * @returns Tree detection results with positions, areas, and mask
 */
export async function detectTrees(
  imageUrl: string,
  hsvThresholds: HSVThresholds,
  detectionParams: DetectionParameters,
  realDimensions: ImageDimensions
): Promise<TreeDetectionResult> {
  console.log('🌳 Calling tree detection API...');
  console.log('HSV Thresholds:', hsvThresholds);
  console.log('Detection Params:', detectionParams);
  console.log('Real Dimensions:', realDimensions);

  // Create AbortController for timeout management (10 minutes for large tiles)
  const controller = new AbortController();
  const timeoutMs = 600000; // 10 minutes
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Convert image to blob for upload
    const blob = await convertDataUrlToBlob(imageUrl);
    
    // Create form data with image and parameters
    const formData = new FormData();
    formData.append('image', blob, 'satellite_tile.png');
    formData.append('hue_min', hsvThresholds.hue.min.toString());
    formData.append('hue_max', hsvThresholds.hue.max.toString());
    formData.append('sat_min', hsvThresholds.saturation.min.toString());
    formData.append('sat_max', hsvThresholds.saturation.max.toString());
    formData.append('val_min', hsvThresholds.value.min.toString());
    formData.append('val_max', hsvThresholds.value.max.toString());
    formData.append('min_diameter', detectionParams.minTreeDiameter.toString());
    formData.append('max_diameter', detectionParams.maxTreeDiameter.toString());
    formData.append('cluster_threshold', detectionParams.clusterThreshold.toString());
    formData.append('real_width', realDimensions.width.toString());
    formData.append('real_height', realDimensions.height.toString());

    const response = await fetch(`${API_BASE_URL}/api/detect-trees`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Tree detection failed (${response.status})`);
    }

    const result = await response.json();
    console.log('✅ Tree detection completed:', result);
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    
    // Handle timeout specifically
    if (err instanceof Error && err.name === 'AbortError') {
      console.error('❌ Tree detection timeout (10 minutes exceeded)');
      throw new Error('Tree detection timeout (10 minutes exceeded) - tile may be too large. Try reducing the tile size or adjusting detection parameters.');
    }
    
    console.error('❌ Tree detection error:', err);
    throw err;
  }
}

/**
 * Convert data URL or blob URL to Blob for file upload
 * 
 * @param dataURL - Data URL (base64) or blob URL
 * @returns Blob object
 */
async function convertDataUrlToBlob(dataURL: string): Promise<Blob> {
  if (dataURL.startsWith('blob:')) {
    // Already a blob URL, fetch it
    const response = await fetch(dataURL);
    return await response.blob();
  }

  // Convert base64 data URL to blob
  const response = await fetch(dataURL);
  return await response.blob();
}

/**
 * Get detection status (for async/polling operations - future use)
 * 
 * @param taskId - Task ID from initial detection request
 * @returns Detection result or status update
 */
export async function getDetectionStatus(taskId: string): Promise<TreeDetectionResult> {
  console.log('🔍 Checking detection status:', taskId);

  const response = await fetch(`${API_BASE_URL}/api/detect-trees/${taskId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get detection status');
  }

  return await response.json();
}
