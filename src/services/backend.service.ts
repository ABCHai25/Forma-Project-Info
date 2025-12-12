/**
 * Backend API service
 * Handles communication with Express backend
 * 
 * Uses relative URLs (/api/*) which work in both:
 * - Development: Vite proxy forwards to localhost:3001
 * - Production: nginx proxy forwards to backend container
 */

// Use relative URL (empty string) - automatically uses /api/* paths
// This works in both development and production:
// - Dev: Vite proxy (in vite.config.ts) forwards /api/* → localhost:3001
// - Prod: nginx forwards /api/* → backend container on port 8012
// By using relative URLs, the same build works everywhere without env var changes
const API_BASE_URL = '';

export interface SaveTilePayload {
  imageUrl: string;
  projectId: string | null;
  zoom: number;
  bbox: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
  center: {
    latitude: number;
    longitude: number;
  };
}

export interface SaveTileResponse {
  success: boolean;
  filename: string;
  imagePath: string;
  metadataPath: string;
}

/**
 * Save tile to backend
 */
export async function saveTile(payload: SaveTilePayload): Promise<SaveTileResponse> {
  const response = await fetch('api/saveTile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}
