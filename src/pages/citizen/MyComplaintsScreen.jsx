import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { SearchInput } from '../../components/common/SearchInput';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { formatDate } from '../../utils/formatters';
import { COMPLAINT_STATUSES } from '../../utils/constants';
import { Plus, Eye } from 'lucide-react';

export const MyComplaintsScreen = () => {
  const { complaints } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Show citizen's authorized complaints if user is logged in
  const userComplaints = (complaints || []).filter(c => {
    if (user && user?.uid && c.reporterUid && c.reporterUid !== 'anon-uid') {
      return c.reporterUid === user?.uid;
    }
    return true; // Show available list fallback if unauthenticated demo mode
  });

  const filtered = userComplaints.filter(c => {
    if (!c) return false;
    const searchLower = (search || '').toLowerCase();
    const idStr = (c.id || c.reportId || '').toLowerCase();
    const catStr = (c.category || c.reportType || '').toLowerCase();
    const locStr = (c.location || c.address || '').toLowerCase();

    const matchesSearch = !searchLower || idStr.includes(searchLower) || catStr.includes(searchLower) || locStr.includes(searchLower);
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter || c.verificationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <PageHeader
        title="My Complaints History"
        description="View and track all hazard reports registered under your account."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => navigate('/citizen/report-hazard')}>
            Report Hazard
          </Button>
        }
      />

      <Card>
        {/* Filters Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by Complaint ID, Category, Location..."
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</span>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={['All', ...COMPLAINT_STATUSES]}
              style={{ padding: '0.45rem 0.75rem', width: 'auto' }}
            />
          </div>
        </div>

        <Table headers={['Complaint ID', 'Category', 'Location', 'Severity', 'Priority', 'Status', 'Submitted Date', 'Actions']}>
          {filtered.map((c, idx) => {
            const reportId = c.id || c.reportId || `PR-2026-${idx}`;
            return (
              <tr key={reportId}>
                <td style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{reportId}</td>
                <td style={{ fontWeight: 600 }}>{c.category || c.reportType || 'Hazard'}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '240px' }}>{c.location || 'Location Not Specified'}</td>
                <td><Badge status={c.severity || 'Medium'} /></td>
                <td><Badge status={c.priority || 'Medium'} /></td>
                <td><Badge status={c.status || 'Submitted'} /></td>
                <td style={{ fontSize: '0.85rem' }}>{formatDate(c.submittedDate || c.createdAt)}</td>
                <td>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/citizen/complaints/${reportId}`)}>
                    View Details
                  </Button>
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </div>
  );
};
