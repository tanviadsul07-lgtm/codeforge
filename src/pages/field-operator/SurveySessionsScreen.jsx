import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { SearchInput } from '../../components/common/SearchInput';
import { formatDate } from '../../utils/formatters';
import { Plus, Upload } from 'lucide-react';

export const SurveySessionsScreen = () => {
  const { surveys } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = (surveys || []).filter(s => {
    if (!s) return false;
    const searchLower = (search || '').toLowerCase();
    if (!searchLower) return true;
    return (
      (s.id || s.sessionId || '').toLowerCase().includes(searchLower) ||
      (s.name || '').toLowerCase().includes(searchLower) ||
      (s.roadName || '').toLowerCase().includes(searchLower)
    );
  });

  return (
    <div>
      <PageHeader
        title="Survey Sessions Registry"
        description="Comprehensive list of video dashcam surveys and corresponding GPS logs."
        actions={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="outline" icon={Plus} onClick={() => navigate('/operator/surveys/create')}>
              New Survey Session
            </Button>
            <Button variant="primary" icon={Upload} onClick={() => navigate('/operator/upload')}>
              Upload Video & GPS
            </Button>
          </div>
        }
      />

      <Card>
        <div style={{ marginBottom: '1.25rem' }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by Session ID, Name, Road..."
          />
        </div>

        <Table headers={['Session ID', 'Survey Name', 'Road / Corridor', 'Date', 'Video File', 'GPS Logs', 'Status', 'Detections', 'Actions']}>
          {filtered.map((s) => (
            <tr key={s.id}>
              <td style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{s.id}</td>
              <td style={{ fontWeight: 600 }}>{s.name}</td>
              <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.roadName}</td>
              <td style={{ fontSize: '0.8rem' }}>{formatDate(s.date)}</td>
              <td style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>{s.videoFile}</td>
              <td style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>{s.gpsStatus}</td>
              <td><Badge status={s.processingStatus} /></td>
              <td style={{ fontWeight: 800 }}>{s.hazardCount}</td>
              <td>
                <Button variant="outline" size="sm" onClick={() => navigate(`/operator/results/${s.id}`)}>
                  View Results
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
};
