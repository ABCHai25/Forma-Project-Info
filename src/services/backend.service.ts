/**
 * Backend API service
 * Handles communication with Express backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

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
  const response = await fetch(`${API_BASE_URL}/api/saveTile`, {
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
