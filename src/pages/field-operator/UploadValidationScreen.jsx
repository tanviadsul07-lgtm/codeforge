import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { CheckCircle2, AlertTriangle, ArrowRight, Video, FileText } from 'lucide-react';

export const UploadValidationScreen = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId') || 'SUR-2026-101';
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title={`Upload Validation Check: ${sessionId}`}
        description="Automated pre-flight integrity verification of video frames and GPS trajectory synchronization."
      />

      <Card style={{ maxWidth: '680px', margin: '0 auto' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem' }}>
          Telemetry Integrity Verification Results
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-sidebar)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Dashcam Video Stream</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>1080p @ 60fps • 18,400 video frames indexed</div>
              </div>
            </div>
            <Badge status="Verified" />
          </div>

          <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-sidebar)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>GPS Telemetry Sync</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>1,420 WGS-84 trackpoints mapped (10Hz sampling)</div>
              </div>
            </div>
            <Badge status="Verified" />
          </div>

          <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertTriangle size={20} style={{ color: 'var(--warning)' }} />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--warning)' }}>Minor Exposure Warning</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Frames 04:12 to 04:18 exhibit lens glare; confidence slightly reduced</div>
              </div>
            </div>
            <Badge status="Under Review" />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <Button variant="outline" onClick={() => navigate('/operator/upload')}>
            Replace Files
          </Button>
          <Button variant="primary" icon={ArrowRight} iconPosition="right" onClick={() => navigate(`/operator/jobs`)}>
            Launch AI Inference Pipeline
          </Button>
        </div>
      </Card>
    </div>
  );
};
