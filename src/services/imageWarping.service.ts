/**
 * Image warping service
 * Handles perspective transformation to convert WGS84/Mercator images to UTM projection
 */

import { calculateHomography, applyHomography } from '../utils/homography.utils';
import { nearestNeighborSample } from '../utils/imageProcessing.utils';

/**
 * Warp fetched Mapbox image back to UTM projection using perspective transform
 * This removes the rotation/shearing that occurred during UTM → lat/lon conversion
 */
export async function warpImageToUTM(
  blobUrl: string, // NOW RECEIVES BLOB URL (not imageUrl)
  cornerPixelsInFetchedImage: { x: number; y: number }[], // [SW, NW, NE, SE]
  utmDimensions: { width: number; height: number }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      console.log('Image loaded, applying perspective transform...');
      console.log('Input image size:', img.width, 'x', img.height);
      console.log('Output UTM size:', utmDimensions.width, 'x', utmDimensions.height);
      
      const canvas = document.createElement('canvas');
      canvas.width = utmDimensions.width;
      canvas.height = utmDimensions.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Source corners in fetched image (rotated quadrilateral)
      // Order: [NW, NE, SE, SW] (clockwise from top-left)
      // With WMTS precise cropping, corners are already at canvas edges
      const srcCorners = [
        cornerPixelsInFetchedImage[1].x, cornerPixelsInFetchedImage[1].y, // NW
        cornerPixelsInFetchedImage[2].x, cornerPixelsInFetchedImage[2].y, // NE
        cornerPixelsInFetchedImage[3].x, cornerPixelsInFetchedImage[3].y, // SE
        cornerPixelsInFetchedImage[0].x, cornerPixelsInFetchedImage[0].y  // SW
      ];
      
      // Destination corners in UTM canvas (perfect rectangle)
      // Order: [NW, NE, SE, SW] (clockwise from top-left)
      const dstCorners = [
        0, 0,                                        // NW
        utmDimensions.width, 0,                     // NE
        utmDimensions.width, utmDimensions.height,  // SE
        0, utmDimensions.height                     // SW
      ];

      console.log('Source corners (in fetched image):', srcCorners);
      console.log('Destination corners (UTM rectangle):', dstCorners);
      
      // Calculate INVERSE homography: dst -> src
      const H = calculateHomography(dstCorners, srcCorners);
      console.log('Inverse homography matrix calculated');
      
      // Get source image data
      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = img.width;
      srcCanvas.height = img.height;
      const srcCtx = srcCanvas.getContext('2d')!;
      srcCtx.drawImage(img, 0, 0);
      const srcImageData = srcCtx.getImageData(0, 0, img.width, img.height);
      
      // Create destination image data
      const dstImageData = ctx.createImageData(utmDimensions.width, utmDimensions.height);

      console.log('Applying homography transform...');
      let pixelsProcessed = 0;
      let validPixels = 0;
      const totalPixels = utmDimensions.width * utmDimensions.height;
      
      // Apply perspective transform pixel-by-pixel
      for (let y = 0; y < utmDimensions.height; y++) {
        for (let x = 0; x < utmDimensions.width; x++) {
          // Transform destination pixel to source pixel
          const [srcX, srcY] = applyHomography(H, x, y);
          
          // Use nearest-neighbor for sharper results (or bilinearSample for smoother)
          if (srcX >= 0 && srcX < img.width - 1 && srcY >= 0 && srcY < img.height - 1) {
            const color = nearestNeighborSample(srcImageData, srcX, srcY, img.width, img.height);
            const dstIdx = (y * utmDimensions.width + x) * 4;
            dstImageData.data[dstIdx] = color.r;
            dstImageData.data[dstIdx + 1] = color.g;
            dstImageData.data[dstIdx + 2] = color.b;
            dstImageData.data[dstIdx + 3] = 255;
            validPixels++;
          } else {
            // Fill out-of-bounds pixels with black (optional: could use transparent)
            const dstIdx = (y * utmDimensions.width + x) * 4;
            dstImageData.data[dstIdx] = 0;
            dstImageData.data[dstIdx + 1] = 0;
            dstImageData.data[dstIdx + 2] = 0;
            dstImageData.data[dstIdx + 3] = 255;
          }
          pixelsProcessed++;
        }
        // Log progress every 10%
        if (y % Math.floor(utmDimensions.height / 10) === 0) {
          const progress = ((pixelsProcessed / totalPixels) * 100).toFixed(0);
          console.log(`Transform progress: ${progress}%`);
        }
      }
      
      console.log('Putting transformed image data to canvas...');
      console.log(`Valid pixels sampled: ${validPixels} / ${totalPixels} (${((validPixels/totalPixels)*100).toFixed(1)}%)`);
      ctx.putImageData(dstImageData, 0, 0);
      
      // Use maximum quality PNG (no compression parameter for PNG, but we can try JPEG quality 1.0 or use PNG)
      const outputDataURL = canvas.toDataURL('image/png'); // PNG is lossless
      
      console.log('✅ Perspective transform complete!');
      console.log('Output data URL length:', outputDataURL.length);

      // Sanity check: data URL should start with "data:image/png;base64,"
      if (!outputDataURL.startsWith('data:image/png;base64,')) {
        console.error('❌ Invalid data URL format!');
        reject(new Error('Failed to generate valid data URL'));
        return;
      }
      
      resolve(outputDataURL);
    };
    
    img.onerror = (err) => {
      console.error('Image load error:', err);
      reject(new Error('Failed to load image from blob'));
    };
    
    // CRITICAL FIX: Use blobUrl (the parameter), not imageUrl
    img.src = blobUrl;
  });
}
