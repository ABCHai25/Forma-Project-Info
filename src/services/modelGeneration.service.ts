/**
 * 3D model generation service - API calls to Python backend for 3D model creation
 */

import type { 
  Model3DRequest, 
  Model3DGenerationResult 
} from '../types/model3D.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * Generate 3D model from detected trees
 * 
 * @param request - Tree data and terrain dimensions
 * @returns 3D model files (OBJ, MTL, textures) with metadata
 */
export async function generate3DModel(
  request: Model3DRequest
): Promise<Model3DGenerationResult> {
  console.log('🏗️ Calling 3D model generation API...');
  console.log('Trees to generate:', request.trees.length);
  console.log('Terrain dimensions:', request.bbox);

  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-model`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `3D model generation failed (${response.status})`);
    }

    const result = await response.json();
    console.log('✅ 3D model generated:', result);
    return result;
  } catch (err) {
    console.error('❌ 3D model generation error:', err);
    throw err;
  }
}

/**
 * Download 3D model file to user's computer
 * 
 * @param url - URL to model file (OBJ, MTL, texture)
 * @param filename - Desired filename for download
 */
export function downloadModel(url: string, filename: string): void {
  console.log('⬇️ Downloading model:', filename);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log('✅ Download initiated');
}

/**
 * Get model generation status (for async/polling operations - future use)
 * 
 * @param modelId - Model ID from initial generation request
 * @returns Model generation result or status update
 */
export async function getModelStatus(modelId: string): Promise<Model3DGenerationResult> {
  console.log('🔍 Checking model generation status:', modelId);

  const response = await fetch(`${API_BASE_URL}/api/generate-model/${modelId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get model status');
  }

  return await response.json();
}
