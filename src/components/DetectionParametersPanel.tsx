/**
 * Detection Parameters Panel - Tree size constraints and clustering controls
 */

import type { DetectionParameters } from '../types/treeDetection.types';

interface DetectionParametersPanelProps {
  params: DetectionParameters;
  onChange: (params: DetectionParameters) => void;
  disabled?: boolean;
}

export function DetectionParametersPanel({ 
  params, 
  onChange,
  disabled = false 
}: DetectionParametersPanelProps) {
  return (
    <div className="section">
      <h3>Detection Parameters</h3>
      
      <div className="line">
        <span className="label">Min Tree Diameter (m):</span>
        <input
          type="number"
          min="0.5"
          max="50"
          step="0.5"
          value={params.minTreeDiameter}
          onChange={(e) => onChange({ ...params, minTreeDiameter: Number(e.target.value) })}
          disabled={disabled}
          className="param-input"
        />
      </div>

      <div className="line">
        <span className="label">Max Tree Diameter (m):</span>
        <input
          type="number"
          min="1"
          max="100"
          step="1"
          value={params.maxTreeDiameter}
          onChange={(e) => onChange({ ...params, maxTreeDiameter: Number(e.target.value) })}
          disabled={disabled}
          className="param-input"
        />
      </div>

      <div className="line">
        <span className="label">Cluster Threshold (m):</span>
        <input
          type="number"
          min="5"
          max="50"
          step="1"
          value={params.clusterThreshold}
          onChange={(e) => onChange({ ...params, clusterThreshold: Number(e.target.value) })}
          disabled={disabled}
          className="param-input"
        />
      </div>

      <p className="help-text">
        Trees with diameter &gt; cluster threshold are treated as tree clusters and populated with individual trees.
      </p>
    </div>
  );
}
