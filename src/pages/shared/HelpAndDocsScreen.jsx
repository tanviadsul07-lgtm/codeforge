import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { ShieldAlert, BookOpen, Cpu, MapPin, FileJson, CheckCircle2 } from 'lucide-react';

export const HelpAndDocsScreen = () => {
  return (
    <div>
      <PageHeader
        title="Help & System Documentation"
        description="Comprehensive user guide, architecture breakdown, and hackathon presentation guide for PathRakshak AI."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px' }}>
        <Card title="1. Platform Overview & Workflow Architecture">
          <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
            PathRakshak AI bridges citizen reporting with automated computer vision road surveillance and municipal repair dispatch.
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: 'var(--primary-blue)' }}>Citizen Portal</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Log geotagged hazard photos, track complaint timeline from Submission to Resolution.</p>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: 'var(--cyan-accent)' }}>Field Operator</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Upload dashcam video streams + GPX telemetry, verify AI object detections, export GeoJSON.</p>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: 'var(--warning)' }}>Department Officer</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Audit complaints, dispatch field repair crews, manage work orders, analyze road quality KPIs.</p>
              </div>
            </div>
          </div>
        </Card>

        <Card title="2. Future Backend Integration API Endpoints">
          <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', backgroundColor: '#0F172A', color: '#38BDF8', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
            <div>POST /api/v1/auth/login</div>
            <div>POST /api/v1/surveys/upload (multipart/form-data video & GPX)</div>
            <div>GET  /api/v1/hazards?bbox=...</div>
            <div>POST /api/v1/complaints</div>
            <div>POST /api/v1/work-orders</div>
            <div>GET  /api/v1/export/geojson</div>
          </div>
        </Card>
      </div>
    </div>
  );
};
