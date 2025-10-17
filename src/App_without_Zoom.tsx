import { useMemo, useState } from "react";
import { Forma } from "forma-embedded-view-sdk/auto";
import './App.css'

/** Normalized bbox we’ll show in the UI */
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
function calculateZoomLevel( 
  bbox: BBox, 
  imageWidth: number = 1280
): number {
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
  const [mapboxUrl, setMapboxUrl] = useState<string | null>(null);
  const [mapboxData, setMapboxData] = useState<any>(null);
  const [crs, setCrs] = useState<string>("EPSG:4326"); // keep 4326 by default (lon/lat)

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
      
      // Simple conversion from Forma's format
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

      // Get project location
      const geoLocation = await Forma.project.getGeoLocation();
      if (!geoLocation) {
        throw new Error("Could not get project location");
      }
      setLocation(geoLocation);

      // Get full project metadata
      const project = await Forma.project.get();
      setProjectData(project);
      
      setStatus("Project data loaded ✔");
    } catch (err) {
      console.error("Failed to get project info:", err);
      setStatus("Error getting project data ❌");
    }
  };

  const fetchMapboxTile = async () => {
    if (!bbox || !location) {
      setStatus("Please fetch project info and bbox first ❌");
      return;
    }

    setStatus("Generating Mapbox URL...");
    try {
      // Use geographic location as center
      const center = { lat: location[0], lon: location[1] };

      // Calculate zoom level based on location and bbox
      const zoom = calculateZoomLevel(bbox);

      console.log('Calculated zoom:', zoom);
      console.log('Bbox dimensions (meters):', Math.max(
      Math.abs(bbox.east - bbox.west),
      Math.abs(bbox.north - bbox.south)
    ));

      // Generate Mapbox URL
      const url = generateMapboxURL(center, zoom);
      setMapboxUrl(url);

      // Create structured data for API
      const mapboxRequestData = {
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

      setMapboxData(mapboxRequestData);
      setStatus("Mapbox URL generated ✔");
      
      console.log("Mapbox Request Data:", mapboxRequestData);
    } catch (err) {
      console.error("Failed to generate Mapbox URL:", err);
      setStatus("Error generating Mapbox URL ❌");
    }
  };

  const copyMapboxJSON = async () => {
    if (!mapboxData) return;

    await navigator.clipboard.writeText(JSON.stringify(mapboxData, null, 2));
    setStatus("Mapbox JSON copied to clipboard ✔");
    setTimeout(() => setStatus(""), 1200);
  };

  return (
    <div className="panel">
      <h2>Forma Project Info</h2>

      <label className="row">
        <span>CRS:</span>
        <select value={crs} onChange={(e) => setCrs(e.target.value)}>
          <option value="EPSG:4326">EPSG:4326 (lon/lat)</option>
          <option value="EPSG:3857">EPSG:3857 (web mercator)</option>
          {/* add more if you know they’re supported */}
        </select>
      </label>

      <div className="buttons">
        <button onClick={getProjectInfo}>Get Project Info</button>
        <button onClick={getBBox}>Get Terrain BBox</button>
        <button onClick={fetchMapboxTile} disabled={!bbox || !location}>
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
            
            {mapboxUrl && (
              <>
                <button onClick={copyMapboxJSON} style={{ marginTop: '10px' }}>
                  Copy Mapbox JSON
                </button>
                <div style={{ marginTop: '10px' }}>
                  <a href={mapboxUrl} target="_blank" rel="noopener noreferrer">
                    View Satellite Image
                  </a>
                </div>
                {/* Optional: Display the image directly */}
                <img 
                  src={mapboxUrl} 
                  alt="Satellite view" 
                  style={{ 
                    maxWidth: '100%', 
                    marginTop: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }} 
                />
              </>
            )}
          </div>
        )}

        {bbox ? (
          <>
            <h3>Bbox Values</h3>
            <div className="line"><span className="label">west:</span><span>{bbox.west}</span></div>
            <div className="line"><span className="label">south:</span><span>{bbox.south}</span></div>
            <div className="line"><span className="label">east:</span><span>{bbox.east}</span></div>
            <div className="line"><span className="label">north:</span><span>{bbox.north}</span></div>
            {bbox.crs && (
              <div className="line"><span className="label">crs:</span><span>{bbox.crs}</span></div>
            )}
            <div className="section">
              <h4>Tile Dimensions</h4>
              <div className="line">
                <span className="label">Width:</span>
                <span>{calculateDimensions(bbox).width.toFixed(2)} m</span>
              </div>
              <div className="line">
                <span className="label">Length:</span>
                <span>{calculateDimensions(bbox).length.toFixed(2)} m</span>
              </div>
            </div>
            <div className="line">
              <span className="label">Area:</span>
              <span>{calculateArea(bbox).toFixed(2)} m²</span>
            </div>
            <pre className="json">{bboxPretty}</pre>
          </>
        ) : (
          <p className="muted">No information yet on the Bbox.</p>
        )}
      </div>

      <small className="hint">
        Tip: This panel runs inside a Forma iframe. The call goes through the Embedded View SDK to the host. See the tutorial for how the panel is wired.
      </small>
    </div>
  );
}

export default App;