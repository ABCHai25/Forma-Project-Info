/**
 * Type definitions for 3D model generation API
 * These interfaces define the contract for generating 3D tree models from detection results
 */

import type { IndividualTree, PopulatedTree } from './treeDetection.types';

/**
 * Request to generate 3D model from detected trees
 */
export interface Model3DRequest {
  trees: (IndividualTree | PopulatedTree)[];  // All trees to include in model
  bbox: {
    width: number;   // terrain width in meters
    height: number;  // terrain height in meters
  };
  heightMap?: string;  // Optional: base64 encoded height map for terrain variation
}

/**
 * Single tree in 3D model with spatial properties
 */
export interface Tree3DModel {
  positionM: [number, number, number];  // [x, y, z] in meters (z = height above ground)
  height: number;                       // tree height in meters
  canopyRadius: number;                 // canopy radius in meters
  trunkRadius: number;                  // trunk radius in meters
}

/**
 * Complete 3D model generation result
 */
export interface Model3DGenerationResult {
  modelUrl: string;           // URL to download OBJ file
  materialUrl?: string;       // URL to MTL material file
  textureUrl?: string;        // URL to texture image file
  trees: Tree3DModel[];       // Array of all trees with 3D properties
  metadata: {
    totalTrees: number;       // number of tree instances in model
    totalVertices: number;    // total vertex count
    totalFaces: number;       // total polygon/face count
    generationTimeMs: number; // time taken to generate model
    timestamp: string;        // ISO 8601 timestamp
  };
}

/**
 * Model download information
 */
export interface ModelDownloadInfo {
  filename: string;
  format: 'obj' | 'gltf' | 'glb';
  sizeBytes: number;
  url: string;
}

/**
 * Error response from 3D model generation API
 */
export interface ModelGenerationError {
  error: string;
  message: string;
  details?: unknown;
}
