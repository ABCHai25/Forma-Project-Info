/**
 * Forma SDK Related Types
 * Extracted from App.tsx - Phase 1.1
 */

/**
 * Project metadata from Forma SDK
 */
export type Project = {
  countryCode: string;
  srid: number;
  refPoint: [number, number]; // Absolute UTM coordinates [easting, northing]
  projString: string; // Full proj4 projection definition
  timezone: string;
  hubId: string;
  name: string;
};
