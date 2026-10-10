import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { SearchInput } from '../../components/common/SearchInput';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { ProgressDetailsModal } from '../../components/common/ProgressDetailsModal';
import { COMPLAINT_STATUSES, PRIORITIES } from '../../utils/constants';
import { Layers, Eye, UserCheck } from 'lucide-react';

export const ComplaintManagementScreen = () => {
  const { complaints } = useApp();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = (complaints || []).filter(c => {
    if (!c) return false;
    const searchLower = (search || '').toLowerCase();
    const idStr = (c.id || c.reportId || '').toLowerCase();
    const catStr = (c.category || c.reportType || '').toLowerCase();
    const locStr = (c.location || c.address || '').toLowerCase();

    const matchesSearch = !searchLower || idStr.includes(searchLower) || catStr.includes(searchLower) || locStr.includes(searchLower);
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter || c.verificationStatus === statusFilter;
    const matchesPriority = priorityFilter === 'All' || c.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleTrackProgress = (complaint) => {
    setSelectedComplaint(complaint);
    setModalOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Civic Complaint & Repair Management"
        description="Filter, review, track, and dispatch incoming citizen and AI-detected hazard complaints."
      />

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search Complaint ID, Category, Location..."
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={['All', ...COMPLAINT_STATUSES]}
              style={{ width: '150px' }}
            />
            <Select
              label="Priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={['All', ...PRIORITIES]}
              style={{ width: '130px' }}
            />
          </div>
        </div>

        <Table headers={['Complaint ID', 'Category', 'Location', 'Priority', 'Status', 'Submitted By', 'Assigned Team', 'Actions']}>
          {filtered.map((c, idx) => {
            const reportId = c.id || c.reportId || `PR-2026-${idx}`;
            return (
              <tr key={reportId}>
                <td style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{reportId}</td>
                <td style={{ fontWeight: 600 }}>{c.category || c.reportType || 'Hazard'}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '220px' }}>{c.location || 'Location Not Specified'}</td>
                <td><Badge status={c.priority || 'Medium'} /></td>
                <td><Badge status={c.status || 'Submitted'} /></td>
                <td style={{ fontSize: '0.8rem' }}>{c.submittedBy || 'Citizen User'}</td>
                <td style={{ fontSize: '0.8rem', fontWeight: 600 }}>{c.assignedTeam || 'Unassigned'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <Button variant="outline" size="sm" onClick={() => handleTrackProgress(c)}>
                      <Layers size={13} style={{ marginRight: '4px' }} />
                      Track
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/department/complaints/${reportId}`)}>
                      Review
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => navigate(`/department/repair-assignment/${reportId}`)}>
                      Assign
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>

      {/* Progress Details Telemetry Modal */}
      {selectedComplaint && (
        <ProgressDetailsModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedComplaint(null);
          }}
          complaint={selectedComplaint}
        />
      )}
    </div>
  );
};
