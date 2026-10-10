import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard, Card } from '../../components/common/Card';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { SearchInput } from '../../components/common/SearchInput';
import { Select } from '../../components/common/Select';
import { ProgressDetailsModal } from '../../components/common/ProgressDetailsModal';
import { formatDate } from '../../utils/formatters';
import { HAZARD_CATEGORIES } from '../../utils/constants';
import {
  ShieldAlert,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  BarChart3,
  UserCheck,
  Eye,
  XCircle,
  HardHat,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const AdminDashboard = () => {
  const { complaints, hazards } = useApp();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Real Calculated Metrics
  const totalComplaints = (complaints || []).length;
  const submittedCount = (complaints || []).filter(c => c.status === 'Submitted' || c.verificationStatus === 'Pending').length;
  const inProgressCount = (complaints || []).filter(c => c.status === 'In Progress' || c.status === 'Assigned').length;
  const awaitingApprovalCount = (complaints || []).filter(c => c.status === 'Awaiting Approval' || c.status === 'In Review').length;
  const resolvedCount = (complaints || []).filter(c => c.status === 'Resolved' || c.status === 'Approved').length;

  const now = new Date();
  const overdueCount = (complaints || []).filter(c => {
    if (c.status === 'Resolved' || c.status === 'Approved' || c.status === 'Rejected') return false;
    if (!c.targetCompletionDate) return false;
    return new Date(c.targetCompletionDate) < now;
  }).length;

  const resolutionRate = totalComplaints > 0
    ? Math.round((resolvedCount / totalComplaints) * 100)
    : 100;

  // Category Distribution
  const categoryCounts = (complaints || []).reduce((acc, c) => {
    const cat = c.category || 'Pothole';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const categoryColors = {
    'Pothole': '#12BDF2',
    'Waterlogging': '#06B6D4',
    'Fallen Tree': '#D97706',
    'Road Debris': '#FF647C',
    'Road Blockage': '#8B5CF6'
  };

  const pieData = Object.keys(categoryCounts).length > 0
    ? Object.keys(categoryCounts).map(cat => ({
        name: cat,
        value: categoryCounts[cat],
        color: categoryColors[cat] || '#64748B'
      }))
    : [{ name: 'Pothole', value: 1, color: '#12BDF2' }];

  // Field Operator Workload
  const operatorWorkload = (complaints || []).reduce((acc, c) => {
    const op = c.assignedTeam || c.assignedOperatorName || 'Unassigned';
    acc[op] = (acc[op] || 0) + 1;
    return acc;
  }, {});

  const operatorBarData = Object.keys(operatorWorkload).map(op => ({
    name: op.split(' ')[0],
    fullname: op,
    assignedCount: operatorWorkload[op]
  }));

  // Filtered Complaints Table
  const filteredComplaints = (complaints || []).filter(c => {
    const query = searchQuery.toLowerCase();
    const idStr = (c.id || c.reportId || '').toLowerCase();
    const catStr = (c.category || '').toLowerCase();
    const locStr = (c.location || '').toLowerCase();
    const descStr = (c.description || '').toLowerCase();

    const matchesSearch = !query || idStr.includes(query) || catStr.includes(query) || locStr.includes(query) || descStr.includes(query);
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || c.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleTrackProgress = (complaint) => {
    setSelectedComplaint(complaint);
    setModalOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Executive System Admin Command Center"
        description="Comprehensive role-based oversight, live database metrics, field staff workload, and GeoAI complaint analytics."
        actions={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="primary" icon={ShieldAlert} onClick={() => navigate('/department/users')}>
              User & Staff Access
            </Button>
          </div>
        }
      />

      {/* Top Level Metric Stat Cards */}
      <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <StatCard
          icon={FileText}
          value={totalComplaints}
          label="Total Civic Complaints"
          trendValue="All municipal records"
        />
        <StatCard
          icon={Clock}
          value={submittedCount}
          label="Awaiting Verification"
          iconBg="var(--warning-bg)"
        />
        <StatCard
          icon={HardHat}
          value={inProgressCount}
          label="Active Repair In-Progress"
          iconBg="rgba(18, 189, 242, 0.15)"
        />
        <StatCard
          icon={AlertTriangle}
          value={awaitingApprovalCount}
          label="Work Awaiting Approval"
          iconBg="rgba(245, 185, 66, 0.2)"
        />
        <StatCard
          icon={CheckCircle2}
          value={resolvedCount}
          label="Fully Resolved (100%)"
          iconBg="var(--success-bg)"
        />
        <StatCard
          icon={XCircle}
          value={overdueCount}
          label="Overdue Target Date"
          iconBg="var(--danger-bg)"
        />
      </div>

      {/* Key KPI Progress Bar & Resolution Rate */}
      <Card style={{ marginBottom: '1.5rem', backgroundColor: '#0F2438' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Overall Complaint Resolution Efficiency
            </h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {resolvedCount} of {totalComplaints} complaints successfully completed & department verified
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--status-resolved)' }}>
            {resolutionRate}%
          </div>
        </div>
        <div style={{ width: '100%', height: '10px', backgroundColor: '#071522', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{ width: `${resolutionRate}%`, height: '100%', backgroundColor: 'var(--status-resolved)', transition: 'width 0.4s ease' }} />
        </div>
      </Card>

      {/* Analytics Charts */}
      <div className="grid-two-col" style={{ marginBottom: '1.5rem' }}>
        <Card title="Field Operator Workload Distribution">
          <div style={{ width: '100%', height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={operatorBarData}>
                <XAxis dataKey="name" stroke="#91A9BB" fontSize={12} />
                <YAxis stroke="#91A9BB" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0D263B', borderColor: '#164A6B', color: '#F2F8FC' }} />
                <Bar dataKey="assignedCount" fill="#12BDF2" name="Assigned Complaints" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="GeoAI Hazard Distribution by Category">
          <div style={{ width: '100%', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0D263B', borderColor: '#164A6B', color: '#F2F8FC' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Authoritative Complaints Directory */}
      <Card
        title="Authoritative Complaints Directory"
        subtitle="Complete database audit log across Citizen, Department, and Operator roles"
      >
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search Complaint ID, location, category..."
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={['All', 'Submitted', 'Verified', 'Assigned', 'In Progress', 'Awaiting Approval', 'Resolved', 'Rejected']}
            style={{ width: 'auto' }}
          />
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={['All', ...HAZARD_CATEGORIES]}
            style={{ width: 'auto' }}
          />
        </div>

        <Table headers={['Complaint ID', 'Category', 'Location', 'Status', 'Progress', 'Assigned Operator', 'Submitted Date', 'Actions']}>
          {filteredComplaints.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                No complaints found matching the selected filters.
              </td>
            </tr>
          ) : (
            filteredComplaints.map((c) => {
              const cId = c.id || c.reportId;
              const prog = typeof c.repairProgress === 'number' ? c.repairProgress : (c.status === 'Resolved' || c.status === 'Approved' ? 100 : 0);

              return (
                <tr key={cId}>
                  <td style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{cId}</td>
                  <td style={{ fontWeight: 600 }}>{c.category}</td>
                  <td style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', maxWidth: '200px' }}>{c.location}</td>
                  <td><Badge status={c.status} /></td>
                  <td style={{ fontWeight: 700, color: prog >= 100 ? 'var(--status-resolved)' : 'var(--primary-blue)' }}>
                    {prog}%
                  </td>
                  <td style={{ fontSize: '0.825rem', fontWeight: 600 }}>{c.assignedTeam || c.assignedOperatorName || 'Unassigned'}</td>
                  <td style={{ fontSize: '0.8rem' }}>{formatDate(c.createdAt || c.submittedDate)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTrackProgress(c)}
                      >
                        <Layers size={13} style={{ marginRight: '4px' }} />
                        Track
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Eye}
                        onClick={() => navigate(`/admin/complaints/${cId}`)}
                      >
                        Inspect
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
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
