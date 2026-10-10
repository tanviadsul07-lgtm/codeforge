import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Layers, ArrowLeft } from 'lucide-react';

export const CreateSurveySessionScreen = () => {
  const { addSurveySession } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [roadName, setRoadName] = useState('');
  const [area, setArea] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const newSession = addSurveySession({ name, roadName, area, notes });
      setLoading(false);
      navigate(`/operator/upload?sessionId=${newSession.id}`);
    }, 400);
  };

  return (
    <div>
      <PageHeader
        title="Create Survey Session"
        description="Initialize a new road audit session before uploading video and GPS telemetry."
        actions={
          <Button variant="outline" icon={ArrowLeft} onClick={() => navigate(-1)}>
            Cancel
          </Button>
        }
      />

      <Card style={{ maxWidth: '600px' }}>
        <form onSubmit={handleSubmit}>
          <Input
            label="Session / Inspection Name"
            placeholder="e.g. Ring Road Pre-Monsoon Audit"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Road Corridor Name"
            placeholder="e.g. Ring Road Lajpat to AIIMS"
            value={roadName}
            onChange={(e) => setRoadName(e.target.value)}
            required
          />

          <Input
            label="District / Zone Area"
            placeholder="e.g. South Delhi District"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            required
          />

          <div className="input-group">
            <label className="input-label">Operator Notes</label>
            <textarea
              className="textarea-field"
              placeholder="Camera angle, vehicle speed, weather conditions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button type="submit" variant="primary" loading={loading} icon={Layers} style={{ width: '100%', marginTop: '1rem' }}>
            Initialize & Proceed to Upload
          </Button>
        </form>
      </Card>
    </div>
  );
};
