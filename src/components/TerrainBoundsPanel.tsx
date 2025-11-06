import type { BBox } from '../types/geometry.types';
import { calculateArea, calculateDimensions } from '../utils/geometry.utils';

interface TerrainBoundsPanelProps {
  bbox: BBox;
  onCopyJSON?: () => void;
}

export function TerrainBoundsPanel({ bbox, onCopyJSON }: TerrainBoundsPanelProps) {
  const dimensions = calculateDimensions(bbox);
  
  return (
    <div className="section">
      <h3>Terrain Bounds</h3>
      <div className="line">
        <span className="label">West:</span>
        <span>{bbox.west.toFixed(2)} m</span>
      </div>
      <div className="line">
        <span className="label">South:</span>
        <span>{bbox.south.toFixed(2)} m</span>
      </div>
      <div className="line">
        <span className="label">East:</span>
        <span>{bbox.east.toFixed(2)} m</span>
      </div>
      <div className="line">
        <span className="label">North:</span>
        <span>{bbox.north.toFixed(2)} m</span>
      </div>
      
      {/* Spacing between cardinal directions and dimensions */}
      <div style={{ height: '10px' }} />
      
      <div className="line">
        <span className="label">Width:</span>
        <span>{dimensions.width.toFixed(2)} m</span>
      </div>
      <div className="line">
        <span className="label">Length:</span>
        <span>{dimensions.length.toFixed(2)} m</span>
      </div>
      <div className="line">
        <span className="label">Area:</span>
        <span>{calculateArea(bbox).toFixed(2)} m²</span>
      </div>

      {/* Copy JSON button - smaller and with icon */}
      {onCopyJSON && (
        <button 
          onClick={onCopyJSON} 
          style={{ 
            marginTop: '12px',
            padding: '6px 12px',
            fontSize: '0.9em',
            width: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          📋 Copy Project JSON
        </button>
      )}
    </div>
  );
}
