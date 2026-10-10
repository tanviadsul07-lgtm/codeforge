import React from 'react';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { RotateCcw, ShieldAlert } from 'lucide-react';

export const GeneralSettingsScreen = () => {
  const { resetDemoData } = useApp();

  const handleReset = () => {
    if (window.confirm("Reset all local demo state back to default records?")) {
      resetDemoData();
      alert("Demo state reset successfully!");
    }
  };

  return (
    <div>
      <PageHeader
        title="General System Settings"
        description="Configure application defaults and manage local demo state."
      />

      <Card style={{ maxWidth: '600px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>
          Demo Data Management
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          PathRakshak AI stores complaint updates, survey sessions, and verification edits inside browser LocalStorage for demonstration purposes. Click below to restore initial mock records.
        </p>

        <Button variant="danger" icon={RotateCcw} onClick={handleReset}>
          Reset Demo Local Storage State
        </Button>
      </Card>
    </div>
  );
};
