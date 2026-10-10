import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Search } from 'lucide-react';

export const GlobalSearchResultsScreen = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { complaints, hazards, workOrders } = useApp();
  const navigate = useNavigate();

  const qLower = (query || '').toLowerCase();

  const matchingComplaints = (complaints || []).filter(c => {
    if (!c) return false;
    if (!qLower) return true;
    return (
      (c.id || c.reportId || '').toLowerCase().includes(qLower) ||
      (c.category || c.reportType || '').toLowerCase().includes(qLower) ||
      (c.location || c.address || '').toLowerCase().includes(qLower)
    );
  });

  const matchingHazards = (hazards || []).filter(h => {
    if (!h) return false;
    if (!qLower) return true;
    return (
      (h.id || h.hazardId || '').toLowerCase().includes(qLower) ||
      (h.category || h.reportType || '').toLowerCase().includes(qLower) ||
      (h.address || h.location || '').toLowerCase().includes(qLower)
    );
  });

  const matchingWorkOrders = (workOrders || []).filter(w => {
    if (!w) return false;
    if (!qLower) return true;
    return (
      (w.id || w.workOrderId || '').toLowerCase().includes(qLower) ||
      (w.hazardCategory || w.category || '').toLowerCase().includes(qLower) ||
      (w.location || w.address || '').toLowerCase().includes(qLower)
    );
  });

  return (
    <div>
      <PageHeader
        title={`Search Results for "${query}"`}
        description="Global search query matches across civic complaints, AI hazard records, and active work orders."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Complaints Section */}
        <Card title={`Matching Civic Complaints (${matchingComplaints.length})`}>
          <Table headers={['ID', 'Category', 'Location', 'Severity', 'Status', 'Action']}>
            {matchingComplaints.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{c.id}</td>
                <td style={{ fontWeight: 600 }}>{c.category}</td>
                <td style={{ fontSize: '0.85rem' }}>{c.location}</td>
                <td><Badge status={c.severity} /></td>
                <td><Badge status={c.status} /></td>
                <td>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/citizen/complaints/${c.id}`)}>
                    View Details
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        </Card>

        {/* Hazards Section */}
        <Card title={`Matching AI Hazard Records (${matchingHazards.length})`}>
          <Table headers={['Hazard ID', 'Category', 'Address Location', 'Confidence', 'Severity', 'Action']}>
            {matchingHazards.map(h => (
              <tr key={h.id}>
                <td style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{h.id}</td>
                <td style={{ fontWeight: 600 }}>{h.category}</td>
                <td style={{ fontSize: '0.85rem' }}>{h.address}</td>
                <td style={{ fontWeight: 700 }}>{(h.confidence * 100).toFixed(1)}%</td>
                <td><Badge status={h.severity} /></td>
                <td>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/operator/hazards/${h.id}`)}>
                    Inspect
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </div>
  );
};
