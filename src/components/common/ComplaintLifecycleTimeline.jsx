import React from 'react';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  UserCheck,
  Wrench,
  FileCheck,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export const ComplaintLifecycleTimeline = ({ complaint }) => {
  if (!complaint) return null;

  const currentStatus = complaint.status || 'Submitted';
  const progressPct = typeof complaint.repairProgress === 'number'
    ? complaint.repairProgress
    : (currentStatus === 'Resolved' || currentStatus === 'Approved' ? 100 : (currentStatus === 'Awaiting Approval' || currentStatus === 'In Review' || currentStatus === 'Completion Submitted' ? 90 : (currentStatus === 'In Progress' ? 50 : (currentStatus === 'Assigned' || currentStatus === 'Verified' ? 25 : 10))));

  const steps = [
    {
      key: 'submitted',
      title: '1. Hazard Captured & Submitted',
      description: `Reported by ${complaint.reporterName || 'Citizen'} via ${complaint.source || 'GeoAI Scanner'}`,
      icon: Clock,
      minPct: 0
    },
    {
      key: 'verified',
      title: '2. Department Verification',
      description: complaint.verifiedBy ? `Verified by ${complaint.verifiedBy}` : 'Validated hazard priority & severity',
      icon: ShieldCheck,
      minPct: 20
    },
    {
      key: 'assigned',
      title: '3. Field Operator Dispatched',
      description: complaint.assignedTeam || complaint.assignedTo ? `Assigned to ${complaint.assignedTeam || complaint.assignedTo}` : 'Repair crew assigned',
      icon: UserCheck,
      minPct: 35
    },
    {
      key: 'in_progress',
      title: '4. On-Site Repair In Progress',
      description: `Surface restoration & patching (${progressPct}% completed)`,
      icon: Wrench,
      minPct: 50
    },
    {
      key: 'completion',
      title: '5. Repair Evidence Submitted',
      description: complaint.completionEvidence ? 'After-repair evidence photo uploaded' : 'Field operator inspection report',
      icon: FileCheck,
      minPct: 80
    },
    {
      key: 'approved',
      title: '6. Department Quality Approval',
      description: 'Senior engineer sign-off & audit',
      icon: Sparkles,
      minPct: 90
    },
    {
      key: 'resolved',
      title: '7. Closed & Resolved (Green)',
      description: 'Hazard marker verified green on GIS Map',
      icon: CheckCircle2,
      minPct: 100
    }
  ];

  return (
    <div style={{ padding: '0.5rem 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
        {/* Connecting Vertical Track Line */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            bottom: '16px',
            left: '17px',
            width: '2px',
            backgroundColor: 'var(--border-color)',
            zIndex: 1
          }}
        />

        {/* Dynamic Animated Active Track Fill */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '17px',
            width: '2px',
            height: `${Math.min(100, (progressPct / 100) * 100)}%`,
            backgroundColor: progressPct === 100 ? 'var(--status-resolved)' : 'var(--primary-blue)',
            boxShadow: progressPct === 100 ? '0 0 10px var(--status-resolved)' : '0 0 10px var(--primary-blue)',
            transition: 'height 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 2
          }}
        />

        {steps.map((step, idx) => {
          const isCompleted = progressPct >= step.minPct;
          const isCurrent = (progressPct >= step.minPct && (idx === steps.length - 1 || progressPct < steps[idx + 1].minPct));
          const IconComp = step.icon;

          return (
            <div
              key={step.key}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                position: 'relative',
                zIndex: 3
              }}
            >
              {/* Step Circle Icon */}
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isCompleted
                    ? (isCurrent && currentStatus !== 'Resolved' ? '#0F2438' : (step.minPct === 100 ? 'rgba(56, 217, 150, 0.2)' : 'rgba(18, 189, 242, 0.15)'))
                    : '#071522',
                  border: isCurrent
                    ? (currentStatus === 'Resolved' ? '2px solid var(--status-resolved)' : '2px solid var(--primary-blue)')
                    : (isCompleted ? (step.minPct === 100 ? '2px solid var(--status-resolved)' : '2px solid var(--primary-blue)') : '2px solid var(--border-color)'),
                  color: isCompleted
                    ? (step.minPct === 100 ? 'var(--status-resolved)' : 'var(--primary-blue)')
                    : 'var(--text-muted)',
                  boxShadow: isCurrent
                    ? (currentStatus === 'Resolved' ? '0 0 14px rgba(56, 217, 150, 0.5)' : '0 0 14px rgba(18, 189, 242, 0.5)')
                    : 'none',
                  transition: 'all 0.3s ease',
                  flexShrink: 0
                }}
              >
                <IconComp size={18} />
              </div>

              {/* Step Detail Content */}
              <div
                style={{
                  flex: 1,
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isCurrent ? 'rgba(18, 54, 81, 0.4)' : 'transparent',
                  border: isCurrent ? '1px solid rgba(18, 189, 242, 0.3)' : '1px solid transparent',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '2px' }}>
                  <span
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: isCurrent ? 800 : (isCompleted ? 700 : 500),
                      color: isCurrent
                        ? 'var(--text-main)'
                        : (isCompleted ? 'var(--text-primary)' : 'var(--text-muted)')
                    }}
                  >
                    {step.title}
                  </span>
                  {isCurrent && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: currentStatus === 'Resolved' ? 'rgba(56, 217, 150, 0.2)' : 'rgba(18, 189, 242, 0.2)',
                        color: currentStatus === 'Resolved' ? 'var(--status-resolved)' : 'var(--primary-blue)',
                        border: currentStatus === 'Resolved' ? '1px solid var(--status-resolved)' : '1px solid var(--primary-blue)'
                      }}
                    >
                      Active Stage
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: isCompleted ? 'var(--text-secondary)' : 'var(--text-muted)', lineHeight: 1.4 }}>
                  {step.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
