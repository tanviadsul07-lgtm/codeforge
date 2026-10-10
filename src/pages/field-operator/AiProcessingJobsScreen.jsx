import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Cpu, RefreshCw, Eye } from 'lucide-react';

export const AiProcessingJobsScreen = () => {
  const { surveys } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="AI Computer Vision Processing Jobs"
        description="Monitor automated deep learning object detection jobs analyzing survey video streams."
      />

      <Card>
        <Table headers={['Job / Session ID', 'Video Filename', 'Status', 'Progress', 'Detections Found', 'Started Time', 'Actions']}>
          {(surveys || []).map((job) => (
            <tr key={job.id}>
              <td style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{job.id}</td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{job.videoFile}</td>
              <td><Badge status={job.processingStatus} /></td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '140px' }}>
                  <div style={{ flex: 1, height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${job.progressPercent}%`, height: '100%', backgroundColor: 'var(--primary-blue)' }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{job.progressPercent}%</span>
                </div>
              </td>
              <td style={{ fontWeight: 800 }}>{job.hazardCount}</td>
              <td style={{ fontSize: '0.8rem' }}>10:14 AM</td>
              <td>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Eye}
                    onClick={() => navigate(user?.role === 'CITIZEN' ? `/citizen/results/${job.id}` : `/operator/results/${job.id}`)}
                  >
                    View Detections
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
