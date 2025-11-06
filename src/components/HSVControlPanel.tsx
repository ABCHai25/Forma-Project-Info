/**
 * HSV Control Panel - Color threshold sliders for tree detection
 */

import type { HSVThresholds } from '../types/treeDetection.types';

interface HSVControlPanelProps {
  hsvThresholds: HSVThresholds;
  onChange: (thresholds: HSVThresholds) => void;
  disabled?: boolean;
}

export function HSVControlPanel({ 
  hsvThresholds, 
  onChange,
  disabled = false 
}: HSVControlPanelProps) {
  const updateThreshold = (
    channel: keyof HSVThresholds,
    bound: 'min' | 'max',
    value: number
  ) => {
    onChange({
      ...hsvThresholds,
      [channel]: {
        ...hsvThresholds[channel],
        [bound]: value
      }
    });
  };

  return (
    <div className="section">
      <h3>HSV Color Range (Tree Detection)</h3>
      <div className="hsv-controls">
        {/* Lower Threshold */}
        <div className="threshold-group">
          <h4>Lower Threshold</h4>
          
          <div className="slider-row">
            <label>
              <span>Hue Min</span>
              <input
                type="number"
                min="0"
                max="179"
                value={hsvThresholds.hue.min}
                onChange={(e) => updateThreshold('hue', 'min', Number(e.target.value))}
                disabled={disabled}
              />
            </label>
            <input
              type="range"
              min="0"
              max="179"
              value={hsvThresholds.hue.min}
              onChange={(e) => updateThreshold('hue', 'min', Number(e.target.value))}
              disabled={disabled}
            />
          </div>

          <div className="slider-row">
            <label>
              <span>Saturation Min</span>
              <input
                type="number"
                min="0"
                max="255"
                value={hsvThresholds.saturation.min}
                onChange={(e) => updateThreshold('saturation', 'min', Number(e.target.value))}
                disabled={disabled}
              />
            </label>
            <input
              type="range"
              min="0"
              max="255"
              value={hsvThresholds.saturation.min}
              onChange={(e) => updateThreshold('saturation', 'min', Number(e.target.value))}
              disabled={disabled}
            />
          </div>

          <div className="slider-row">
            <label>
              <span>Value Min</span>
              <input
                type="number"
                min="0"
                max="255"
                value={hsvThresholds.value.min}
                onChange={(e) => updateThreshold('value', 'min', Number(e.target.value))}
                disabled={disabled}
              />
            </label>
            <input
              type="range"
              min="0"
              max="255"
              value={hsvThresholds.value.min}
              onChange={(e) => updateThreshold('value', 'min', Number(e.target.value))}
              disabled={disabled}
            />
          </div>
        </div>

        {/* Upper Threshold */}
        <div className="threshold-group">
          <h4>Upper Threshold</h4>
          
          <div className="slider-row">
            <label>
              <span>Hue Max</span>
              <input
                type="number"
                min="0"
                max="179"
                value={hsvThresholds.hue.max}
                onChange={(e) => updateThreshold('hue', 'max', Number(e.target.value))}
                disabled={disabled}
              />
            </label>
            <input
              type="range"
              min="0"
              max="179"
              value={hsvThresholds.hue.max}
              onChange={(e) => updateThreshold('hue', 'max', Number(e.target.value))}
              disabled={disabled}
            />
          </div>

          <div className="slider-row">
            <label>
              <span>Saturation Max</span>
              <input
                type="number"
                min="0"
                max="255"
                value={hsvThresholds.saturation.max}
                onChange={(e) => updateThreshold('saturation', 'max', Number(e.target.value))}
                disabled={disabled}
              />
            </label>
            <input
              type="range"
              min="0"
              max="255"
              value={hsvThresholds.saturation.max}
              onChange={(e) => updateThreshold('saturation', 'max', Number(e.target.value))}
              disabled={disabled}
            />
          </div>

          <div className="slider-row">
            <label>
              <span>Value Max</span>
              <input
                type="number"
                min="0"
                max="255"
                value={hsvThresholds.value.max}
                onChange={(e) => updateThreshold('value', 'max', Number(e.target.value))}
                disabled={disabled}
              />
            </label>
            <input
              type="range"
              min="0"
              max="255"
              value={hsvThresholds.value.max}
              onChange={(e) => updateThreshold('value', 'max', Number(e.target.value))}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <p className="help-text">
        Adjust HSV thresholds to detect green vegetation. You can use sliders or type values directly. Default values work well for most satellite imagery.
      </p>
    </div>
  );
}
