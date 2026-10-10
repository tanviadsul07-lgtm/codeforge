import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { Save, CheckCircle2 } from 'lucide-react';

export const DepartmentSettingsScreen = () => {
  const [deptName, setDeptName] = useState('Public Works Department (PWD) - Central Zone');
  const [slaHours, setSlaHours] = useState('48');
  const [autoEscalate, setAutoEscalate] = useState('Enabled');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div>
      <PageHeader
        title="Departmental System Configuration"
        description="Manage civic SLA thresholds, automatic escalation rules, and municipal dispatch preferences."
      />

      <Card style={{ maxWidth: '600px' }}>
        {saved && (
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>Department settings saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave}>
          <Input
            label="Department Title"
            value={deptName}
            onChange={(e) => setDeptName(e.target.value)}
            required
          />

          <Input
            label="Standard Repair SLA Resolution Window (Hours)"
            type="number"
            value={slaHours}
            onChange={(e) => setSlaHours(e.target.value)}
            required
          />

          <Select
            label="Auto-Escalate Critical Potholes to Traffic Control"
            value={autoEscalate}
            onChange={(e) => setAutoEscalate(e.target.value)}
            options={['Enabled', 'Disabled']}
          />

          <Button type="submit" variant="primary" icon={Save} style={{ width: '100%', marginTop: '1.25rem' }}>
            Save Department Configuration
          </Button>
        </form>
      </Card>
    </div>
  );
};
