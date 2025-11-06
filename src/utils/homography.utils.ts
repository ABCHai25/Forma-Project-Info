/**
 * Homography calculation utilities for perspective transforms
 */

import { solveHomography } from './matrixMath.utils';

/**
 * Calculate homography matrix from 4 point correspondences
 * Based on Direct Linear Transform (DLT) algorithm
 */
export function calculateHomography(
  src: number[], // [x1,y1, x2,y2, x3,y3, x4,y4]
  dst: number[]  // [x1,y1, x2,y2, x3,y3, x4,y4]
): number[] {
  // Build the matrix A for homography calculation
  const A: number[][] = [];
  
  for (let i = 0; i < 4; i++) {
    const sx = src[i * 2];
    const sy = src[i * 2 + 1];
    const dx = dst[i * 2];
    const dy = dst[i * 2 + 1];
    
    A.push([
      -sx, -sy, -1, 0, 0, 0, sx * dx, sy * dx, dx
    ]);
    A.push([
      0, 0, 0, -sx, -sy, -1, sx * dy, sy * dy, dy
    ]);
  }
  
  // Solve using SVD (simplified approach for 3x3 homography)
  // For simplicity, we'll use a direct calculation method
  
  // This is a simplified version - for production, use a proper linear algebra library
  // But this works well enough for our perspective transform
  
  const h = solveHomography(A);
  return h;
}

/**
 * Apply homography transform to a point
 */
export function applyHomography(h: number[], x: number, y: number): [number, number] {
  const w = h[6] * x + h[7] * y + h[8];
  const px = (h[0] * x + h[1] * y + h[2]) / w;
  const py = (h[3] * x + h[4] * y + h[5]) / w;
  return [px, py];
}
