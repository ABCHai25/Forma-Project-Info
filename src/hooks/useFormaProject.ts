// Custom hook for Forma project state management
import { useState } from 'react';
import type { BBox } from '../types/geometry.types';
import type { Project } from '../types/forma.types';
import { getProjectId, getGeoLocation, getProjectMetadata, getTerrainBbox } from '../services/forma.service';

export function useFormaProject() {
  const [status, setStatus] = useState<string>("");
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [projectData, setProjectData] = useState<Project | null>(null);
  const [bbox, setBbox] = useState<BBox | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isLoadingProjectInfo, setIsLoadingProjectInfo] = useState(false);
  const [isLoadingBbox, setIsLoadingBbox] = useState(false);

  const fetchProjectInfo = async () => {
    setIsLoadingProjectInfo(true);
    setStatus("Fetching project data...");
    try {
      const id = await getProjectId();
      setProjectId(id);

      const geoLocation = await getGeoLocation();
      if (!geoLocation) {
        throw new Error("Could not get project location");
      }
      setLocation(geoLocation);

      const project = await getProjectMetadata();
      setProjectData(project);
      
      setStatus("Project data loaded ✔");
    } catch (err) {
      console.error("Failed to get project info:", err);
      setStatus("Error getting project data ❌");
    } finally {
      setIsLoadingProjectInfo(false);
    }
  };

  const fetchBbox = async () => {
    setIsLoadingBbox(true);
    setStatus("Fetching terrain bbox…");
    try {
      const normalized = await getTerrainBbox();
      setBbox(normalized);
      setStatus("Terrain bbox loaded ✔");
    } catch (err) {
      console.error("getBBox failed:", err);
      setStatus("Error getting bbox ❌");
    } finally {
      setIsLoadingBbox(false);
    }
  };

  return {
    status,
    location,
    projectData,
    bbox,
    projectId,
    fetchProjectInfo,
    fetchBbox,
    setStatus,
    isLoadingProjectInfo,
    isLoadingBbox
  };
}
