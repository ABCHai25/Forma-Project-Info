import { useMemo, useState } from "react";
import { Forma } from "forma-embedded-view-sdk/auto";
import './App.css'

/** Normalized bbox we'll show in the UI */
type BBox = {
  west: number; south: number; east: number; north: number;
  crs?: string;
};

type FormaPosition = {
  x: number;
  y: number;
  z: number;
};

type FormaBBox = {
  min: FormaPosition;
  max: FormaPosition;
};

type Project = {
  countryCode: string;
  srid: number;
  refPoint: [number, number];
  projString: string;
  timezone: string;
  hubId: string;
  name: string;
};

type MapboxData = {
  center: { latitude: number; longitude: number };
  zoom: number;
  style: string;
  size: { width: number; height: number };
  bbox: { west: number; south: number; east: number; north: number };
  url: string;
};

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAPBOX_STYLE = 'mapbox/satellite-v9';

function calculateArea(bbox: BBox): number {
  const width = Math.abs(bbox.east - bbox.west);
  const height = Math.abs(bbox.north - bbox.south);
  return width * height;
}

function calculateDimensions(bbox: BBox): { width: number; length: number } {
  return {
    width: Math.abs(bbox.east - bbox.west),
    length: Math.abs(bbox.north - bbox.south)
  };
}

function calculateZoomLevel(bbox: BBox): number {
  const width = Math.abs(bbox.east - bbox.west);
  const height = Math.abs(bbox.north - bbox.south);
  const maxDimension = Math.max(width, height);
  
  // Empirical zoom levels for different terrain sizes:
  // ~500m = zoom 16
  // ~1000m = zoom 15
  // ~2000m = zoom 14
  // ~4000m = zoom 13
  
  if (maxDimension < 750) return 16;
  if (maxDimension < 2000) return 15;
  if (maxDimension < 3000) return 14;
  if (maxDimension < 6000) return 13;
  return 12;
}

function generateMapboxURL(
  center: { lat: number; lon: number },
  zoom: number,
  width: number = 1280,
  height: number = 1280
): string {
  return `https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}/static/${center.lon},${center.lat},${zoom}/${width}x${height}?access_token=${MAPBOX_ACCESS_TOKEN}`;
}

