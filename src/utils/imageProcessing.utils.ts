/**
 * Image processing utilities for canvas operations
 */

/**
 * Load an image with CORS enabled
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Nearest-neighbor sampling - sharper but may show pixelation
 */
export function nearestNeighborSample(
  imageData: ImageData,
  x: number,
  y: number,
  width: number,
  height: number
): { r: number; g: number; b: number } {
  const px = Math.round(x);
  const py = Math.round(y);
  
  // Clamp to valid range
  const clampedX = Math.max(0, Math.min(width - 1, px));
  const clampedY = Math.max(0, Math.min(height - 1, py));
  
  const idx = (clampedY * width + clampedX) * 4;
  return {
    r: imageData.data[idx],
    g: imageData.data[idx + 1],
    b: imageData.data[idx + 2]
  };
}
