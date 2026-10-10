import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { CheckCircle2 } from 'lucide-react';

export const HazardVerificationQueueScreen = () => {
  const { hazards } = useApp();
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Department AI Hazard Verification Queue"
        description="Review AI-detected defects before confirming official civic complaint creation."
      />

      <Card>
        <Table headers={['Hazard ID', 'Category', 'Address Location', 'AI Confidence', 'Severity', 'Verification Status', 'Action']}>
          {hazards.map((h) => (
            <tr key={h.id}>
              <td style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{h.id}</td>
              <td style={{ fontWeight: 600 }}>{h.category}</td>
              <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{h.address}</td>
              <td style={{ fontWeight: 700 }}>{(h.confidence * 100).toFixed(1)}%</td>
              <td><Badge status={h.severity} /></td>
              <td><Badge status={h.verificationStatus} /></td>
              <td>
                <Button variant="secondary" size="sm" icon={CheckCircle2} onClick={() => navigate(`/operator/hazards/${h.id}/verify`)}>
                  Audit & Verify
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
};
