import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, StatCard } from '../../components/common/Card';
import { Select } from '../../components/common/Select';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { BarChart3, TrendingUp, CheckCircle2, Clock } from 'lucide-react';

export const DepartmentAnalyticsScreen = () => {
  const [timeRange, setTimeRange] = useState('This Month');

  const monthlyTrends = [
    { month: 'May', logged: 42, resolved: 38 },
    { month: 'Jun', logged: 65, resolved: 58 },
    { month: 'Jul', logged: 98, resolved: 85 },
    { month: 'Aug', logged: 110, resolved: 102 },
    { month: 'Sep', logged: 84, resolved: 80 },
    { month: 'Oct', logged: 72, resolved: 68 },
  ];

  const categoryBreakdown = [
    { name: 'Pothole', count: 142, color: '#2563EB' },
    { name: 'Waterlogging', count: 88, color: '#06B6D4' },
    { name: 'Fallen Tree', count: 34, color: '#D97706' },
    { name: 'Road Debris', count: 42, color: '#DC2626' }
  ];

  const severityBreakdown = [
    { severity: 'Critical', count: 28, fill: '#DC2626' },
    { severity: 'High', count: 64, fill: '#D97706' },
    { severity: 'Medium', count: 112, fill: '#2563EB' },
    { severity: 'Low', count: 46, fill: '#06B6D4' }
  ];

  return (
    <div>
      <PageHeader
        title="Road Quality & Repair Performance Analytics"
        description="Municipal performance analytics evaluating mean-time-to-resolution (MTTR), hazard distribution, and repair completion."
        actions={
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            options={['This Week', 'This Month', 'Last Quarter', 'Year 2026']}
            style={{ width: '160px' }}
          />
        }
      />

      {/* Analytics KPI Header */}
      <div className="grid-stats">
        <StatCard
          icon={TrendingUp}
          value="92.4%"
          label="Resolution Success Rate"
          trendValue="+4.2% vs last month"
          iconBg="var(--success-bg)"
        />
        <StatCard
          icon={Clock}
          value="34.2 Hrs"
          label="Mean Time To Repair (MTTR)"
          trendValue="-6.5 hrs improvement"
          iconBg="var(--bg-soft-blue)"
        />
        <StatCard
          icon={CheckCircle2}
          value="306"
          label="Total Hazards Cleared"
          trendValue="Year-to-date"
        />
        <StatCard
          icon={BarChart3}
          value="4.8 / 5"
          label="Citizen Satisfaction Rating"
          trendValue="940 ratings"
          iconBg="var(--warning-bg)"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid-two-col" style={{ marginBottom: '1.5rem' }}>
        <Card title="Monthly Hazard Intake vs Resolution Volume">
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="logged" stroke="#2563EB" strokeWidth={3} name="Logged Hazards" />
                <Line type="monotone" dataKey="resolved" stroke="#16A34A" strokeWidth={3} name="Resolved Repairs" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Hazard Distribution by Category">
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={4} dataKey="count">
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <Card title="Severity Distribution Audit">
        <div style={{ width: '100%', height: '240px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={severityBreakdown}>
              <XAxis dataKey="severity" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" name="Hazard Count" radius={[4, 4, 0, 0]}>
                {severityBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
