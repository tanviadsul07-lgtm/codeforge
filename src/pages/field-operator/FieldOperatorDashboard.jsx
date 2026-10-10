import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard, Card } from '../../components/common/Card';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { SearchInput } from '../../components/common/SearchInput';
import { ProgressDetailsModal } from '../../components/common/ProgressDetailsModal';
import { formatDate } from '../../utils/formatters';
import { HAZARD_CATEGORIES } from '../../utils/constants';
import {
  Layers,
  Upload,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  Filter,
  Clock,
  ShieldCheck,
  Camera
} from 'lucide-react';
import { usePageTitle } from '../../hooks/usePageTitle';

export const FieldOperatorDashboard = () => {
  const { user } = useAuth();
  const { complaints, hazards, surveys } = useApp();
  const navigate = useNavigate();
  usePageTitle();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Real Statistics
  const totalReports = complaints.length;
  const pendingInspections = complaints.filter(c => c.verificationStatus === 'Pending' || c.status === 'Submitted').length;
  const verifiedHazards = complaints.filter(c => c.verificationStatus === 'Verified' || c.status === 'Verified').length;
  const highPriorityCount = complaints.filter(c => c.severity === 'High' || c.severity === 'Critical' || c.priority === 'High' || c.priority === 'Critical').length;

  // Filtered Reports for Table
  const filteredReports = complaints.filter(c => {
    const matchesSearch = (c.id || c.reportId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.description || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || c.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || 
                          (statusFilter === 'Pending' && (c.verificationStatus === 'Pending' || c.status === 'Submitted')) ||
                          (statusFilter === 'Verified' && (c.verificationStatus === 'Verified' || c.status === 'Verified')) ||
                          (statusFilter === 'Rejected' && (c.verificationStatus === 'Rejected' || c.status === 'Rejected'));

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleTrackProgress = (complaint) => {
    setSelectedComplaint(complaint);
    setModalOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Field Operator Control Center`}
        description={`Logged in as ${user?.displayName || user?.name || 'Field Operator'}. Review, inspect, and verify geotagged road hazards.`}
        actions={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="primary" icon={Camera} onClick={() => navigate('/operator/live-scanner')}>
              Live GeoAI Scanner
            </Button>
            <Button variant="secondary" icon={Upload} onClick={() => navigate('/operator/upload')}>
              Upload Media
            </Button>
            <Button variant="outline" icon={Download} onClick={() => navigate('/operator/geojson')}>
              Export Data
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid-stats">
        <StatCard
          icon={Layers}
          value={totalReports}
          label="Total Assigned Reports"
          trendValue="Live persistence"
        />
        <StatCard
          icon={Clock}
          value={pendingInspections}
          label="Pending Inspections"
          iconBg="var(--warning-bg)"
        />
        <StatCard
          icon={ShieldCheck}
          value={verifiedHazards}
          label="Verified Hazards"
          iconBg="var(--success-bg)"
        />
        <StatCard
          icon={AlertTriangle}
          value={highPriorityCount}
          label="High/Critical Priority"
          iconBg="var(--danger-bg)"
        />
      </div>

      {/* Main Grid */}
      <div className="grid-two-col" style={{ marginBottom: '1.5rem' }}>
        {/* Left: Assigned Road Reports Table */}
        <Card
          title="Assigned Road Hazard Reports"
          subtitle="Real-time citizen & AI hazard submissions awaiting operator verification"
        >
          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search Report ID, location, category..."
              />
            </div>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={['All', ...HAZARD_CATEGORIES]}
              style={{ width: 'auto', padding: '0.45rem 0.75rem' }}
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={['All', 'Pending', 'Verified', 'Rejected']}
              style={{ width: 'auto', padding: '0.45rem 0.75rem' }}
            />
          </div>

          <Table headers={['Report ID', 'Category', 'Location', 'Severity', 'Verification', 'Date', 'Actions']}>
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No road hazard reports matching criteria.
                </td>
              </tr>
            ) : (
              filteredReports.slice(0, 8).map((r) => {
                const reportId = r.id || r.reportId;
                const isVerified = r.verificationStatus === 'Verified' || r.status === 'Verified';
                const isRejected = r.verificationStatus === 'Rejected' || r.status === 'Rejected';
                const statusBadge = isVerified ? 'Verified' : isRejected ? 'Rejected' : 'Pending';

                return (
                  <tr key={reportId}>
                    <td style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{reportId}</td>
                    <td style={{ fontWeight: 600 }}>{r.category}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '200px' }}>{r.location}</td>
                    <td><Badge status={r.severity || r.priority || 'Medium'} /></td>
                    <td><Badge status={statusBadge} /></td>
                    <td style={{ fontSize: '0.8rem' }}>{formatDate(r.createdAt || r.submittedDate)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTrackProgress(r)}
                        >
                          Track
                        </Button>
                        <Button
                          variant={isVerified ? 'outline' : 'primary'}
                          size="sm"
                          icon={Eye}
                          onClick={() => navigate(`/operator/hazards/${reportId}/verify`)}
                        >
                          {isVerified ? 'Audit' : 'Inspect'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </Table>
        </Card>

        {/* Right: Live Survey Sessions & AI Inference Queue */}
        <Card title="Survey Sessions & AI Dashcam Runs">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {surveys.map((s) => (
              <div key={s.id} style={{
                padding: '1rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#071522'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{s.roadName || s.name}</span>
                  <Badge status={s.processingStatus} />
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  ID: {s.id} | Date: {formatDate(s.date)} | Trajectory: {s.gpsStatus}
                </div>

                <div style={{ width: '100%', height: '6px', backgroundColor: '#0F2438', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${s.progressPercent || 100}%`,
                    height: '100%',
                    backgroundColor: (s.progressPercent || 100) === 100 ? 'var(--status-resolved)' : 'var(--primary-blue)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>
                  <span>{s.progressPercent || 100}% Processed</span>
                  <span>{s.hazardCount || 0} Detections</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

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
