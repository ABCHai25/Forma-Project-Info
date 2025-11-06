/**
 * Model Result Panel - Display 3D model generation results and download buttons
 */

import type { Model3DGenerationResult } from '../types/model3D.types';
import { downloadModel } from '../services/modelGeneration.service';

interface ModelResultPanelProps {
  modelResult: Model3DGenerationResult;
}

export function ModelResultPanel({ modelResult }: ModelResultPanelProps) {
  return (
    <div className="section">
      <h3>✅ 3D Model Generated</h3>

      <div className="model-stats">
        <div className="line">
          <span className="label">Total Trees:</span>
          <span>{modelResult.metadata.totalTrees}</span>
        </div>
        <div className="line">
          <span className="label">Total Vertices:</span>
          <span>{modelResult.metadata.totalVertices.toLocaleString()}</span>
        </div>
        <div className="line">
          <span className="label">Total Faces:</span>
          <span>{modelResult.metadata.totalFaces.toLocaleString()}</span>
        </div>
        <div className="line">
          <span className="label">Generation Time:</span>
          <span>{(modelResult.metadata.generationTimeMs / 1000).toFixed(2)}s</span>
        </div>
      </div>

      <div className="download-buttons">
        <button
          onClick={() => downloadModel(modelResult.modelUrl, 'trees_model.obj')}
          className="btn btn-primary"
        >
          ⬇️ Download OBJ
        </button>
        
        {modelResult.materialUrl && (
          <button
            onClick={() => downloadModel(modelResult.materialUrl!, 'trees_model.mtl')}
            className="btn btn-secondary"
          >
            ⬇️ Download MTL
          </button>
        )}
        
        {modelResult.textureUrl && (
          <button
            onClick={() => downloadModel(modelResult.textureUrl!, 'texture.png')}
            className="btn btn-secondary"
          >
            ⬇️ Download Texture
          </button>
        )}
      </div>
    </div>
  );
}
