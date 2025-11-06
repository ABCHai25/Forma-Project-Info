import type { MapboxData } from '../types/mapbox.types';

interface MapboxTilePanelProps {
  mapboxData: MapboxData;
  onCopyJSON: () => void;
  onSaveTile: () => void;
}

export function MapboxTilePanel({ mapboxData, onCopyJSON, onSaveTile }: MapboxTilePanelProps) {
  return (
    <>
      <div className="line">
        <span className="label">Center:</span>
        <span>
          {mapboxData.center?.latitude != null && mapboxData.center?.longitude != null
            ? `${mapboxData.center.latitude.toFixed(6)}, ${mapboxData.center.longitude.toFixed(6)}`
            : 'N/A'}
        </span>
      </div>
      <div className="line">
        <span className="label">Image Size:</span>
        <span>{mapboxData.size.width} × {mapboxData.size.height}</span>
      </div>

      <div className="buttons" style={{ marginTop: '15px' }}>
        <button onClick={onCopyJSON} style={{ flex: 1 }}>
          Copy Mapbox JSON
        </button>
        <button 
          onClick={onSaveTile} 
          style={{ 
            flex: 1,
            backgroundColor: '#4CAF50',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          ✓ Confirm & Save Tile
        </button>
      </div>
    </>
  );
}
