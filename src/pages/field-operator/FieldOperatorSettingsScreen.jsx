import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { Settings, Save, CheckCircle2 } from 'lucide-react';

export const FieldOperatorSettingsScreen = () => {
  const [confidenceThreshold, setConfidenceThreshold] = useState('75');
  const [modelPreset, setModelPreset] = useState('YOLOv8-RoadDefect-v2.4');
  const [gpsFreq, setGpsFreq] = useState('10Hz');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div>
      <PageHeader
        title="Field Operator Settings"
        description="Configure AI model threshold, GPS telemetry sampling rates, and dashcam camera presets."
      />

      <Card style={{ maxWidth: '600px' }}>
        {saved && (
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>Settings saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave}>
          <Select
            label="AI Model Checkpoint"
            value={modelPreset}
            onChange={(e) => setModelPreset(e.target.value)}
            options={['YOLOv8-RoadDefect-v2.4', 'ResNet50-PotholeNet-v1.8', 'EfficientDet-UrbanRoads-v3.0']}
          />

          <div className="input-group">
            <label className="input-label">AI Minimum Detection Confidence Threshold ({confidenceThreshold}%)</label>
            <input
              type="range"
              min="50"
              max="95"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <Select
            label="GPS Trajectory Sampling Rate"
            value={gpsFreq}
            onChange={(e) => setGpsFreq(e.target.value)}
            options={['1Hz (Standard)', '5Hz (High Precision)', '10Hz (Sub-Meter Accuracy)']}
          />

          <Button type="submit" variant="primary" icon={Save} style={{ width: '100%', marginTop: '1.25rem' }}>
            Save Operator Settings
          </Button>
        </form>
      </Card>
    </div>
  );
};