function App() {
  const [status, setStatus] = useState<string>("");
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [projectData, setProjectData] = useState<Project | null>(null);
  const [bbox, setBbox] = useState<BBox | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [mapboxData, setMapboxData] = useState<MapboxData | null>(null);
  const [crs, setCrs] = useState<string>("EPSG:4326");

  const bboxPretty = useMemo(() => {
    if (!bbox) return "";
    const { west, south, east, north } = bbox;
    return `{"west": ${west.toFixed(6)}, "south": ${south.toFixed(6)}, "east": ${east.toFixed(6)}, "north": ${north.toFixed(6)}}`;
  }, [bbox]);

  const copyJSON = async () => {
    if (!bbox) return;

    const dimensions = calculateDimensions(bbox);
    const exportData = {
      geographicLocation: location ? {
        latitude: parseFloat(location[0].toFixed(6)),
        longitude: parseFloat(location[1].toFixed(6))
      } : null,
      projectDetails: projectData ? {
        id: projectId,
        name: projectData.name,
        countryCode: projectData.countryCode,
        srid: projectData.srid,
        timezone: projectData.timezone,
        refPoint: projectData.refPoint,
      } : null,
      terrainBounds: {
        west: parseFloat(bbox.west.toFixed(6)),
        south: parseFloat(bbox.south.toFixed(6)),
        east: parseFloat(bbox.east.toFixed(6)),
        north: parseFloat(bbox.north.toFixed(6)),
        dimensions: {
          width: parseFloat(dimensions.width.toFixed(2)),
          length: parseFloat(dimensions.length.toFixed(2))
        },
        area: parseFloat(calculateArea(bbox).toFixed(2))
      }
    };

    await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    setStatus("JSON copied to clipboard ✔");
    setTimeout(() => setStatus(""), 1200);
  };

  const getBBox = async () => {
    setStatus("Fetching terrain bbox…");
    try {
      const raw = await Forma.terrain.getBbox();
      
      const normalized: BBox = {
        west: raw.min.x,
        south: raw.min.y,
        east: raw.max.x,
        north: raw.max.y
      };

      setBbox(normalized);
      setStatus("Terrain bbox loaded ✔");
    } catch (err) {
      console.error("getBBox failed:", err);
      setStatus("Error getting bbox ❌");
    }
  };

  const getProjectInfo = async () => {
    setStatus("Fetching project data...");
    try {
      const id = await Forma.getProjectId();
      setProjectId(id);

      const geoLocation = await Forma.project.getGeoLocation();
      if (!geoLocation) {
        throw new Error("Could not get project location");
      }
      setLocation(geoLocation);

      const project = await Forma.project.get();
      setProjectData(project);
      
      setStatus("Project data loaded ✔");
    } catch (err) {
      console.error("Failed to get project info:", err);
      setStatus("Error getting project data ❌");
    }
  };

  const fetchMapboxTile = async (zoomOverride?: number) => {
    if (!bbox || !location) {
      setStatus("Please fetch project info and bbox first ❌");
      return;
    }

    setStatus("Generating Mapbox URL...");
    try {
      const center = { lat: location[0], lon: location[1] };
      const zoom = zoomOverride !== undefined ? zoomOverride : calculateZoomLevel(bbox);
      const url = generateMapboxURL(center, zoom);

      const newMapboxData: MapboxData = {
        center: {
          latitude: center.lat,
          longitude: center.lon
        },
        zoom: zoom,
        style: MAPBOX_STYLE,
        size: {
          width: 1280,
          height: 1280
        },
        bbox: {
          west: bbox.west,
          south: bbox.south,
          east: bbox.east,
          north: bbox.north
        },
        url: url
      };

      setMapboxData(newMapboxData);
      setStatus("Mapbox URL generated ✔");
      
      console.log("Mapbox Request Data:", {
        center: newMapboxData.center,
        zoom: newMapboxData.zoom,
        style: newMapboxData.style,
        size: newMapboxData.size,
        bbox: newMapboxData.bbox
      });
    } catch (err) {
      console.error("Failed to generate Mapbox URL:", err);
      setStatus("Error generating Mapbox URL ❌");
    }
  };

  const adjustZoom = (delta: number) => {
    if (!mapboxData) return;
    const newZoom = Math.max(1, Math.min(20, mapboxData.zoom + delta));
    fetchMapboxTile(newZoom);
  };

  const copyMapboxJSON = async () => {
    if (!mapboxData) return;

    const safeData = {
      center: mapboxData.center,
      zoom: mapboxData.zoom,
      style: mapboxData.style,
      size: mapboxData.size,
      bbox: mapboxData.bbox
    };

    await navigator.clipboard.writeText(JSON.stringify(safeData, null, 2));
    setStatus("Mapbox JSON copied to clipboard ✔");
    setTimeout(() => setStatus(""), 1200);
  };

  const downloadTile = async () => {
    if (!mapboxData || !mapboxData.url) {
      setStatus("No tile to download ❌");
      return;
    }

    setStatus("Downloading tile...");
    try {
      // Fetch the image from Mapbox
      const response = await fetch(mapboxData.url);
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with project info and timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `satellite_tile_${projectId || 'unknown'}_zoom${mapboxData.zoom}_${timestamp}.png`;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setStatus(`Tile downloaded: ${filename} ✔`);
      setTimeout(() => setStatus(""), 3000);
    } catch (err) {
      console.error("Failed to download tile:", err);
      setStatus("Error downloading tile ❌");
    }
  };

  return (
    <div className="panel">
      <h2>Forma Project Info</h2>

      <label className="row">
        <span>CRS:</span>
        <select value={crs} onChange={(e) => setCrs(e.target.value)}>
          <option value="EPSG:4326">EPSG:4326 (lon/lat)</option>
          <option value="EPSG:3857">EPSG:3857 (web mercator)</option>
        </select>
      </label>

      <div className="buttons">
        <button onClick={getProjectInfo}>Get Project Info</button>
        <button onClick={getBBox}>Get Terrain BBox</button>
        <button onClick={() => fetchMapboxTile()} disabled={!bbox || !location}>
          Fetch Mapbox Tile
        </button>
        <button onClick={copyJSON} disabled={!bbox}>Copy JSON</button>
      </div>

      <div className="box">
        <div className="line">
          <span className="label">Status:</span>
          <span>{status || "—"}</span>
        </div>

        {location && (
          <div className="section">
            <h3>Geographic Location</h3>
            <div className="line">
              <span className="label">Latitude:</span>
              <span>{location[0].toFixed(6)}°</span>
            </div>
            <div className="line">
              <span className="label">Longitude:</span>
              <span>{location[1].toFixed(6)}°</span>
            </div>
          </div>
        )}

        {projectData && (
          <div className="section">
            <h3>Project Details</h3>
            <div className="line">
              <span className="label">ID:</span>
              <span>{projectId}</span>
            </div>
            <div className="line">
              <span className="label">Name:</span>
              <span>{projectData.name}</span>
            </div>
            <div className="line">
              <span className="label">Country:</span>
              <span>{projectData.countryCode}</span>
            </div>
            <div className="line">
              <span className="label">SRID:</span>
              <span>{projectData.srid}</span>
            </div>
            <div className="line">
              <span className="label">Timezone:</span>
              <span>{projectData.timezone}</span>
            </div>
          </div>
        )}

        {mapboxData && (
          <div className="section">
            <h3>Mapbox Satellite Tile</h3>
            <div className="line">
              <span className="label">Zoom Level:</span>
              <span>{mapboxData.zoom}</span>
            </div>
            <div className="line">
              <span className="label">Center:</span>
              <span>{mapboxData.center.latitude.toFixed(6)}, {mapboxData.center.longitude.toFixed(6)}</span>
            </div>
            <div className="line">
              <span className="label">Image Size:</span>
              <span>{mapboxData.size.width} × {mapboxData.size.height}</span>
            </div>

            <div className="buttons" style={{ marginTop: '15px' }}>
              <button 
                onClick={() => adjustZoom(-1)}
                disabled={mapboxData.zoom <= 1}
              >
                ➖ Zoom Out
              </button>
              <button 
                onClick={() => adjustZoom(1)}
                disabled={mapboxData.zoom >= 20}
              >
                ➕ Zoom In
              </button>
              <button onClick={() => fetchMapboxTile()}>
                🔄 Reset
              </button>
            </div>
            
            <div className="buttons" style={{ marginTop: '10px' }}>
              <button onClick={copyMapboxJSON} style={{ flex: 1 }}>
                Copy Mapbox JSON
              </button>
              <button 
                onClick={downloadTile} 
                style={{ 
                  flex: 1,
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                Download Tile
              </button>
            </div>
            
            <img 
              src={mapboxData.url} 
              alt="Satellite view" 
              style={{ 
                width: '100%', 
                marginTop: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }} 
            />
          </div>
        )}

        {bbox && (
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
            <div className="line">
              <span className="label">Width:</span>
              <span>{calculateDimensions(bbox).width.toFixed(2)} m</span>
            </div>
            <div className="line">
              <span className="label">Length:</span>
              <span>{calculateDimensions(bbox).length.toFixed(2)} m</span>
            </div>
            <div className="line">
              <span className="label">Area:</span>
              <span>{calculateArea(bbox).toFixed(2)} m²</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;