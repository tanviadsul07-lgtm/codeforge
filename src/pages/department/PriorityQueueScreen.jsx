import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatDate } from '../../utils/formatters';
import { ShieldAlert, Briefcase } from 'lucide-react';

export const PriorityQueueScreen = () => {
  const { complaints } = useApp();
  const navigate = useNavigate();

  // Sort Critical & High first
  const sortedPriority = [...complaints].sort((a, b) => {
    const priorityWeight = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    return priorityWeight[b.priority] - priorityWeight[a.priority];
  });

  return (
    <div>
      <PageHeader
        title="High-Priority Hazard Escalation Queue"
        description="Priority dispatch queue listing critical and severe road hazards requiring urgent municipal intervention."
      />

      <Card>
        <Table headers={['Complaint ID', 'Category', 'Location', 'Priority', 'Status', 'Submitted Date', 'Assigned Team', 'Quick Action']}>
          {sortedPriority.map((c) => (
            <tr key={c.id}>
              <td style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{c.id}</td>
              <td style={{ fontWeight: 600 }}>{c.category}</td>
              <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.location}</td>
              <td><Badge status={c.priority} /></td>
              <td><Badge status={c.status} /></td>
              <td style={{ fontSize: '0.8rem' }}>{formatDate(c.submittedDate)}</td>
              <td style={{ fontSize: '0.8rem', fontWeight: 600 }}>{c.assignedTeam || 'Unassigned'}</td>
              <td>
                <Button variant="primary" size="sm" icon={Briefcase} onClick={() => navigate(`/department/repair-assignment/${c.id}`)}>
                  Quick Assign
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
};
