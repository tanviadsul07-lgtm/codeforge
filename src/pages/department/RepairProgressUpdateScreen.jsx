import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { Save, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const RepairProgressUpdateScreen = () => {
  const { id } = useParams();
  const { complaints, workOrders, updateWorkOrderProgress, updateOperatorProgress } = useApp();
  const { showSuccess } = useToast();
  const navigate = useNavigate();

  const complaint = (complaints || []).find(c => c.id === id || c.reportId === id);
  const wo = (workOrders || []).find(w => w.id === id || w.workOrderId === id) || complaint;

  const [progress, setProgress] = useState(wo?.repairProgress?.toString() || wo?.progress?.toString() || '50');
  const [status, setStatus] = useState(wo?.status || 'In Progress');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const targetId = id || wo?.id || wo?.workOrderId || wo?.reportId;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    const numProg = parseInt(progress, 10);
    
    if (updateWorkOrderProgress) {
      updateWorkOrderProgress(targetId, numProg, status, note);
    }
    if (updateOperatorProgress) {
      updateOperatorProgress(targetId, numProg, note);
    }

    setTimeout(() => {
      setLoading(false);
      showSuccess(`Repair progress updated to ${numProg}%`, 'Progress Saved');
      if (complaint) {
        navigate(`/department/complaints/${complaint.id || complaint.reportId}`);
      } else {
        navigate('/department/complaints');
      }
    }, 400);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Update Repair Progress: ${targetId}`}
        description="Log field repair milestone and completion percentage"
        actions={
          <Button variant="outline" icon={ArrowLeft} onClick={() => navigate(-1)}>
            Cancel
          </Button>
        }
      />

      <Card style={{ maxWidth: '580px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className="input-label" style={{ marginBottom: 0 }}>Completion Progress</label>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-blue)' }}>{progress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => {
                const val = e.target.value;
                setProgress(val);
                if (parseInt(val, 10) === 100) setStatus('Awaiting Approval');
              }}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          <Select
            label="Work Order Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={['In Progress', 'Awaiting Approval', 'Completed', 'On Hold']}
          />

          <div className="input-group">
            <label className="input-label">Update Activity Log Note</label>
            <textarea
              className="textarea-field"
              placeholder="e.g. Surface asphalt laid and compacted. Curing in progress."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
            />
          </div>

          <Button type="submit" variant="primary" loading={loading} icon={Save} style={{ width: '100%', marginTop: '1rem' }}>
            Save Progress Update
          </Button>
        </form>
      </Card>
    </div>
  );
};
