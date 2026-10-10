import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Play, Download, CheckCircle2, AlertTriangle, Eye, Edit3, MapPin } from 'lucide-react';

export const AiDetectionResultsScreen = () => {
  const { jobId } = useParams();
  const { hazards, surveys } = useApp();
  const navigate = useNavigate();
  const [selectedHazardId, setSelectedHazardId] = useState(hazards[0]?.id);

  const session = surveys.find(s => s.id === jobId) || surveys[0];
  const detectedHazards = hazards.filter(h => h.sessionId === session.id || h.sessionId === 'SUR-2026-101');
  const activeHazard = hazards.find(h => h.id === selectedHazardId) || hazards[0];

  return (
    <div>
      <PageHeader
        title={`AI Detection Results: ${session.id}`}
        description={`Model inferences from ${session.videoFile} (${session.roadName})`}
        actions={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="outline" icon={MapPin} onClick={() => navigate('/operator/gis')}>
              View on GIS Map
            </Button>
            <Button variant="primary" icon={Download} onClick={() => navigate('/operator/geojson')}>
              Export GeoJSON
            </Button>
          </div>
        }
      />

      <div className="grid-two-col" style={{ marginBottom: '1.5rem' }}>
        {/* Video Player Frame with AI Bounding Box Overlay */}
        <Card title="Video Stream & AI Bounding Box Inference">
          <div style={{
            position: 'relative',
            width: '100%',
            height: '320px',
            backgroundColor: '#0F172A',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img
              src={activeHazard?.evidenceImage}
              alt="Video frame"
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
            />

            {/* AI Bounding Box Overlay Simulation */}
            <div style={{
              position: 'absolute',
              top: '25%',
              left: '35%',
              width: '140px',
              height: '90px',
              border: '2px stroke var(--primary-blue)',
              outline: '2px solid #3B82F6',
              boxShadow: '0 0 12px rgba(59, 130, 246, 0.6)',
              borderRadius: '4px',
              padding: '4px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <span style={{ backgroundColor: '#2563EB', color: '#FFF', fontSize: '0.65rem', fontWeight: 800, padding: '2px 4px', borderRadius: '2px', width: 'fit-content' }}>
                {activeHazard?.category} ({(activeHazard?.confidence * 100).toFixed(0)}%)
              </span>
              <span style={{ color: '#FFF', fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 4px' }}>
                {activeHazard?.videoTimestamp}
              </span>
            </div>

            <div style={{ position: 'absolute', bottom: '12px', left: '12px', color: '#FFF', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'rgba(15,23,42,0.8)', padding: '4px 8px', borderRadius: '4px' }}>
              Timestamp: {activeHazard?.videoTimestamp} | Frame #1240 | WGS84: {activeHazard?.latitude}, {activeHazard?.longitude}
            </div>
          </div>
        </Card>

        {/* AI Detection Summary Widget */}
        <Card title="Detection Summary & Confidence">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-soft-blue)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700 }}>AI CONFIDENCE SCORE</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-blue)' }}>
                {(activeHazard?.confidence * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', marginTop: '2px' }}>
                YOLOv8 Road Defect Model v2.4 (High Confidence)
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div><strong>Hazard ID:</strong> {activeHazard?.id}</div>
              <div><strong>Category:</strong> {activeHazard?.category}</div>
              <div><strong>Severity:</strong> <Badge status={activeHazard?.severity} /></div>
              <div><strong>Status:</strong> <Badge status={activeHazard?.verificationStatus} /></div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button variant="primary" icon={Edit3} onClick={() => navigate(`/operator/hazards/${activeHazard?.id}/verify`)}>
                Verify / Edit Hazard
              </Button>
              <Button variant="outline" icon={Eye} onClick={() => navigate(`/operator/hazards/${activeHazard?.id}`)}>
                Hazard Details
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Detected Hazards Table */}
      <Card title="Detected Hazards Inventory">
        <Table headers={['Hazard ID', 'Category', 'Video Timestamp', 'AI Confidence', 'Severity', 'Verification Status', 'Actions']}>
          {detectedHazards.map((h) => (
            <tr key={h.id} style={{ backgroundColor: h.id === selectedHazardId ? 'var(--bg-soft-blue)' : 'transparent' }}>
              <td style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{h.id}</td>
              <td style={{ fontWeight: 600 }}>{h.category}</td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{h.videoTimestamp}</td>
              <td style={{ fontWeight: 700 }}>{(h.confidence * 100).toFixed(1)}%</td>
              <td><Badge status={h.severity} /></td>
              <td><Badge status={h.verificationStatus} /></td>
              <td>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <Button variant="outline" size="sm" onClick={() => setSelectedHazardId(h.id)}>
                    Inspect
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => navigate(`/operator/hazards/${h.id}/verify`)}>
                    Verify
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
};
