import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Activity, CheckCircle2, Database, ShieldAlert } from 'lucide-react';

export const SystemDiagnosticsScreen = () => {
  return (
    <div>
      <PageHeader
        title="System Diagnostics & Health Monitor"
        description="Frontend client-side runtime environment metrics and local storage state inspection."
      />

      <div className="grid-two-col">
        <Card title="Runtime Client Diagnostics">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Frontend Framework:</span>
              <strong>React 18.3 (Vite 5.4)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Router Module:</span>
              <strong>React Router v6</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Geospatial Engine:</span>
              <strong>Leaflet 1.9 (OpenStreetMap Tiles)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Data Visualization:</span>
              <strong>Recharts 2.12</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Demo Mode Status:</span>
              <Badge status="Verified">ACTIVE (Standalone)</Badge>
            </div>
          </div>
        </Card>

        <Card title="Local Storage Memory Audit">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Hazards Cache:</span>
              <strong>{localStorage.getItem('pr_hazards') ? 'Customized' : 'Default Mock'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Complaints Cache:</span>
              <strong>{localStorage.getItem('pr_complaints') ? 'Customized' : 'Default Mock'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Work Orders Cache:</span>
              <strong>{localStorage.getItem('pr_work_orders') ? 'Customized' : 'Default Mock'}</strong>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
