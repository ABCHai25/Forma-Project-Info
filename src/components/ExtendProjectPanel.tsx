import { useState } from 'react';
import type { BBox } from '../types/geometry.types';
import type { Project } from '../types/forma.types';

interface ExtendProjectPanelProps {
  bbox: BBox | null;
  projectData: Project | null;
  onFetchExtended: (extensions: { north: number; west: number; east: number; south: number }) => Promise<void>;
  isLoading: boolean;
}

export function ExtendProjectPanel({ 
  bbox, 
  projectData, 
  onFetchExtended, 
  isLoading 
}: ExtendProjectPanelProps) {
  const [extendNorth, setExtendNorth] = useState(0);
  const [extendWest, setExtendWest] = useState(0);
  const [extendEast, setExtendEast] = useState(0);
  const [extendSouth, setExtendSouth] = useState(0);

  // Calculate dimensions
  const currentWidth = bbox ? (bbox.east - bbox.west) : 0;
  const currentHeight = bbox ? (bbox.north - bbox.south) : 0;
  
  const extendedWidth = currentWidth + extendWest + extendEast;
  const extendedHeight = currentHeight + extendNorth + extendSouth;

  const handleFetchExtended = async () => {
    await onFetchExtended({
      north: extendNorth,
      west: extendWest,
      east: extendEast,
      south: extendSouth
    });
  };

  return (
    <div className="section">
      <h3>Extend Project Boundaries</h3>
      <p className="help-text" style={{ marginBottom: '15px' }}>
        Extend the project boundaries to fetch a larger satellite tile. 
        Enter the distance in meters to extend in each direction.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
        <label style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ marginBottom: '5px', fontWeight: 'bold' }}>⬆️ Extend North (m):</span>
          <input 
            type="number" 
            value={extendNorth} 
            onChange={(e) => setExtendNorth(Math.max(0, Number(e.target.value)))}
            min="0"
            step="50"
            disabled={isLoading || !bbox}
            style={{ padding: '8px' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ marginBottom: '5px', fontWeight: 'bold' }}>➡️ Extend East (m):</span>
          <input 
            type="number" 
            value={extendEast} 
            onChange={(e) => setExtendEast(Math.max(0, Number(e.target.value)))}
            min="0"
            step="50"
            disabled={isLoading || !bbox}
            style={{ padding: '8px' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ marginBottom: '5px', fontWeight: 'bold' }}>⬅️ Extend West (m):</span>
          <input 
            type="number" 
            value={extendWest} 
            onChange={(e) => setExtendWest(Math.max(0, Number(e.target.value)))}
            min="0"
            step="50"
            disabled={isLoading || !bbox}
            style={{ padding: '8px' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ marginBottom: '5px', fontWeight: 'bold' }}>⬇️ Extend South (m):</span>
          <input 
            type="number" 
            value={extendSouth} 
            onChange={(e) => setExtendSouth(Math.max(0, Number(e.target.value)))}
            min="0"
            step="50"
            disabled={isLoading || !bbox}
            style={{ padding: '8px' }}
          />
        </label>
      </div>

      <div style={{ 
        background: '#f0f0f0', 
        padding: '12px', 
        borderRadius: '5px', 
        marginBottom: '15px' 
      }}>
        <div className="line">
          <span className="label">Original Dimensions:</span>
          <span>{currentWidth.toFixed(0)}m × {currentHeight.toFixed(0)}m</span>
        </div>
        <div className="line">
          <span className="label">Extended Dimensions:</span>
          <span style={{ fontWeight: 'bold', color: '#2196F3' }}>
            {extendedWidth.toFixed(0)}m × {extendedHeight.toFixed(0)}m
          </span>
        </div>
        <div className="line">
          <span className="label">Additional Area:</span>
          <span>
            +{((extendedWidth * extendedHeight) - (currentWidth * currentHeight)).toFixed(0)}m²
          </span>
        </div>
      </div>

      <button 
        onClick={handleFetchExtended}
        disabled={isLoading || !bbox || !projectData}
        style={{ 
          width: '100%',
          padding: '12px',
          fontSize: '1.1em',
          backgroundColor: '#2196F3',
          color: 'white',
          fontWeight: 'bold'
        }}
      >
        {isLoading ? '⏳ Fetching...' : '🌍 Fetch Extended Tile'}
      </button>

      {!bbox && (
        <p className="help-text" style={{ marginTop: '10px', color: '#ff6b6b' }}>
          ⬅️ Please fetch project info and terrain bounds first using the "Project Tile" tab.
        </p>
      )}
    </div>
  );
}
