import type { BBox } from '../types/geometry.types';
import type { Project } from '../types/forma.types';

interface ActionButtonsProps {
  onGetProjectInfo: () => void;
  onGetBbox: () => void;
  onFetchTile: () => void;
  bbox: BBox | null;
  location: [number, number] | null;
  projectData: Project | null;
  isLoadingInfo?: boolean;
  isLoadingBbox?: boolean;
  isLoadingTile?: boolean;
}

export function ActionButtons({ 
  onGetProjectInfo, 
  onGetBbox, 
  onFetchTile, 
  bbox,
  location,
  projectData,
  isLoadingInfo = false,
  isLoadingBbox = false,
  isLoadingTile = false
}: ActionButtonsProps) {
  return (
    <div className="buttons">
      <button onClick={onGetProjectInfo} disabled={isLoadingInfo}>
        {isLoadingInfo ? '⏳ Loading...' : 'Get Project Info'}
      </button>
      <button onClick={onGetBbox} disabled={isLoadingBbox}>
        {isLoadingBbox ? '⏳ Loading...' : 'Get Terrain BBox'}
      </button>
      <button 
        onClick={onFetchTile} 
        disabled={isLoadingTile || !bbox || !location || !projectData}
      >
        {isLoadingTile ? '⏳ Fetching...' : 'Fetch Mapbox Tile'}
      </button>
    </div>
  );
}
