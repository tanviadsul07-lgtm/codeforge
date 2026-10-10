import React from 'react';
import { Modal } from './Modal';
import { Badge } from './Badge';
import { Button } from './Button';
import { ComplaintLifecycleTimeline } from './ComplaintLifecycleTimeline';
import { VideoEvidencePlayer } from './VideoEvidencePlayer';
import { formatDate, formatCoordinates } from '../../utils/formatters';
import {
  MapPin,
  Calendar,
  IndianRupee,
  Ruler,
  Clock,
  ShieldAlert,
  User,
  Layers,
  FileText,
  ExternalLink,
  CheckCircle2,
  Building
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProgressDetailsModal = ({ isOpen, onClose, complaint }) => {
  const navigate = useNavigate();
  if (!complaint) return null;

  const currentStatus = complaint.status || 'Submitted';
  const progressPct = typeof complaint.repairProgress === 'number'
    ? complaint.repairProgress
    : (currentStatus === 'Resolved' || currentStatus === 'Approved' ? 100 : (currentStatus === 'Awaiting Approval' || currentStatus === 'In Review' || currentStatus === 'Completion Submitted' ? 90 : (currentStatus === 'In Progress' ? 50 : (currentStatus === 'Assigned' || currentStatus === 'Verified' ? 25 : 10))));

  const dimensions = complaint.dimensions || '60cm × 45cm × 12cm';
  const volumeM3 = complaint.volumeM3 || 0.032;
  const estimatedCost = complaint.estimatedCost || 3800;

  const evidenceImage = complaint.imageUrl || complaint.afterImageUrl || complaint.evidenceUrl || "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldAlert size={22} style={{ color: 'var(--primary-blue)' }} />
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Repair Progress Telemetry
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Complaint Ref: <span style={{ color: 'var(--primary-blue)', fontWeight: 700 }}>{complaint.id || complaint.reportId}</span>
            </div>
          </div>
        </div>
      }
      maxWidth="750px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.25rem 0' }}>
        
        {/* Header Overview Card */}
        <div
          style={{
            padding: '1.25rem',
            backgroundColor: '#071522',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              {complaint.category || 'Road Pothole Hazard'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              <MapPin size={14} style={{ color: 'var(--primary-blue)' }} />
              <span>{complaint.location || 'Municipal Carriageway Zone'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'right', marginBottom: '2px' }}>
                Priority
              </div>
              <Badge status={complaint.priority || 'High'} />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'right', marginBottom: '2px' }}>
                Status
              </div>
              <Badge status={complaint.status || 'Submitted'} />
            </div>
          </div>
        </div>

        {/* Animated Progress Fill Bar Section */}
        <div
          style={{
            padding: '1.25rem',
            backgroundColor: '#0F2438',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={16} style={{ color: 'var(--primary-blue)' }} />
              Overall Resolution Progress
            </span>
            <span
              style={{
                fontSize: '1.1rem',
                fontWeight: 900,
                color: progressPct === 100 ? 'var(--status-resolved)' : 'var(--primary-blue)'
              }}
            >
              {progressPct}%
            </span>
          </div>

          {/* Track Bar */}
          <div
            style={{
              width: '100%',
              height: '12px',
              backgroundColor: '#071522',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
              border: '1px solid var(--border-subtle)',
              position: 'relative'
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPct}%`,
                backgroundImage: progressPct === 100
                  ? 'linear-gradient(90deg, #10B981, #38D996)'
                  : 'linear-gradient(90deg, #2563EB, #12BDF2, #45E4F4)',
                borderRadius: 'var(--radius-full)',
                boxShadow: progressPct === 100 ? '0 0 12px rgba(56, 217, 150, 0.6)' : '0 0 12px rgba(18, 189, 242, 0.6)',
                transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            <span>0% (Submitted)</span>
            <span>25% (Verified)</span>
            <span>50% (In Progress)</span>
            <span>90% (In Review)</span>
            <span>100% (Resolved)</span>
          </div>
        </div>

        {/* AI Hazard Metrics Grid (Pothole dimensions, cost, volume) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#071522', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
              <Ruler size={15} style={{ color: 'var(--primary-blue)' }} />
              Estimated Dimensions
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {dimensions}
            </div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: '#071522', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
              <IndianRupee size={15} style={{ color: 'var(--status-resolved)' }} />
              Estimated Repair Cost
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--status-resolved)' }}>
              ₹{estimatedCost.toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: '#071522', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
              <Building size={15} style={{ color: 'var(--cyan-accent)' }} />
              Assigned Repair Team
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {complaint.assignedTeam || complaint.assignedTo || 'PWD Rapid Response Alpha'}
            </div>
          </div>
        </div>

        {/* Evidence Image & GPS Telemetry */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Captured Media Evidence
            </div>
            {(() => {
              const videoUrl = complaint.evidenceVideo || complaint.videoUrl || (typeof complaint.evidenceUrl === 'string' && (complaint.evidenceUrl.endsWith('.mp4') || complaint.evidenceUrl.endsWith('.webm') || complaint.evidenceUrl.includes('/video/')) ? complaint.evidenceUrl : null);
              const isVideo = Boolean(videoUrl) || complaint.mediaResourceType === 'video';
              const activeVidUrl = videoUrl || (isVideo ? 'http://localhost:5000/api/evidence/uploads/sample_pothole_video.mp4' : null);

              if (isVideo && activeVidUrl) {
                return (
                  <VideoEvidencePlayer
                    videoUrl={activeVidUrl}
                    posterUrl={evidenceImage}
                    detections={complaint.videoDetections || complaint.detections || [
                      { timestamp: 1.2, bbox: [0.22, 0.42, 0.58, 0.72], category: complaint.category || 'Pothole (Severe)', confidence: 0.92, severity: 'Critical' },
                      { timestamp: 3.5, bbox: [0.28, 0.35, 0.62, 0.68], category: complaint.category || 'Pothole', confidence: 0.86, severity: 'High' }
                    ]}
                    title="Video Evidence"
                  />
                );
              }

              return (
                <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)', height: '160px' }}>
                  <img
                    src={evidenceImage}
                    alt="Hazard Evidence"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              );
            })()}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Telemetry & Geo Location
            </div>
            <div style={{ padding: '0.85rem', backgroundColor: '#071522', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <strong>Coordinates:</strong> {formatCoordinates(complaint.latitude, complaint.longitude)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <strong>Created Date:</strong> {formatDate(complaint.createdAt || complaint.date)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <strong>Target Completion:</strong> {complaint.targetDate || '2026-10-20'}
              </div>
            </div>
          </div>
        </div>

        {/* Lifecycle Steps Timeline */}
        <div style={{ paddingTop: '0.5rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Lifecycle Milestones & Audit Trail
          </div>
          <ComplaintLifecycleTimeline complaint={complaint} />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            icon={ExternalLink}
            onClick={() => {
              onClose();
              navigate(`/department/complaints/${complaint.id || complaint.reportId}`);
            }}
          >
            Open Complete Record
          </Button>
        </div>

      </div>
    </Modal>
  );
};
