/**
 * Tree List Panel - Table of detected trees with download buttons
 */

import { useState } from 'react';
import type { TreeDetectionResult } from '../types/treeDetection.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface TreeListPanelProps {
  detectionResult: TreeDetectionResult;
}

export function TreeListPanel({ 
  detectionResult
}: TreeListPanelProps) {
  const [isDownloadingOBJ, setIsDownloadingOBJ] = useState(false);
  const [isDownloadingJSON, setIsDownloadingJSON] = useState(false);
  
  const allTrees = [
    ...detectionResult.individualTrees.map((tree, i) => ({
      id: `individual-${i}`,
      type: 'Individual' as const,
      position: tree.centroidM,
      diameter: tree.estimatedDiameterM,
      area: tree.areaM2
    })),
    ...detectionResult.treeClusters.flatMap((cluster, ci) => 
      cluster.populatedTrees.map((tree, ti) => ({
        id: `cluster-${ci}-tree-${ti}`,
        type: 'Populated' as const,
        position: tree.positionM,
        diameter: tree.estimatedDiameterM,
        area: 0
      }))
    )
  ];

  const handleDownloadJSON = () => {
    setIsDownloadingJSON(true);
    try {
      // Create JSON string with pretty formatting
      const jsonString = JSON.stringify(detectionResult, null, 2);
      
      // Create blob
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      link.download = `tree_detection_${timestamp}.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloadingJSON(false);
    }
  };

  const handleDownloadOBJ = async () => {
    setIsDownloadingOBJ(true);
    try {
      console.log('📦 Requesting 3D model generation...');
      
      // Call backend with detection data
      const response = await fetch(`${API_BASE_URL}/api/generate-model`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(detectionResult)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Check if it's a JSON response (large model saved to Downloads) or OBJ content
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        // Large model - already saved to Downloads folder
        const data = await response.json();
        console.log('✅ Large model saved to Downloads folder:', data);
        alert(`✅ Large model generated!\n\n` +
              `📁 Saved to: Downloads/${data.filename}\n` +
              `📊 Trees: ${data.total_trees?.toLocaleString()}\n` +
              `💾 Size: ${data.filesize_mb}MB\n\n` +
              `⚠️ Warning: This is a large file. It may take time to open in 3D software.`);
      } else {
        // Normal model - download as blob
        const objContent = await response.text();
        console.log('✅ Model generated, size:', objContent.length, 'bytes');

        // Create blob and download
        const blob = new Blob([objContent], { type: 'model/obj' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        link.download = `trees_model_${timestamp}.obj`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('✅ OBJ file downloaded successfully');
      }
      
    } catch (error) {
      console.error('❌ OBJ download failed:', error);
      alert(`Failed to download OBJ file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloadingOBJ(false);
    }
  };

  return (
    <div className="section">
      <div className="tree-list-header">
        <h3>Detected Trees ({allTrees.length})</h3>
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem',
          alignItems: 'stretch',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleDownloadOBJ}
            disabled={isDownloadingOBJ || allTrees.length === 0}
            className="btn btn-secondary"
            title="Download 3D model as OBJ file for Rhino, Blender, etc."
            style={{ 
              flex: '1',
              minWidth: '140px'
            }}
          >
            {isDownloadingOBJ ? '⏳ Downloading...' : '📦 Download OBJ'}
          </button>
          <button
            onClick={handleDownloadJSON}
            disabled={isDownloadingJSON || allTrees.length === 0}
            className="btn btn-secondary"
            title="Download detection results as JSON"
            style={{ 
              flex: '1',
              minWidth: '140px'
            }}
          >
            {isDownloadingJSON ? '⏳ Downloading...' : '📥 Download JSON'}
          </button>
        </div>
      </div>

      <div className="tree-list">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Position (m)</th>
              <th>Diameter (m)</th>
              <th>Area (m²)</th>
            </tr>
          </thead>
          <tbody>
            {allTrees.map((tree) => (
              <tr key={tree.id}>
                <td>{tree.type}</td>
                <td>{tree.position[0].toFixed(1)}, {tree.position[1].toFixed(1)}</td>
                <td>{tree.diameter.toFixed(2)}</td>
                <td>{tree.area > 0 ? tree.area.toFixed(2) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
