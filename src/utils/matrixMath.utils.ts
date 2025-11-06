/**
 * Matrix math utilities for homography calculations
 */

/**
 * Gaussian elimination solver for linear systems
 */
export function gaussianElimination(A: number[][], b: number[]): number[] {
  const n = A.length;
  
  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) {
        maxRow = k;
      }
    }
    
    // Swap rows
    [A[i], A[maxRow]] = [A[maxRow], A[i]];
    [b[i], b[maxRow]] = [b[maxRow], b[i]];
    
    // Make all rows below this one 0 in current column
    for (let k = i + 1; k < n; k++) {
      const c = A[k][i] / A[i][i];
      for (let j = i; j < n; j++) {
        if (i === j) {
          A[k][j] = 0;
        } else {
          A[k][j] -= c * A[i][j];
        }
      }
      b[k] -= c * b[i];
    }
  }
  
  // Back substitution
  const x: number[] = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = b[i];
    for (let j = i + 1; j < n; j++) {
      x[i] -= A[i][j] * x[j];
    }
    x[i] /= A[i][i];
  }
  
  return x;
}

/**
 * Solve homography matrix from linear system
 */
export function solveHomography(A: number[][]): number[] {
  // Simplified homography solver
  // Returns the 9 coefficients of the 3x3 homography matrix
  
  // This is a basic implementation - for better accuracy, use numeric.js or similar
  // But for our use case (perspective correction), this approximation works
  
  // Using least squares approximation
  const AtA: number[][] = [];
  const Atb: number[] = [];
  
  // Build normal equations
  for (let i = 0; i < 8; i++) {
    AtA[i] = [];
    Atb[i] = 0;
    for (let j = 0; j < 8; j++) {
      let sum = 0;
      for (let k = 0; k < A.length; k++) {
        sum += A[k][i] * A[k][j];
      }
      AtA[i][j] = sum;
    }
    for (let k = 0; k < A.length; k++) {
      Atb[i] -= A[k][i] * A[k][8];
    }
  }
  
  // Solve using Gaussian elimination
  const h = gaussianElimination(AtA, Atb);
  h.push(1); // h[8] = 1 (normalization)
  
  return h;
}
