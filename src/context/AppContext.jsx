import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_HAZARDS } from '../data/demoHazards';
import { INITIAL_COMPLAINTS } from '../data/demoComplaints';
import { INITIAL_SURVEYS } from '../data/demoSurveys';
import { INITIAL_WORK_ORDERS } from '../data/demoWorkOrders';
import { INITIAL_NOTIFICATIONS } from '../data/demoNotifications';
import { dbService } from '../services/dbService';
import { useAuth } from './AuthContext';
import {
  normalizeReport,
  normalizeHazard,
  normalizeWorkOrder,
  normalizeSurveySession
} from '../utils/normalizers';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { user, role } = useAuth();

  const [hazards, setHazards] = useState(() => {
    try {
      const saved = localStorage.getItem('pr_hazards');
      const list = saved ? JSON.parse(saved) : INITIAL_HAZARDS;
      return (Array.isArray(list) ? list : INITIAL_HAZARDS).map(normalizeHazard);
    } catch {
      return INITIAL_HAZARDS.map(normalizeHazard);
    }
  });

  const [complaints, setComplaints] = useState(() => {
    try {
      const saved = localStorage.getItem('pr_complaints');
      const list = saved ? JSON.parse(saved) : INITIAL_COMPLAINTS;
      return (Array.isArray(list) ? list : INITIAL_COMPLAINTS).map(normalizeReport);
    } catch {
      return INITIAL_COMPLAINTS.map(normalizeReport);
    }
  });

  const [surveys, setSurveys] = useState(() => {
    try {
      const saved = localStorage.getItem('pr_surveys');
      const list = saved ? JSON.parse(saved) : INITIAL_SURVEYS;
      return (Array.isArray(list) ? list : INITIAL_SURVEYS).map(normalizeSurveySession);
    } catch {
      return INITIAL_SURVEYS.map(normalizeSurveySession);
    }
  });

  const [workOrders, setWorkOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('pr_work_orders');
      const list = saved ? JSON.parse(saved) : INITIAL_WORK_ORDERS;
      return (Array.isArray(list) ? list : INITIAL_WORK_ORDERS).map(normalizeWorkOrder);
    } catch {
      return INITIAL_WORK_ORDERS.map(normalizeWorkOrder);
    }
  });

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('pr_notifications');
      const list = saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
      return Array.isArray(list) ? list : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [globalSearch, setGlobalSearch] = useState('');

  // Firestore Realtime Subscriptions
  useEffect(() => {
    const unsubReports = dbService.subscribeReports((remoteReports) => {
      if (Array.isArray(remoteReports) && remoteReports.length > 0) {
        setComplaints(remoteReports.map(normalizeReport));
      }
    }, role, user?.uid);

    const unsubHazards = dbService.subscribeHazards((remoteHazards) => {
      if (Array.isArray(remoteHazards) && remoteHazards.length > 0) {
        setHazards(remoteHazards.map(normalizeHazard));
      }
    });

    const unsubWorkOrders = dbService.subscribeWorkOrders((remoteWorkOrders) => {
      if (Array.isArray(remoteWorkOrders) && remoteWorkOrders.length > 0) {
        setWorkOrders(remoteWorkOrders.map(normalizeWorkOrder));
      }
    });

    return () => {
      unsubReports();
      unsubHazards();
      unsubWorkOrders();
    };
  }, [role, user]);

  useEffect(() => {
    localStorage.setItem('pr_hazards', JSON.stringify(hazards));
  }, [hazards]);

  useEffect(() => {
    localStorage.setItem('pr_complaints', JSON.stringify(complaints));
  }, [complaints]);

  useEffect(() => {
    localStorage.setItem('pr_surveys', JSON.stringify(surveys));
  }, [surveys]);

  useEffect(() => {
    localStorage.setItem('pr_work_orders', JSON.stringify(workOrders));
  }, [workOrders]);

  useEffect(() => {
    localStorage.setItem('pr_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Actions
  const addComplaint = (newComplaintData) => {
    const count = complaints.length + 1;
    const id = `PR-2026-0${count.toString().padStart(2, '0')}`;
    
    const newRecord = {
      id,
      category: newComplaintData.category,
      hazardId: newComplaintData.hazardId || null,
      location: newComplaintData.location,
      latitude: parseFloat(newComplaintData.latitude) || 28.6139,
      longitude: parseFloat(newComplaintData.longitude) || 77.2090,
      severity: newComplaintData.severity || "Medium",
      priority: newComplaintData.severity === "Critical" ? "Critical" : "Medium",
      status: "Submitted",
      submittedBy: newComplaintData.submittedBy || user?.name || "Citizen User",
      citizenEmail: newComplaintData.citizenEmail || user?.email || "user@example.com",
      submittedDate: new Date().toISOString(),
      assignedDepartment: "Pending Assignment",
      assignedTeam: "Pending",
      workOrderId: null,
      description: newComplaintData.description,
      evidenceImage: newComplaintData.evidenceImage || "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
      timeline: [
        { status: "Submitted", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), note: "Complaint registered by citizen." }
      ]
    };

    setComplaints(prev => [newRecord, ...prev]);

    // Persist to Firestore DB asynchronously
    dbService.createReport(newComplaintData, user?.uid).catch(e => {
      console.warn('[Firestore async report fallback]', e.message);
    });
    
    if (newComplaintData.latitude && newComplaintData.longitude) {
      const newHazard = {
        id: `HZ-2026-${(hazards.length + 1).toString().padStart(3, '0')}`,
        category: newComplaintData.category,
        severity: newComplaintData.severity || "Medium",
        confidence: 1.0,
        latitude: parseFloat(newComplaintData.latitude),
        longitude: parseFloat(newComplaintData.longitude),
        address: newComplaintData.location,
        timestamp: new Date().toISOString(),
        videoTimestamp: "N/A (Citizen Photo)",
        sessionId: "CITIZEN-DIRECT",
        verificationStatus: "Verified",
        evidenceImage: newRecord.evidenceImage,
        description: newComplaintData.description,
        complaintId: id
      };
      setHazards(prev => [newHazard, ...prev]);
    }

    addNotification({
      title: "Complaint Logged Successfully",
      message: `Your report ${id} for ${newComplaintData.category} has been submitted.`,
      type: "success",
      role: "citizen",
      link: `/citizen/complaints/${id}`
    });

    return newRecord;
  };

  const updateComplaintStatus = (complaintId, newStatus, note = "") => {
    setComplaints(prev => prev.map(item => {
      if (item.id === complaintId) {
        const updatedTimeline = [
          ...item.timeline,
          {
            status: newStatus,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            note: note || `Status updated to ${newStatus}`
          }
        ];
        return {
          ...item,
          status: newStatus,
          timeline: updatedTimeline
        };
      }
      return item;
    }));

    dbService.updateReportStatus(complaintId, newStatus, note);

    addNotification({
      title: `Complaint ${complaintId} Updated`,
      message: `Status changed to ${newStatus}.`,
      type: "info",
      role: "citizen",
      link: `/citizen/complaints/${complaintId}`
    });
  };

  const assignWorkOrder = (complaintId, workOrderData) => {
    const woCount = workOrders.length + 1;
    const woId = `WO-2026-0${woCount.toString().padStart(2, '0')}`;
    const targetComplaint = complaints.find(c => c.id === complaintId || c.reportId === complaintId);

    const newWO = {
      id: woId,
      workOrderId: woId,
      complaintId,
      hazardCategory: targetComplaint ? targetComplaint.category : workOrderData.category || "Pothole",
      location: targetComplaint ? targetComplaint.location : workOrderData.location || "City Carriageway",
      assignedDepartment: workOrderData.department || "PWD Central Division",
      assignedTeam: workOrderData.team || "Rapid Repair Team Alpha",
      officerInCharge: workOrderData.officer || "Er. Inspection Officer",
      priority: workOrderData.priority || "High",
      status: "In Progress",
      progress: 10,
      targetCompletionDate: workOrderData.targetDate || "2026-10-15",
      workInstructions: workOrderData.instructions || "Conduct road surface restoration.",
      activityTimeline: [
        { date: new Date().toLocaleString(), text: `Work order ${woId} assigned to ${workOrderData.team || 'Repair Team'}.` }
      ]
    };

    setWorkOrders(prev => [newWO, ...prev]);
    updateComplaintStatus(complaintId, "Assigned", `Work Order ${woId} assigned to ${newWO.assignedTeam}`);
    setComplaints(prev => prev.map(c => (c.id === complaintId || c.reportId === complaintId) ? { ...c, workOrderId: woId, assignedTeam: newWO.assignedTeam } : c));

    dbService.createWorkOrder({ id: woId, complaintId, ...workOrderData, ...newWO }).catch(e => console.warn('[Firestore createWorkOrder error]', e.message));

    return newWO;
  };

  const updateWorkOrderProgress = (woId, progressNum, statusStr, noteStr, evidenceImage = null) => {
    const isFinished = progressNum >= 100 || statusStr === "Completed" || statusStr === "Resolved";
    const finalStatus = isFinished ? "Completed" : statusStr;

    setWorkOrders(prev => prev.map(wo => {
      if (wo.id === woId || wo.workOrderId === woId) {
        const updated = {
          ...wo,
          progress: Math.min(100, Math.max(0, progressNum)),
          status: finalStatus,
          activityTimeline: [
            ...(wo.activityTimeline || []),
            { date: new Date().toLocaleString(), text: noteStr || `Progress updated to ${progressNum}% (${finalStatus})`, ...(evidenceImage ? { evidenceImage } : {}) }
          ]
        };

        if (isFinished && wo.complaintId) {
          updateComplaintStatus(wo.complaintId, "Resolved", `Repair completed under Work Order ${woId}.`);
        }

        return updated;
      }
      return wo;
    }));

    dbService.updateWorkOrderProgress(woId, progressNum, finalStatus, noteStr, evidenceImage).catch(e => console.warn('[Firestore updateWorkOrderProgress error]', e.message));
  };

  const verifyHazard = (hazardId, status, edits = {}) => {
    setHazards(prev => prev.map(h => {
      if (h.id === hazardId || h.hazardId === hazardId) {
        return {
          ...h,
          verificationStatus: status,
          ...edits
        };
      }
      return h;
    }));
  };

  const verifyReport = async (reportId, verificationData) => {
    const isApproved = verificationData.verificationStatus === 'Verified' || verificationData.verificationStatus === 'Approved';
    const newStatus = isApproved ? 'Verified' : 'Rejected';
    const newProgress = isApproved ? 10 : 0;

    setComplaints(prev => prev.map(item => {
      if (item.id === reportId || item.reportId === reportId) {
        const updatedTimeline = [
          ...(item.timeline || []),
          {
            status: newStatus,
            timestamp: new Date().toISOString(),
            note: isApproved
              ? `Department verified complaint: ${verificationData.inspectionNotes || 'Verified.'}`
              : `Department rejected complaint: ${verificationData.rejectionReason || verificationData.inspectionNotes || 'Rejected.'}`,
            actorName: user?.displayName || user?.name || 'Department Officer',
            actorRole: 'DEPARTMENT_OFFICER',
            progress: newProgress
          }
        ];
        return {
          ...item,
          verificationStatus: isApproved ? 'Verified' : 'Rejected',
          status: newStatus,
          progress: newProgress,
          verificationNotes: verificationData.inspectionNotes || '',
          rejectionReason: !isApproved ? (verificationData.rejectionReason || verificationData.inspectionNotes) : null,
          verifiedBy: user?.displayName || user?.name || 'Department Officer',
          verifiedAt: new Date().toISOString(),
          timeline: updatedTimeline
        };
      }
      return item;
    }));

    addNotification({
      title: `Complaint ${reportId} ${newStatus}`,
      message: isApproved ? `Verified by Department. Ready for operator assignment.` : `Complaint was rejected.`,
      type: isApproved ? 'success' : 'danger',
      role: 'citizen',
      link: `/citizen/complaints/${reportId}`
    });

    return dbService.verifyReport(reportId, verificationData, user);
  };

  const assignFieldOperator = async (reportId, assignmentData) => {
    const operatorName = assignmentData.operatorName || assignmentData.assignedOperatorName || 'Field Operator';
    const operatorUid = assignmentData.operatorUid || assignmentData.assignedOperatorUid || 'operator-uid';

    setComplaints(prev => prev.map(c => {
      if (c.id === reportId || c.reportId === reportId) {
        const updatedTimeline = [
          ...(c.timeline || []),
          {
            status: 'Assigned',
            timestamp: new Date().toISOString(),
            note: `Assigned to Field Operator ${operatorName} (${assignmentData.team || 'Repair Crew'}). Instructions: ${assignmentData.instructions || 'Conduct repair work.'}`,
            actorName: user?.displayName || user?.name || 'Department Officer',
            actorRole: 'DEPARTMENT_OFFICER',
            progress: 10
          }
        ];
        return {
          ...c,
          status: 'Assigned',
          progress: 10,
          assignedOperatorUid: operatorUid,
          assignedOperatorName: operatorName,
          assignedDepartment: assignmentData.department || c.assignedDepartment || 'PWD Maintenance Division',
          assignedTeam: assignmentData.team || 'Rapid Repair Unit',
          workInstructions: assignmentData.instructions || '',
          targetCompletionDate: assignmentData.targetDate || '',
          timeline: updatedTimeline
        };
      }
      return c;
    }));

    addNotification({
      title: `Complaint ${reportId} Assigned`,
      message: `Assigned to Field Operator ${operatorName}.`,
      type: 'info',
      role: 'field-operator',
      link: `/operator/dashboard`
    });

    return dbService.assignFieldOperator(reportId, assignmentData, user);
  };

  const startOperatorWork = async (reportId) => {
    setComplaints(prev => prev.map(c => {
      if (c.id === reportId || c.reportId === reportId) {
        const updatedTimeline = [
          ...(c.timeline || []),
          {
            status: 'In Progress',
            timestamp: new Date().toISOString(),
            note: `Work started by Field Operator ${user?.displayName || user?.name || 'Field Operator'}.`,
            actorName: user?.displayName || user?.name || 'Field Operator',
            actorRole: 'FIELD_OPERATOR',
            progress: 25
          }
        ];
        return {
          ...c,
          status: 'In Progress',
          progress: 25,
          timeline: updatedTimeline
        };
      }
      return c;
    }));

    return dbService.startOperatorWork(reportId, user);
  };

  const updateOperatorProgress = async (reportId, progressPct, notes, progressImage = null) => {
    const cleanProgress = Math.min(89, Math.max(25, parseInt(progressPct, 10) || 25));

    setComplaints(prev => prev.map(c => {
      if (c.id === reportId || c.reportId === reportId) {
        const updatedTimeline = [
          ...(c.timeline || []),
          {
            status: 'In Progress',
            timestamp: new Date().toISOString(),
            note: `Progress updated to ${cleanProgress}%: ${notes || 'Work in progress.'}`,
            actorName: user?.displayName || user?.name || 'Field Operator',
            actorRole: 'FIELD_OPERATOR',
            progress: cleanProgress,
            ...(progressImage ? { evidenceImage: progressImage } : {})
          }
        ];
        return {
          ...c,
          status: 'In Progress',
          progress: cleanProgress,
          timeline: updatedTimeline
        };
      }
      return c;
    }));

    addNotification({
      title: `Complaint ${reportId} Progress Updated`,
      message: `Work progress reached ${cleanProgress}%.`,
      type: 'info',
      role: 'citizen',
      link: `/citizen/complaints/${reportId}`
    });

    return dbService.updateOperatorProgress(reportId, cleanProgress, notes, progressImage, user);
  };

  const submitCompletion = async (reportId, completionData) => {
    setComplaints(prev => prev.map(c => {
      if (c.id === reportId || c.reportId === reportId) {
        const updatedTimeline = [
          ...(c.timeline || []),
          {
            status: 'Awaiting Approval',
            timestamp: new Date().toISOString(),
            note: `Repair completed by operator. Completion notes: ${completionData.notes || 'Repair complete.'}`,
            actorName: user?.displayName || user?.name || 'Field Operator',
            actorRole: 'FIELD_OPERATOR',
            progress: 90,
            ...(completionData.evidenceImage ? { evidenceImage: completionData.evidenceImage } : {})
          }
        ];
        return {
          ...c,
          status: 'Awaiting Approval',
          progress: 90,
          completionNotes: completionData.notes || 'Work completed.',
          repairEvidenceImage: completionData.evidenceImage || null,
          timeline: updatedTimeline
        };
      }
      return c;
    }));

    addNotification({
      title: `Repair Work Completed for ${reportId}`,
      message: `Field operator submitted completion evidence. Awaiting department review.`,
      type: 'info',
      role: 'department-officer',
      link: `/department/dashboard`
    });

    return dbService.submitCompletion(reportId, completionData, user);
  };

  const approveResolution = async (reportId, approvalData = {}) => {
    setComplaints(prev => prev.map(c => {
      if (c.id === reportId || c.reportId === reportId) {
        const updatedTimeline = [
          ...(c.timeline || []),
          {
            status: 'Resolved',
            timestamp: new Date().toISOString(),
            note: `Department approved repair completion: ${approvalData.remarks || 'Verification confirmed.'}`,
            actorName: user?.displayName || user?.name || 'Department Officer',
            actorRole: 'DEPARTMENT_OFFICER',
            progress: 100
          }
        ];
        return {
          ...c,
          status: 'Resolved',
          progress: 100,
          resolvedAt: new Date().toISOString(),
          resolvedBy: user?.displayName || user?.name || 'Department Officer',
          resolutionRemarks: approvalData.remarks || 'Approved',
          timeline: updatedTimeline
        };
      }
      return c;
    }));

    addNotification({
      title: `Complaint ${reportId} Resolved 🎉`,
      message: `Your road hazard complaint has been verified and fully resolved (100% complete).`,
      type: 'success',
      role: 'citizen',
      link: `/citizen/complaints/${reportId}`
    });

    return dbService.approveResolution(reportId, approvalData, user);
  };

  const rejectCompletion = async (reportId, rejectionData = {}) => {
    setComplaints(prev => prev.map(c => {
      if (c.id === reportId || c.reportId === reportId) {
        const updatedTimeline = [
          ...(c.timeline || []),
          {
            status: 'In Progress',
            timestamp: new Date().toISOString(),
            note: `Completion rejected by department officer: ${rejectionData.reason || 'Additional repair work required.'}`,
            actorName: user?.displayName || user?.name || 'Department Officer',
            actorRole: 'DEPARTMENT_OFFICER',
            progress: 50
          }
        ];
        return {
          ...c,
          status: 'In Progress',
          progress: 50,
          rejectionNotes: rejectionData.reason || 'Returned for work',
          timeline: updatedTimeline
        };
      }
      return c;
    }));

    addNotification({
      title: `Work Completion Rejected for ${reportId}`,
      message: `Department requested additional repair work: ${rejectionData.reason || 'Re-work required.'}`,
      type: 'warning',
      role: 'field-operator',
      link: `/operator/dashboard`
    });

    return dbService.rejectCompletion(reportId, rejectionData, user);
  };

  const addSurveySession = (sessionData) => {
    const newId = `SUR-2026-${(surveys.length + 100).toString()}`;
    const newSession = {
      id: newId,
      name: sessionData.name || "Road Survey Session",
      roadName: sessionData.roadName || "Main Arterial Corridor",
      area: sessionData.area || "Central District",
      date: new Date().toISOString().split('T')[0],
      videoFile: sessionData.videoFileName || "survey_dashcam.mp4",
      videoSize: sessionData.videoSize || "350 MB",
      gpsFile: sessionData.gpsFileName || "gps_logs.gpx",
      gpsStatus: "Valid Trajectory",
      processingStatus: "Processing",
      progressPercent: 20,
      hazardCount: 0,
      notes: sessionData.notes || "Surveilled via camera unit."
    };

    setSurveys(prev => [newSession, ...prev]);

    addNotification({
      title: "Survey Session Started",
      message: `Session ${newId} uploaded and AI analysis queued.`,
      type: "info",
      role: "field-operator",
      link: `/operator/jobs`
    });

    return newSession;
  };

  const addNotification = (notif) => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      title: notif.title,
      message: notif.message,
      timestamp: "Just now",
      read: false,
      type: notif.type || "info",
      role: notif.role || "citizen",
      link: notif.link || "#"
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationRead = (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const resetDemoData = () => {
    localStorage.removeItem('pr_hazards');
    localStorage.removeItem('pr_complaints');
    localStorage.removeItem('pr_surveys');
    localStorage.removeItem('pr_work_orders');
    localStorage.removeItem('pr_notifications');
    setHazards(INITIAL_HAZARDS);
    setComplaints(INITIAL_COMPLAINTS);
    setSurveys(INITIAL_SURVEYS);
    setWorkOrders(INITIAL_WORK_ORDERS);
    setNotifications(INITIAL_NOTIFICATIONS);
  };

  return (
    <AppContext.Provider value={{
      hazards,
      complaints,
      surveys,
      workOrders,
      notifications,
      globalSearch,
      setGlobalSearch,
      addComplaint,
      updateComplaintStatus,
      assignWorkOrder,
      updateWorkOrderProgress,
      verifyHazard,
      verifyReport,
      assignFieldOperator,
      startOperatorWork,
      updateOperatorProgress,
      submitCompletion,
      approveResolution,
      rejectCompletion,
      addSurveySession,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      resetDemoData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
