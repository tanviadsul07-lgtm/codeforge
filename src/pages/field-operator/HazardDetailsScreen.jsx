import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { HazardMap } from '../../components/maps/HazardMap';
import { formatCoordinates } from '../../utils/formatters';
import { ArrowLeft, Edit3, ShieldAlert } from 'lucide-react';

export const HazardDetailsScreen = () => {
  const { id } = useParams();
  const { hazards, addComplaint } = useApp();
  const navigate = useNavigate();

  const hazard = hazards.find(h => h.id === id) || hazards[0];

  const handleCreateComplaint = () => {
    const newComplaint = addComplaint({
      category: hazard.category,
      hazardId: hazard.id,
      location: hazard.address,
      latitude: hazard.latitude,
      longitude: hazard.longitude,
      severity: hazard.severity,
      description: `Elevated from AI Field Survey session ${hazard.sessionId}: ${hazard.description}`,
      evidenceImage: hazard.evidenceImage
    });
    navigate(`/department/complaints/${newComplaint.id}/review`);
  };

  return (
    <div>
      <PageHeader
        title={`Hazard Record Details: ${hazard.id}`}
        description={`AI detection details for ${hazard.category} recorded at ${hazard.address}`}
        actions={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="outline" icon={ArrowLeft} onClick={() => navigate(-1)}>
              Back
            </Button>
            <Button variant="secondary" icon={Edit3} onClick={() => navigate(`/operator/hazards/${hazard.id}/verify`)}>
              Verify / Edit
            </Button>
            <Button variant="primary" icon={ShieldAlert} onClick={handleCreateComplaint}>
              Escalate to Department Complaint
            </Button>
          </div>
        }
      />

      <div className="grid-two-col">
        <Card title="Hazard Telemetry & Evidence">
          <img
            src={hazard.evidenceImage}
            alt={hazard.category}
            style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div><strong>Hazard ID:</strong> {hazard.id}</div>
            <div><strong>Category:</strong> {hazard.category}</div>
            <div><strong>AI Confidence:</strong> {(hazard.confidence * 100).toFixed(1)}%</div>
            <div><strong>Severity:</strong> <Badge status={hazard.severity} /></div>
            <div><strong>Status:</strong> <Badge status={hazard.verificationStatus} /></div>
            <div><strong>Video Timestamp:</strong> {hazard.videoTimestamp}</div>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
            {hazard.description}
          </p>
        </Card>

        <Card title="Geolocated Coordinates">
          <HazardMap hazards={[hazard]} selectedHazardId={hazard.id} height="280px" />
          <div style={{ fontSize: '0.85rem', marginTop: '1rem', color: 'var(--text-secondary)' }}>
            <strong>Location:</strong> {hazard.address} ({formatCoordinates(hazard.latitude, hazard.longitude)})
          </div>
        </Card>
      </div>
    </div>
  );
};
