import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Select } from '../../components/common/Select';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { PRIORITIES } from '../../utils/constants';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const RepairAssignmentScreen = () => {
  const { id } = useParams();
  const { complaints, assignWorkOrder } = useApp();
  const { showSuccess } = useToast();
  const navigate = useNavigate();

  const complaint = complaints.find(c => c.id === id || c.reportId === id) || (complaints.length > 0 ? complaints[0] : null);

  const [department, setDepartment] = useState('PWD Maintenance Division 4');
  const [team, setTeam] = useState('Rapid Asphalt Repair Unit A');
  const [officer, setOfficer] = useState('Er. S. K. Gupta');
  const [priority, setPriority] = useState(complaint?.priority || 'High');
  const [targetDate, setTargetDate] = useState('2026-10-15');
  const [instructions, setInstructions] = useState(
    complaint ? `Repair ${complaint.category} defect at ${complaint.location}. Ensure traffic diversion signage installed.` : 'Conduct road repair.'
  );
  const [loading, setLoading] = useState(false);

  if (!complaint) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Complaint Not Found</h2>
        <p>No complaint selected for repair dispatch.</p>
        <Button variant="primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/department/complaints')}>
          Return to Complaint Management
        </Button>
      </div>
    );
  }

  const targetId = complaint.id || complaint.reportId;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      assignWorkOrder(targetId, {
        department,
        team,
        officer,
        priority,
        targetDate,
        instructions
      });
      setLoading(false);
      showSuccess(`Repair team ${team} successfully dispatched for complaint ${targetId}`, 'Repair Team Dispatched');
      navigate(`/department/complaints/${targetId}`);
    }, 400);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Dispatch Repair Team: ${complaint.id || complaint.reportId}`}
        description={`Assign repair crew and issue restoration instructions for ${complaint.category}`}
        actions={
          <Button variant="outline" icon={ArrowLeft} onClick={() => navigate(-1)}>
            Cancel
          </Button>
        }
      />

      <div className="grid-two-col">
        <Card title="Assign Repair Team & Target Schedule">
          <form onSubmit={handleSubmit}>
            <Select
              label="Assigned Department Division"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              options={['PWD Maintenance Division 4', 'Drainage & Stormwater Authority', 'Horticulture & Emergency Response', 'Municipal Sanitation Dept']}
            />

            <Select
              label="Assigned Repair Team / Field Unit"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              options={['Rapid Asphalt Repair Unit A', 'Stormwater Drainage Crew #2', 'Tree Clearance Unit 1', 'Pavement Patch Squad Beta']}
            />

            <Select
              label="Responsible Officer in Charge"
              value={officer}
              onChange={(e) => setOfficer(e.target.value)}
              options={['Er. S. K. Gupta', 'Er. Anita Rao', 'Ramanathan P.', 'Dr. Rajesh Verma']}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <Select
                label="Dispatch Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                options={PRIORITIES}
              />
              <Input
                label="Target Completion Date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Repair Instructions</label>
              <textarea
                className="textarea-field"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                required
              />
            </div>

            <Button type="submit" variant="primary" loading={loading} icon={ShieldAlert} style={{ width: '100%', marginTop: '1rem' }}>
              Dispatch Repair Team
            </Button>
          </form>
        </Card>

        {/* Right Summary Card */}
        <Card title="Related Hazard Details">
          <img
            src={complaint.imageUrl || complaint.evidenceImage || "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80"}
            alt={complaint.category}
            style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '1rem' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
            <div><strong>Complaint ID:</strong> {complaint.id || complaint.reportId}</div>
            <div><strong>Category:</strong> {complaint.category}</div>
            <div><strong>Location:</strong> {complaint.location}</div>
            <div><strong>Citizen Description:</strong> {complaint.description}</div>
          </div>
        </Card>
      </div>
    </div>
  );
};
