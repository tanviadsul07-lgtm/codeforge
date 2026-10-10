import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard, Card } from '../../components/common/Card';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ProgressDetailsModal } from '../../components/common/ProgressDetailsModal';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  ShieldAlert,
  Wrench,
  Layers
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

export const DepartmentDashboard = () => {
  const { complaints } = useApp();
  const navigate = useNavigate();

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const totalComplaints = complaints.length;
  const pendingReviewCount = complaints.filter(c => c.status === 'Submitted' || c.status === 'Under Review' || c.status === 'Pending').length;
  const highPriorityCount = complaints.filter(c => c.priority === 'High' || c.priority === 'Critical').length;
  const activeDispatchesCount = complaints.filter(c => c.status === 'Assigned' || c.status === 'In Progress' || c.status === 'Repair Dispatched').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved' || c.status === 'Approved').length;

  const chartData = [
    { name: 'Mon', complaints: 4, resolved: 3 },
    { name: 'Tue', complaints: 7, resolved: 5 },
    { name: 'Wed', complaints: 5, resolved: 4 },
    { name: 'Thu', complaints: 9, resolved: 7 },
    { name: 'Fri', complaints: 6, resolved: 6 },
    { name: 'Sat', complaints: 3, resolved: 2 },
    { name: 'Sun', complaints: 2, resolved: 2 },
  ];

  // Dynamic hazard category distribution pie chart
  const categoryCounts = complaints.reduce((acc, c) => {
    const cat = c.category || 'Pothole';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const categoryColors = {
    'Pothole': '#12BDF2',
    'Waterlogging': '#06B6D4',
    'Fallen Tree': '#D97706',
    'Road Debris': '#FF647C',
    'Road Obstruction': '#8B5CF6'
  };

  const pieData = Object.keys(categoryCounts).length > 0
    ? Object.keys(categoryCounts).map(cat => ({
        name: cat,
        value: categoryCounts[cat],
        color: categoryColors[cat] || '#64748B'
      }))
    : [
        { name: 'Pothole', value: 1, color: '#12BDF2' }
      ];

  const handleOpenProgress = (c) => {
    setSelectedComplaint(c);
    setModalOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Road Department Control Center"
        description="Executive dashboard for municipal road complaints, repair dispatches, hazard verification, and quality analytics."
        actions={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="primary" icon={ShieldAlert} onClick={() => navigate('/department/priority-queue')}>
              Priority Queue ({highPriorityCount})
            </Button>
            <Button variant="secondary" icon={BarChart3} onClick={() => navigate('/department/analytics')}>
              Full Analytics
            </Button>
          </div>
        }
      />

      {/* Department Key Stats */}
      <div className="grid-stats">
        <StatCard
          icon={FileText}
          value={totalComplaints}
          label="Total Civic Complaints"
          trendValue="All municipal zones"
        />
        <StatCard
          icon={Clock}
          value={pendingReviewCount}
          label="Pending Department Review"
          iconBg="var(--warning-bg)"
        />
        <StatCard
          icon={Wrench}
          value={activeDispatchesCount}
          label="Active Repair Dispatches"
          iconBg="rgba(18, 189, 242, 0.15)"
          trendValue="Field teams deployed"
        />
        <StatCard
          icon={CheckCircle2}
          value={resolvedCount}
          label="Hazards Resolved"
          iconBg="var(--success-bg)"
        />
      </div>

      {/* Analytics Charts Row */}
      <div className="grid-two-col" style={{ marginBottom: '1.5rem' }}>
        <Card title="Weekly Complaint & Resolution Trends">
          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#91A9BB" fontSize={12} />
                <YAxis stroke="#91A9BB" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0D263B', borderColor: '#164A6B', color: '#F2F8FC' }}
                />
                <Bar dataKey="complaints" fill="#12BDF2" name="Logged Complaints" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" fill="#38D996" name="Repairs Resolved" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Hazard Distribution by Category">
          <div style={{ width: '100%', height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0D263B', borderColor: '#164A6B', color: '#F2F8FC' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Priority Complaints Table */}
      <Card
        title="Pending Department Action Items"
        subtitle="Complaints awaiting dispatch or review"
        action={
          <Button variant="outline" size="sm" onClick={() => navigate('/department/complaints')}>
            View All Complaints
          </Button>
        }
      >
        <Table headers={['Complaint ID', 'Category', 'Location', 'Priority', 'Status', 'Assigned Team', 'Actions']}>
          {complaints.map((c) => (
            <tr key={c.id || c.reportId}>
              <td style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{c.id || c.reportId}</td>
              <td style={{ fontWeight: 600 }}>{c.category}</td>
              <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.location}</td>
              <td><Badge status={c.priority} /></td>
              <td><Badge status={c.status} /></td>
              <td style={{ fontSize: '0.8rem', fontWeight: 600 }}>{c.assignedTeam || c.assignedTo || 'Unassigned'}</td>
              <td>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <Button variant="outline" size="sm" onClick={() => handleOpenProgress(c)}>
                    <Layers size={13} style={{ marginRight: '4px' }} />
                    Track Progress
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => navigate(`/department/complaints/${c.id || c.reportId}`)}>
                    Review
                  </Button>
                </div>
              </td>
            </tr>
          ))}
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
