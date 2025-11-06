/**
 * Tree detection pipeline hook - manages state and orchestration for tree detection workflow
 * Follows Phase 1 hook patterns: encapsulates state, provides actions, handles errors
 */

import { useState } from 'react';
import type { HSVThresholds, DetectionParameters, TreeDetectionResult } from '../types/treeDetection.types';
import type { Model3DGenerationResult } from '../types/model3D.types';
import { detectTrees } from '../services/treeDetection.service';
import { generate3DModel } from '../services/modelGeneration.service';
import type { BBox } from '../types/geometry.types';

// Default HSV values for green vegetation (from Python script)
const DEFAULT_HSV: HSVThresholds = {
  hue: { min: 25, max: 99 },
  saturation: { min: 40, max: 255 },
  value: { min: 40, max: 70 }
};

const DEFAULT_PARAMS: DetectionParameters = {
  minTreeDiameter: 2.0,    // meters
  maxTreeDiameter: 15.0,   // meters
  clusterThreshold: 15.0   // meters
};

/**
 * Custom hook for tree detection and 3D model generation pipeline
 * 
 * @returns State and actions for tree detection workflow
 */
export function useTreePipeline() {
  const [status, setStatus] = useState<string>("");
  const [hsvThresholds, setHsvThresholds] = useState<HSVThresholds>(DEFAULT_HSV);
  const [detectionParams, setDetectionParams] = useState<DetectionParameters>(DEFAULT_PARAMS);
  const [detectionResult, setDetectionResult] = useState<TreeDetectionResult | null>(null);
  const [modelResult, setModelResult] = useState<Model3DGenerationResult | null>(null);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [isGeneratingModel, setIsGeneratingModel] = useState<boolean>(false);

  /**
   * Detect trees in the current tile image
   * 
   * @param imageUrl - Data URL or blob URL of the satellite tile
   * @param bbox - Terrain bounding box for real-world dimensions
   */
  const detectTreesInTile = async (
    imageUrl: string,
    bbox: BBox
  ): Promise<void> => {
    setStatus("🔍 Detecting trees...");
    setDetectionResult(null);
    setIsDetecting(true);

    try {
      const realDimensions = {
        width: Math.abs(bbox.east - bbox.west),
        height: Math.abs(bbox.north - bbox.south)
      };

      console.log('Real-world dimensions:', realDimensions);

      const result = await detectTrees(
        imageUrl,
        hsvThresholds,
        detectionParams,
        realDimensions
      );

      setDetectionResult(result);
      
      const totalTrees = result.summary.individualTreesCount + result.summary.totalPopulatedTrees;
      setStatus(`✅ Detected ${totalTrees} trees (${result.summary.individualTreesCount} individual, ${result.summary.totalPopulatedTrees} in clusters)`);
      
      console.log('Detection completed:', result);
    } catch (err) {
      console.error("Tree detection failed:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setStatus(`❌ Detection failed: ${errorMessage}`);
    } finally {
      setIsDetecting(false);
    }
  };

  /**
   * Generate 3D model from detected trees
   * 
   * @param bbox - Terrain bounding box for model dimensions
   */
  const generateModel = async (bbox: BBox): Promise<void> => {
    if (!detectionResult) {
      setStatus("❌ No detection results to generate model");
      return;
    }

    setStatus("🏗️ Generating 3D model...");
    setModelResult(null);
    setIsGeneratingModel(true);

    try {
      // Collect all trees (individual + populated from clusters)
      const allTrees = [
        ...detectionResult.individualTrees,
        ...detectionResult.treeClusters.flatMap(cluster => cluster.populatedTrees)
      ];

      console.log('Generating model with trees:', allTrees.length);

      const request = {
        trees: allTrees,
        bbox: {
          width: Math.abs(bbox.east - bbox.west),
          height: Math.abs(bbox.north - bbox.south)
        }
      };

      const result = await generate3DModel(request);
      setModelResult(result);
      setStatus(`✅ 3D model generated (${result.metadata.totalTrees} trees, ${result.metadata.totalFaces} faces)`);
      
      console.log('Model generation completed:', result);
    } catch (err) {
      console.error("3D model generation failed:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setStatus(`❌ Model generation failed: ${errorMessage}`);
    } finally {
      setIsGeneratingModel(false);
    }
  };

  /**
   * Reset detection and model results
   */
  const reset = (): void => {
    setDetectionResult(null);
    setModelResult(null);
    setStatus("");
    setIsDetecting(false);
    setIsGeneratingModel(false);
    console.log('Pipeline reset');
  };

  return {
    // State
    status,
    hsvThresholds,
    detectionParams,
    detectionResult,
    modelResult,
    isDetecting,
    isGeneratingModel,

    // Actions
    detectTreesInTile,
    generateModel,
    reset,
    setHsvThresholds,
    setDetectionParams,
    setStatus
  };
}
