/**
 * Tree Detection Preview - Shows original image with optional mask overlay
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { TreeDetectionResult } from '../types/treeDetection.types';
import type { HSVThresholds } from '../types/treeDetection.types';

interface TreeDetectionPreviewProps {
  originalImageUrl: string;
  detectionResult: TreeDetectionResult | null;
  hsvThresholds: HSVThresholds;
}

export function TreeDetectionPreview({ 
  originalImageUrl, 
  detectionResult,
  hsvThresholds
}: TreeDetectionPreviewProps) {
  const [showMaskPreview, setShowMaskPreview] = useState(false);
  const [maskOpacity, setMaskOpacity] = useState(70);
  const [maskImageUrl, setMaskImageUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // RGB to HSV conversion
  const rgbToHSV = (r: number, g: number, b: number): { h: number; s: number; v: number } => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    let s = 0;
    const v = max;

    if (delta !== 0) {
      s = delta / max;
      
      if (max === r) {
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
      } else if (max === g) {
        h = ((b - r) / delta + 2) / 6;
      } else {
        h = ((r - g) / delta + 4) / 6;
      }
    }

    return {
      h: h * 179, // Convert to OpenCV range (0-179)
      s: s * 255, // Convert to OpenCV range (0-255)
      v: v * 255  // Convert to OpenCV range (0-255)
    };
  };

  // Generate HSV mask preview
  const generateMaskPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Apply HSV threshold mask
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const hsv = rgbToHSV(r, g, b);

        // Check if pixel is within HSV thresholds
        const inRange = (
          hsv.h >= hsvThresholds.hue.min &&
          hsv.h <= hsvThresholds.hue.max &&
          hsv.s >= hsvThresholds.saturation.min &&
          hsv.s <= hsvThresholds.saturation.max &&
          hsv.v >= hsvThresholds.value.min &&
          hsv.v <= hsvThresholds.value.max
        );

        if (inRange) {
          // Keep pixel as is (detected as tree)
          data[i] = 0;      // Make it green for visualization
          data[i + 1] = 255;
          data[i + 2] = 0;
          data[i + 3] = 180; // Semi-transparent
        } else {
          // Make pixel transparent (not a tree)
          data[i + 3] = 0;
        }
      }

      // Put modified image data back
      ctx.putImageData(imageData, 0, 0);

      // Convert canvas to data URL
      setMaskImageUrl(canvas.toDataURL());
      setShowMaskPreview(true);
    };

    img.src = originalImageUrl;
  }, [originalImageUrl, hsvThresholds]);

  // Regenerate mask when thresholds change (debounced)
  useEffect(() => {
    if (showMaskPreview) {
      const timeout = setTimeout(() => {
        generateMaskPreview();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [hsvThresholds, showMaskPreview, generateMaskPreview]);

  return (
    <div className="section">
      <h3>Detection Preview</h3>

      <div className="preview-controls">
        <button 
          onClick={() => {
            if (showMaskPreview) {
              setShowMaskPreview(false);
            } else {
              generateMaskPreview();
            }
          }}
          className="btn btn-secondary"
        >
          {showMaskPreview ? 'Hide Preview' : 'Preview HSV Mask'}
        </button>

        {showMaskPreview && (
          <div className="opacity-control">
            <label>
              Satellite Opacity: {maskOpacity}%
              <input
                type="range"
                min="0"
                max="100"
                value={maskOpacity}
                onChange={(e) => setMaskOpacity(Number(e.target.value))}
              />
            </label>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {showMaskPreview && maskImageUrl && (
        <div className="preview-container">
          {/* HSV mask as base image */}
          <img 
            src={maskImageUrl} 
            alt="HSV mask preview"
            className="preview-image"
          />
          
          {/* Satellite image as overlay with adjustable opacity */}
          <img 
            src={originalImageUrl} 
            alt="Satellite tile overlay"
            className="preview-image overlay"
            style={{ opacity: maskOpacity / 100 }}
          />
        </div>
      )}

      {detectionResult && (
        <div className="detection-summary">
          <p><strong>Individual Trees:</strong> {detectionResult.summary.individualTreesCount}</p>
          <p><strong>Tree Clusters:</strong> {detectionResult.summary.treeClustersCount}</p>
          <p><strong>Total Trees (with populated):</strong> {detectionResult.summary.individualTreesCount + detectionResult.summary.totalPopulatedTrees}</p>
          <p><strong>Image Size:</strong> {detectionResult.metadata.imageDimensionsPx.width} × {detectionResult.metadata.imageDimensionsPx.height} px</p>
          <p><strong>Real Dimensions:</strong> {detectionResult.metadata.realDimensionsM.width.toFixed(1)} × {detectionResult.metadata.realDimensionsM.height.toFixed(1)} m</p>
        </div>
      )}
    </div>
  );
}
