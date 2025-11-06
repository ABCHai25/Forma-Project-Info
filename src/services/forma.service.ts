/**
 * Forma SDK service
 * Handles all Forma API interactions
 */

import { Forma } from "forma-embedded-view-sdk/auto";
import type { BBox } from '../types/geometry.types';
import type { Project } from '../types/forma.types';

/**
 * Get Forma project ID
 */
export async function getProjectId(): Promise<string> {
  return await Forma.getProjectId();
}

/**
 * Get geographic location of the project
 */
export async function getGeoLocation(): Promise<[number, number] | null | undefined> {
  return (await Forma.project.getGeoLocation()) as [number, number] | null | undefined;
}

/**
 * Get full project metadata
 */
export async function getProjectMetadata(): Promise<Project> {
  return await Forma.project.get();
}

/**
 * Get terrain bounding box
 * Returns normalized BBox with offsets from reference point
 */
export async function getTerrainBbox(): Promise<BBox> {
  const raw = await Forma.terrain.getBbox();
  
  const normalized: BBox = {
    west: raw.min.x,
    south: raw.min.y,
    east: raw.max.x,
    north: raw.max.y
  };

  return normalized;
}
