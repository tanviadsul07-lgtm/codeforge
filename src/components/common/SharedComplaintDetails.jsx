import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../layout/PageHeader';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import { Modal } from './Modal';
import { Input } from './Input';
import { Select } from './Select';
import { HazardMap } from '../maps/HazardMap';
import { VideoEvidencePlayer } from './VideoEvidencePlayer';
import { formatDate, formatCoordinates } from '../../utils/formatters';
import { ROLES, COMPLAINT_STATUSES, HAZARD_CATEGORIES, PRIORITIES } from '../../utils/constants';
import { cloudinaryService } from '../../services/cloudinaryService';
import { apiClient } from '../../services/apiClient';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  AlertTriangle,
  Upload,
  Send,
  XCircle,
  FileCheck,
  HardHat,
  Sparkles,
  Layers,
  FileText,
  Camera,
  RotateCcw,
  RefreshCw,
  Lock
} from 'lucide-react';

export const SharedComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const {
    complaints,
    verifyReport,
    assignFieldOperator,
    startOperatorWork,
    updateOperatorProgress,
    submitCompletion,
    approveResolution,
    rejectCompletion
  } = useApp();

  // Asynchronous Data Loading & Authorization States
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);

  // Role Checks
  const isCitizen = role === ROLES.CITIZEN;
  const isDepartment = role === ROLES.DEPARTMENT_OFFICER;
  const isOperator = role === ROLES.FIELD_OPERATOR;
  const isAdmin = role === ROLES.ADMIN;

  // Modal States
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [reworkModalOpen, setReworkModalOpen] = useState(false);

  // Form Field States
  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Assignment States
  const [selectedOperator, setSelectedOperator] = useState('Vikram Malhotra (operator@pathrakshak.ai)');
  const [departmentName, setDepartmentName] = useState('PWD Road Maintenance Division');
  const [teamName, setTeamName] = useState('Rapid Asphalt Patch Unit A');
  const [targetDate, setTargetDate] = useState('2026-10-20');
  const [workInstructions, setWorkInstructions] = useState('Conduct road defect restoration & lane safety check.');

  // Progress Update States
  const [progressPct, setProgressPct] = useState(50);
  const [progressNote, setProgressNote] = useState('');
  const [progressFile, setProgressFile] = useState(null);

  // Completion States
  const [completionNote, setCompletionNote] = useState('');
  const [completionFile, setCompletionFile] = useState(null);
  const [completionPreview, setCompletionPreview] = useState(null);

  // Resolution Approval States
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [reworkReason, setReworkReason] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Robust Data Fetching & Authorization Logic
  const fetchComplaintData = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setAccessDenied(false);

    // 1. Check local AppContext state first
    const contextMatch = (complaints || []).find(c => c && (c.id === id || c.reportId === id));

    if (contextMatch) {
      // Citizen Access Isolation Check
      if (isCitizen && user?.uid && contextMatch.reporterUid && contextMatch.reporterUid !== 'anon-uid' && contextMatch.reporterUid !== 'anon-user' && contextMatch.reporterUid !== user?.uid) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      setComplaint(contextMatch);
      setLoading(false);
      return;
    }

    // 2. Fetch directly from Backend REST API (/api/complaints/:id)
    try {
      const res = await apiClient.request(`/complaints/${id}`);
      if (res && res.success && res.complaint) {
        const fetched = res.complaint;

        // Citizen Access Isolation Check
        if (isCitizen && user?.uid && fetched.reporterUid && fetched.reporterUid !== 'anon-uid' && fetched.reporterUid !== 'anon-user' && fetched.reporterUid !== user?.uid) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }

        setComplaint(fetched);
      } else {
        setComplaint(null);
      }
    } catch (err) {
      console.warn('[Complaint Details Fetch Error]', err.message);
      if (err.message && err.message.includes('404')) {
        setComplaint(null);
      } else {
        setError(err.message || 'Failed to connect to backend server.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintData();
  }, [id, complaints, user, role]);

  // Loading UI State
  if (loading) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #1E3A5F', borderTopColor: '#38BDF8', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
        <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Loading Complaint Details...</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Fetching authoritative record for ID: {id}</p>
      </div>
    );
  }

  // Access Denied State (Citizen Security Guard)
  if (accessDenied) {
    return (
      <div style={{ padding: '3rem 1.5rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
        <Card style={{ border: '1px solid #EF4444', backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
          <div style={{ color: '#EF4444', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <Lock size={48} />
          </div>
          <h2 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            You are not authorized to access complaint <strong>{id}</strong>. Citizens may only inspect complaints registered under their own authenticated account.
          </p>
          <Button variant="primary" onClick={() => navigate('/citizen/complaints')}>
            Return to My Complaints
          </Button>
        </Card>
      </div>
    );
  }

  // Network / Backend Server Error State
  if (error) {
    return (
      <div style={{ padding: '3rem 1.5rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
        <Card style={{ border: '1px solid #F5B942' }}>
          <div style={{ color: '#F5B942', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <AlertTriangle size={48} />
          </div>
          <h2 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Backend Connection Notice</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            {error}
          </p>
          <Button variant="primary" icon={RefreshCw} onClick={fetchComplaintData}>
            Retry Loading Complaint
          </Button>
        </Card>
      </div>
    );
  }

  // Complaint Not Found State
  if (!complaint) {
    return (
      <div style={{ padding: '3rem 1.5rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
        <Card>
          <div style={{ color: '#94A3B8', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <FileText size={48} />
          </div>
          <h2 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Complaint Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            The requested complaint record <strong>{id}</strong> could not be located in the database.
          </p>
          <Button variant="primary" onClick={() => navigate(-1)}>
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  // Safe Parameter Normalization
  const complaintId = complaint.id || complaint.reportId || id;
  const currentProgress = typeof complaint.progress === 'number' ? complaint.progress :
    (complaint.status === 'Resolved' ? 100 :
     complaint.status === 'Awaiting Approval' ? 90 :
     complaint.status === 'In Progress' ? 50 :
     complaint.status === 'Assigned' || complaint.status === 'Verified' ? 10 : 0);

  const timelineList = Array.isArray(complaint.timeline) ? complaint.timeline : [];

  // Workflow Stages Configuration
  const stages = [
    { title: "Submitted", status: "Submitted", minProgress: 0 },
    { title: "Verified", status: "Verified", minProgress: 10 },
    { title: "Assigned", status: "Assigned", minProgress: 10 },
    { title: "In Progress", status: "In Progress", minProgress: 25 },
    { title: "Review Pending", status: "Awaiting Approval", minProgress: 90 },
    { title: "Resolved", status: "Resolved", minProgress: 100 }
  ];

  // Action Handlers
  const handleVerify = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      const res = await verifyReport(complaintId, {
        verificationStatus: 'Verified',
        inspectionNotes: verificationNotes || 'Complaint verified by department officer.'
      });
      setComplaint(prev => ({ ...prev, status: 'Verified', progress: 10, verificationStatus: 'Verified' }));
      setVerifyModalOpen(false);
    } catch (err) {
      setActionError(err.message || 'Failed to verify complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setActionError('Please specify a rejection reason.');
      return;
    }
    setActionLoading(true);
    setActionError('');
    try {
      await verifyReport(complaintId, {
        verificationStatus: 'Rejected',
        rejectionReason
      });
      setComplaint(prev => ({ ...prev, status: 'Rejected', progress: 0, verificationStatus: 'Rejected' }));
      setRejectModalOpen(false);
    } catch (err) {
      setActionError(err.message || 'Failed to reject complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignOperator = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      const parts = selectedOperator.split('(');
      const opName = parts[0].trim();
      const opEmail = parts[1] ? parts[1].replace(')', '').trim() : 'operator@pathrakshak.ai';

      await assignFieldOperator(complaintId, {
        operatorName: opName,
        operatorUid: opEmail,
        department: departmentName,
        team: teamName,
        targetDate,
        instructions: workInstructions
      });
      setComplaint(prev => ({ ...prev, status: 'Assigned', progress: 10, assignedOperatorName: opName, assignedTeam: teamName }));
      setAssignModalOpen(false);
    } catch (err) {
      setActionError(err.message || 'Failed to assign operator.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartWork = async () => {
    setActionLoading(true);
    try {
      await startOperatorWork(complaintId);
      setComplaint(prev => ({ ...prev, status: 'In Progress', progress: 25 }));
    } catch (err) {
      console.warn('[Start Work Error]', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProgressSubmit = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      let mediaUrl = null;
      if (progressFile) {
        const uploaded = await cloudinaryService.uploadMedia(progressFile, 'repair_progress');
        mediaUrl = uploaded.secureUrl;
      }
      const newPct = parseInt(progressPct, 10) || 50;
      await updateOperatorProgress(complaintId, newPct, progressNote, mediaUrl);
      setComplaint(prev => ({ ...prev, status: 'In Progress', progress: newPct }));
      setProgressModalOpen(false);
      setProgressFile(null);
    } catch (err) {
      setActionError(err.message || 'Failed to update progress.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompletionSubmit = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      let mediaUrl = null;
      if (completionFile) {
        const uploaded = await cloudinaryService.uploadMedia(completionFile, 'repair_completion');
        mediaUrl = uploaded.secureUrl;
      }
      await submitCompletion(complaintId, {
        notes: completionNote,
        evidenceImage: mediaUrl || completionPreview
      });
      setComplaint(prev => ({ ...prev, status: 'Awaiting Approval', progress: 90, repairEvidenceImage: mediaUrl || completionPreview }));
      setCompletionModalOpen(false);
    } catch (err) {
      setActionError(err.message || 'Failed to submit repair completion.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveResolutionSubmit = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      await approveResolution(complaintId, { remarks: approvalRemarks || 'Approved by department officer.' });
      setComplaint(prev => ({ ...prev, status: 'Resolved', progress: 100 }));
      setApproveModalOpen(false);
    } catch (err) {
      setActionError(err.message || 'Failed to approve resolution.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReworkSubmit = async () => {
    if (!reworkReason.trim()) {
      setActionError('Please specify reason for re-work request.');
      return;
    }
    setActionLoading(true);
    setActionError('');
    try {
      await rejectCompletion(complaintId, { reason: reworkReason });
      setComplaint(prev => ({ ...prev, status: 'In Progress', progress: 50 }));
      setReworkModalOpen(false);
    } catch (err) {
      setActionError(err.message || 'Failed to submit re-work request.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={`Complaint Details: ${complaintId}`}
        description={`Authoritative geotagged record for ${complaint.category || 'Road Hazard'} at ${complaint.location || 'Municipal Carriageway'}`}
        actions={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="outline" icon={ArrowLeft} onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>
        }
      />

      {/* Modern Blue Header Banner & Unified Progress Bar */}
      <Card style={{
        marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, #07172B 0%, #0F2942 100%)',
        border: '1px solid #1A3F66',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#38BDF8' }}>
                {complaintId}
              </span>
              <Badge status={complaint.status || 'Submitted'} />
              <Badge status={complaint.severity || complaint.priority || 'Medium'} />
            </div>
            <div style={{ fontSize: '0.9rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={16} style={{ color: '#38BDF8' }} />
              <span>{complaint.location || 'Location Specified'}</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.5px' }}>CURRENT WORK PROGRESS</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#38D996', lineHeight: 1.2 }}>
              {currentProgress}%
            </div>
          </div>
        </div>

        {/* Dynamic Styled Progress Bar */}
        <div style={{ width: '100%', height: '10px', backgroundColor: '#0F172A', borderRadius: '5px', overflow: 'hidden', marginBottom: '1.5rem', border: '1px solid #1E293B' }}>
          <div style={{
            width: `${currentProgress}%`,
            height: '100%',
            background: currentProgress >= 100
              ? 'linear-gradient(90deg, #10B981 0%, #34D399 100%)'
              : 'linear-gradient(90deg, #0284C7 0%, #38BDF8 100%)',
            transition: 'width 0.5s ease-in-out'
          }} />
        </div>

        {/* Milestone Steps */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: '0.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '1rem'
        }}>
          {stages.map((st, idx) => {
            const isCompleted = currentProgress >= st.minProgress && complaint.status !== 'Rejected';
            const isActive = (
              (st.status === 'Submitted' && complaint.status === 'Submitted') ||
              (st.status === 'Verified' && complaint.status === 'Verified') ||
              (st.status === 'Assigned' && complaint.status === 'Assigned') ||
              (st.status === 'In Progress' && complaint.status === 'In Progress') ||
              (st.status === 'Awaiting Approval' && complaint.status === 'Awaiting Approval') ||
              (st.status === 'Resolved' && complaint.status === 'Resolved')
            );

            return (
              <div key={idx} style={{ textAlign: 'center' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  backgroundColor: isCompleted ? '#10B981' : isActive ? '#38BDF8' : '#1E293B',
                  color: '#FFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 0.4rem',
                  fontSize: '0.75rem', fontWeight: 800,
                  boxShadow: isActive ? '0 0 12px rgba(56, 189, 248, 0.6)' : 'none'
                }}>
                  {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: isActive ? 700 : 500, color: isActive ? '#F8FAFC' : '#64748B' }}>
                  {st.title}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Role-Specific Actions Bar */}
      {(isDepartment || isOperator || isAdmin) && (
        <Card title="Authorized Lifecycle Actions" style={{ marginBottom: '1.5rem', border: '1px solid var(--electric-blue)' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Department / Admin Actions */}
            {(isDepartment || isAdmin) && complaint.status === 'Submitted' && (
              <>
                <Button variant="primary" icon={CheckCircle2} onClick={() => setVerifyModalOpen(true)}>
                  Verify & Approve Complaint
                </Button>
                <Button variant="danger" icon={XCircle} onClick={() => setRejectModalOpen(true)}>
                  Reject Complaint
                </Button>
              </>
            )}

            {(isDepartment || isAdmin) && (complaint.status === 'Verified' || complaint.status === 'Assigned') && (
              <Button variant="primary" icon={HardHat} onClick={() => setAssignModalOpen(true)}>
                {complaint.assignedOperatorName && complaint.assignedOperatorName !== 'Unassigned' ? 'Re-assign Field Operator' : 'Assign Field Operator'}
              </Button>
            )}

            {(isDepartment || isAdmin) && complaint.status === 'Awaiting Approval' && (
              <>
                <Button variant="success" icon={CheckCircle2} onClick={() => setApproveModalOpen(true)}>
                  Approve Final Resolution (100%)
                </Button>
                <Button variant="warning" icon={RotateCcw} onClick={() => setReworkModalOpen(true)}>
                  Reject & Request Re-Work
                </Button>
              </>
            )}

            {/* Field Operator Actions */}
            {(isOperator || isAdmin) && complaint.status === 'Assigned' && (
              <Button variant="primary" icon={Send} onClick={handleStartWork} loading={actionLoading}>
                Accept & Start Repair Work (25%)
              </Button>
            )}

            {(isOperator || isAdmin) && complaint.status === 'In Progress' && (
              <>
                <Button variant="secondary" icon={Clock} onClick={() => setProgressModalOpen(true)}>
                  Update Progress %
                </Button>
                <Button variant="success" icon={FileCheck} onClick={() => setCompletionModalOpen(true)}>
                  Submit Completion Evidence (90%)
                </Button>
              </>
            )}

            {complaint.status === 'Resolved' && (
              <div style={{ color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <CheckCircle2 size={20} />
                <span>Complaint is fully resolved and verified. No further actions required.</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Main Grid: Details & Evidence */}
      <div className="grid-two-col" style={{ marginBottom: '1.5rem' }}>
        {/* Left: General Telemetry */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card title="Complaint Telemetry Information">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>HAZARD CATEGORY</span>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>{complaint.category || 'Road Hazard'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>DISPATCH PRIORITY</span>
                <div><Badge status={complaint.priority || complaint.severity || 'Medium'} /></div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>POTHOLE DIMENSIONS</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38BDF8' }}>{complaint.dimensions || '55cm × 40cm × 10cm'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>ESTIMATED REPAIR COST</span>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#F5B942' }}>{complaint.estimatedCost || '₹3,500'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>SUBMITTED BY</span>
                <div style={{ fontWeight: 600 }}>{complaint.submittedBy || 'Citizen Contributor'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{complaint.citizenEmail || 'N/A'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>SUBMISSION DATE</span>
                <div>{formatDate(complaint.createdAt || complaint.submittedDate)}</div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>CITIZEN DESCRIPTION</span>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '4px', lineHeight: 1.5 }}>
                {complaint.description || 'No description supplied.'}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
              <div><strong>Assigned Department:</strong> {complaint.assignedDepartment || 'PWD Maintenance Division'}</div>
              <div><strong>Assigned Field Operator:</strong> {complaint.assignedOperatorName || 'Pending Assignment'}</div>
              {complaint.assignedTeam && <div><strong>Repair Unit:</strong> {complaint.assignedTeam}</div>}
              {complaint.workInstructions && (
                <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-sidebar)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
                  <strong>Department Work Instructions:</strong> {complaint.workInstructions}
                </div>
              )}
            </div>
          </Card>

          {/* Media Evidence Cards */}
          <Card title="Submitted Citizen Media Evidence">
            {(() => {
              const videoUrl = complaint.evidenceVideo || complaint.videoUrl ||
                (typeof complaint.evidenceUrl === 'string' && (complaint.evidenceUrl.endsWith('.mp4') || complaint.evidenceUrl.endsWith('.webm') || complaint.evidenceUrl.includes('/video/')) ? complaint.evidenceUrl : null) ||
                (typeof complaint.evidenceImage === 'string' && (complaint.evidenceImage.endsWith('.mp4') || complaint.evidenceImage.endsWith('.webm') || complaint.evidenceImage.includes('/video/')) ? complaint.evidenceImage : null);

              const isVideo = Boolean(videoUrl) || complaint.mediaResourceType === 'video';

              const imageStillUrl = (typeof complaint.evidenceImage === 'string' && !complaint.evidenceImage.endsWith('.mp4') && !complaint.evidenceImage.endsWith('.webm') && !complaint.evidenceImage.includes('/video/'))
                ? complaint.evidenceImage
                : (complaint.imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80');

              const detections = complaint.videoDetections || complaint.detections || [
                { timestamp: 1.2, bbox: [0.22, 0.42, 0.58, 0.72], category: complaint.category || 'Pothole (Severe)', confidence: 0.92, severity: 'Critical' },
                { timestamp: 3.5, bbox: [0.28, 0.35, 0.62, 0.68], category: complaint.category || 'Pothole', confidence: 0.86, severity: 'High' },
                { timestamp: 6.0, bbox: [0.18, 0.45, 0.52, 0.75], category: 'Rutting Defect', confidence: 0.82, severity: 'Medium' }
              ];

              const activeVideoUrl = videoUrl || (isVideo ? 'http://localhost:5000/api/evidence/uploads/sample_pothole_video.mp4' : null);

              if (isVideo && activeVideoUrl) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <VideoEvidencePlayer
                      videoUrl={activeVideoUrl}
                      posterUrl={imageStillUrl}
                      detections={detections}
                      title={`Recorded Video Footage & AI Pothole Overlays (${complaint.category || 'Road Hazard'})`}
                    />
                    {imageStillUrl && !imageStillUrl.includes('unsplash') && (
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                          Captured High-Res Evidence Frame
                        </div>
                        <img
                          src={imageStillUrl}
                          alt="Captured Frame Still"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80';
                          }}
                          style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                        />
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <img
                  src={imageStillUrl}
                  alt="Citizen Evidence"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80';
                  }}
                  style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                />
              );
            })()}
          </Card>

          {/* Field Operator Repair Evidence Card */}
          {complaint.repairEvidenceImage && (
            <Card title="Field Operator Repair Completion Evidence">
              <img
                src={complaint.repairEvidenceImage}
                alt="Repair Evidence"
                style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '2px solid var(--success)' }}
              />
              {complaint.completionNotes && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.75rem' }}>
                  <strong>Operator Completion Notes:</strong> {complaint.completionNotes}
                </p>
              )}
            </Card>
          )}
        </div>

        {/* Right: Map & Action History Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card title="Geolocated Hazard Map Position">
            <HazardMap hazards={[complaint]} selectedHazardId={complaintId} height="260px" />
            <div style={{ fontSize: '0.85rem', marginTop: '0.75rem', color: 'var(--text-secondary)' }}>
              <strong>Location:</strong> {complaint.location || 'Geolocated Segment'} ({formatCoordinates(complaint.latitude, complaint.longitude)})
            </div>
          </Card>

          {/* Official Audit History Timeline */}
          <Card title="Official Action Audit Trail Timeline">
            <div className="timeline-container">
              {timelineList.map((item, idx) => (
                <div key={idx} className={`timeline-item ${idx === (timelineList.length - 1) ? 'active' : ''}`}>
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{item.status || 'Updated'}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{formatDate(item.timestamp)}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                      {item.note}
                    </p>
                    {item.actorName && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--cyan-accent)', fontWeight: 600, marginTop: '4px' }}>
                        By: {item.actorName} ({item.actorRole || 'System'})
                      </div>
                    )}
                    {item.evidenceImage && (
                      <img src={item.evidenceImage} alt="Progress Attached" style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginTop: '6px' }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* --- Action Modals --- */}

      {/* 1. Verify Modal */}
      <Modal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        title={`Verify Complaint ${complaintId}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setVerifyModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleVerify} loading={actionLoading}>Confirm Verification</Button>
          </>
        }
      >
        {actionError && <div className="error-box" style={{ marginBottom: '1rem' }}>{actionError}</div>}
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Confirm field inspection and accuracy of citizen report {complaintId}.
        </p>
        <div className="input-group">
          <label className="input-label">Verification Remarks / Notes</label>
          <textarea
            className="textarea-field"
            placeholder="Field verification confirmed. Severity levels verified."
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
          />
        </div>
      </Modal>

      {/* 2. Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title={`Reject Complaint ${complaintId}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleReject} loading={actionLoading}>Confirm Rejection</Button>
          </>
        }
      >
        {actionError && <div className="error-box" style={{ marginBottom: '1rem' }}>{actionError}</div>}
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Specify the reason for rejecting complaint {complaintId}:
        </p>
        <textarea
          className="textarea-field"
          placeholder="Duplicate report / Private property / Unable to locate..."
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          required
        />
      </Modal>

      {/* 3. Assign Operator Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Assign Field Operator for ${complaintId}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAssignOperator} loading={actionLoading}>Dispatch Assignment</Button>
          </>
        }
      >
        {actionError && <div className="error-box" style={{ marginBottom: '1rem' }}>{actionError}</div>}
        <Select
          label="Select Authorized Field Operator"
          value={selectedOperator}
          onChange={(e) => setSelectedOperator(e.target.value)}
          options={[
            'Vikram Malhotra (operator@pathrakshak.ai)',
            'Er. S. K. Gupta (sk.gupta@pwd.gov.in)',
            'Ramanathan P. (ram.p@pwd.gov.in)',
            'Field Inspector Team Alpha'
          ]}
        />
        <Input
          label="Assigned Department Division"
          value={departmentName}
          onChange={(e) => setDepartmentName(e.target.value)}
        />
        <Input
          label="Assigned Repair Unit / Crew"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
        />
        <Input
          label="Target Completion Date"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
        <div className="input-group">
          <label className="input-label">Work Order Instructions</label>
          <textarea
            className="textarea-field"
            value={workInstructions}
            onChange={(e) => setWorkInstructions(e.target.value)}
          />
        </div>
      </Modal>

      {/* 4. Update Progress Modal */}
      <Modal
        isOpen={progressModalOpen}
        onClose={() => setProgressModalOpen(false)}
        title={`Update Progress % for ${complaintId}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setProgressModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleUpdateProgressSubmit} loading={actionLoading}>Save Progress Update</Button>
          </>
        }
      >
        {actionError && <div className="error-box" style={{ marginBottom: '1rem' }}>{actionError}</div>}
        <div className="input-group">
          <label className="input-label">Progress Percentage: {progressPct}%</label>
          <input
            type="range"
            min="25"
            max="89"
            value={progressPct}
            onChange={(e) => setProgressPct(e.target.value)}
            style={{ width: '100%', accentColor: 'var(--electric-blue)' }}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Field Action Remarks</label>
          <textarea
            className="textarea-field"
            placeholder="Excavation underway, asphalt laying scheduled..."
            value={progressNote}
            onChange={(e) => setProgressNote(e.target.value)}
          />
        </div>
        <Input
          label="Upload Progress Photo (Optional)"
          type="file"
          accept="image/*"
          onChange={(e) => setProgressFile(e.target.files[0])}
        />
      </Modal>

      {/* 5. Submit Completion Modal */}
      <Modal
        isOpen={completionModalOpen}
        onClose={() => setCompletionModalOpen(false)}
        title={`Submit Repair Completion for ${complaintId}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setCompletionModalOpen(false)}>Cancel</Button>
            <Button variant="success" onClick={handleCompletionSubmit} loading={actionLoading}>Submit for Department Review</Button>
          </>
        }
      >
        {actionError && <div className="error-box" style={{ marginBottom: '1rem' }}>{actionError}</div>}
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Upload before-and-after repair photographs and final field notes. This will set progress to 90% and submit the work for department resolution approval.
        </p>
        <div className="input-group">
          <label className="input-label">Repair Completion Notes</label>
          <textarea
            className="textarea-field"
            placeholder="Asphalt compaction completed, lane cleared for traffic..."
            value={completionNote}
            onChange={(e) => setCompletionNote(e.target.value)}
            required
          />
        </div>
        <Input
          label="Upload Repair Evidence Photo (Required)"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              setCompletionFile(file);
              setCompletionPreview(URL.createObjectURL(file));
            }
          }}
          required
        />
        {completionPreview && (
          <img src={completionPreview} alt="Preview" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }} />
        )}
      </Modal>

      {/* 6. Approve Resolution Modal */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title={`Approve Final Resolution (100%) for ${complaintId}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setApproveModalOpen(false)}>Cancel</Button>
            <Button variant="success" onClick={handleApproveResolutionSubmit} loading={actionLoading}>Approve & Mark Resolved</Button>
          </>
        }
      >
        {actionError && <div className="error-box" style={{ marginBottom: '1rem' }}>{actionError}</div>}
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Confirm that repair evidence and quality inspection meet municipal standards. This will set status to <strong>RESOLVED (100%)</strong> and notify the citizen.
        </p>
        <div className="input-group">
          <label className="input-label">Resolution Approval Remarks</label>
          <textarea
            className="textarea-field"
            placeholder="Site inspection confirmed. Quality standards met."
            value={approvalRemarks}
            onChange={(e) => setApprovalRemarks(e.target.value)}
          />
        </div>
      </Modal>

      {/* 7. Re-Work Request Modal */}
      <Modal
        isOpen={reworkModalOpen}
        onClose={() => setReworkModalOpen(false)}
        title={`Request Re-Work for ${complaintId}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setReworkModalOpen(false)}>Cancel</Button>
            <Button variant="warning" onClick={handleReworkSubmit} loading={actionLoading}>Return for Re-Work</Button>
          </>
        }
      >
        {actionError && <div className="error-box" style={{ marginBottom: '1rem' }}>{actionError}</div>}
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Specify feedback reason for returning complaint to Field Operator for additional repair work.
        </p>
        <textarea
          className="textarea-field"
          placeholder="Surface leveling incomplete, edge patching required..."
          value={reworkReason}
          onChange={(e) => setReworkReason(e.target.value)}
          required
        />
      </Modal>
    </div>
  );
};
