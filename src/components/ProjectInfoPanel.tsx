import type { Project } from '../types/forma.types';

interface ProjectInfoPanelProps {
  projectId: string | null;
  projectData: Project | null;
  location: [number, number] | null;
}

export function ProjectInfoPanel({ projectId, projectData, location }: ProjectInfoPanelProps) {
  return (
    <>
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
    </>
  );
}
