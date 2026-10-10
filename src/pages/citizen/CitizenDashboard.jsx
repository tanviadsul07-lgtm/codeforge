import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard, Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { HazardMap } from '../../components/maps/HazardMap';
import { ProgressDetailsModal } from '../../components/common/ProgressDetailsModal';
import { formatDate } from '../../utils/formatters';
import {
  ShieldAlert,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowRight,
  MapPin,
  Upload,
  Cpu,
  Layers
} from 'lucide-react';

export const CitizenDashboard = () => {
  const { user } = useAuth();
  const { complaints, hazards } = useApp();
  const navigate = useNavigate();

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const totalComplaints = complaints.length;
  const pendingCount = complaints.filter(c => c.status === 'Submitted' || c.status === 'Under Review' || c.status === 'Pending').length;
  const inProgressCount = complaints.filter(c => c.status === 'Assigned' || c.status === 'In Progress').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved' || c.status === 'Approved').length;

  const handleTrackProgress = (complaint) => {
    setSelectedComplaint(complaint);
    setModalOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Welcome back, ${user?.name || 'Citizen'}!`}
        description="Monitor road safety in your area, submit hazard complaints, and track municipal repair progress."
        actions={
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <Button variant="outline" icon={Upload} onClick={() => navigate('/citizen/upload')}>
              Upload Video + GPS
            </Button>
            <Button variant="outline" icon={Cpu} onClick={() => navigate('/citizen/jobs')}>
              Track AI Jobs
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => navigate('/citizen/report-hazard')}>
              Report New Hazard
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid-stats">
        <StatCard
          icon={FileText}
          value={totalComplaints}
          label="Total Complaints Logged"
          trendValue="All time reports"
        />
        <StatCard
          icon={Clock}
          value={pendingCount}
          label="Pending Review"
          iconBg="var(--warning-bg)"
        />
        <StatCard
          icon={AlertTriangle}
          value={inProgressCount}
          label="In Progress Repairs"
          iconBg="rgba(18, 189, 242, 0.15)"
        />
        <StatCard
          icon={CheckCircle2}
          value={resolvedCount}
          label="Resolved Hazards"
          iconBg="var(--success-bg)"
        />
      </div>

      {/* Main Grid Layout */}
      <div className="grid-two-col" style={{ marginBottom: '1.5rem' }}>
        {/* Left: Recent Complaints Table */}
        <Card
          title="Recent Hazard Complaints"
          subtitle="Latest reports submitted by you and nearby citizens"
          action={
            <Button variant="outline" size="sm" onClick={() => navigate('/citizen/complaints')}>
              View All
            </Button>
          }
        >
          <Table headers={['ID', 'Category', 'Location', 'Severity', 'Status', 'Date', 'Actions']}>
            {complaints.slice(0, 5).map((c) => {
              const cId = c.id || c.reportId;
              return (
                <tr key={cId}>
                  <td style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{cId}</td>
                  <td style={{ fontWeight: 600 }}>{c.category}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.location}</td>
                  <td><Badge status={c.severity || c.priority || 'Medium'} /></td>
                  <td><Badge status={c.status} /></td>
                  <td style={{ fontSize: '0.8rem' }}>{formatDate(c.submittedDate || c.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <Button variant="outline" size="sm" onClick={() => handleTrackProgress(c)}>
                        <Layers size={13} style={{ marginRight: '4px' }} />
                        Track
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => navigate(`/citizen/complaints/${cId}`)}>
                        Details
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
        </Card>

        {/* Right: Nearby Hazard Map Preview */}
        <Card
          title="Nearby Hazards Map"
          subtitle="Real-time geolocated hazard markers"
          action={
            <Button variant="secondary" size="sm" icon={MapPin} onClick={() => navigate('/citizen/map')}>
              Full GIS Map
            </Button>
          }
        >
          <HazardMap hazards={hazards} height="320px" />
        </Card>
      </div>

      {/* Quick Action Banner */}
      <div className="card accent-line-top" style={{
        backgroundColor: '#0F2438',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.5rem 2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            backgroundColor: 'var(--primary-blue)', color: '#071522',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ShieldAlert size={26} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Spotted a Pothole or Road Hazard?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Submit photo evidence & geotag to notify local Road Department Officers immediately.
            </p>
          </div>
        </div>
        <Button variant="primary" icon={ArrowRight} iconPosition="right" onClick={() => navigate('/citizen/report-hazard')}>
          Report Now
        </Button>
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
