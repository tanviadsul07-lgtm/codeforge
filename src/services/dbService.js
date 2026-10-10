import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { normalizeReport, normalizeHazard, normalizeWorkOrder } from '../utils/normalizers';

export const dbService = {
  // Subscribe to Citizen Reports (Realtime)
  subscribeCitizenReports(userUid, callback) {
    if (!userUid) {
      callback([]);
      return () => {};
    }

    try {
      const reportsRef = collection(db, 'roadReports');
      const q = query(
        reportsRef,
        where('reporterUid', '==', userUid),
        orderBy('createdAt', 'desc')
      );

      return onSnapshot(q, (snapshot) => {
        const rawReports = snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));
        const reports = rawReports.map(normalizeReport);
        console.log(`[Firestore Listener] Received ${reports.length} citizen reports for UID: ${userUid}`);
        callback(reports);
      }, (error) => {
        console.warn('[Firestore Citizen Reports Listener Warning]', error.message);
      });
    } catch (e) {
      console.warn('[Firestore Setup Error]', e.message);
      return () => {};
    }
  },

  // Subscribe to All Reports (For Department / Field Operators)
  subscribeReports(callback, userRole = 'ROAD_DEPARTMENT', userUid = null) {
    try {
      const reportsRef = collection(db, 'roadReports');
      let q = query(reportsRef, orderBy('createdAt', 'desc'));

      if (userRole === 'CITIZEN' && userUid) {
        return this.subscribeCitizenReports(userUid, callback);
      }

      return onSnapshot(q, (snapshot) => {
        const rawReports = snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));
        const reports = rawReports.map(normalizeReport);
        callback(reports);
      }, (error) => {
        console.warn('[Firestore Reports Listener Warning]', error.message);
      });
    } catch (e) {
      console.warn('[Firestore Setup Error]', e.message);
      return () => {};
    }
  },

  // Subscribe to Hazards (Realtime)
  subscribeHazards(callback) {
    try {
      const hazardsRef = collection(db, 'hazards');
      const q = query(hazardsRef, orderBy('createdAt', 'desc'));

      return onSnapshot(q, (snapshot) => {
        const rawHazards = snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));
        const hazards = rawHazards.map(normalizeHazard);
        callback(hazards);
      }, (error) => {
        console.warn('[Firestore Hazards Listener Warning]', error.message);
      });
    } catch (e) {
      return () => {};
    }
  },

  // Create Media Asset Document in Firestore mediaAssets collection
  async createMediaAsset(assetData, ownerUid, reportId) {
    const countSnapshot = await getDocs(collection(db, 'mediaAssets')).catch(() => ({ size: 0 }));
    const assetId = `MA-2026-${(countSnapshot.size + 1).toString().padStart(4, '0')}`;

    const mediaAssetDoc = {
      assetId,
      ownerUid: ownerUid || 'anon-uid',
      reportId: reportId || null,
      cloudinaryPublicId: assetData.publicId || assetData.cloudinaryPublicId || 'preview-id',
      secureUrl: assetData.secureUrl,
      resourceType: assetData.resourceType || 'image',
      format: assetData.format || 'jpg',
      sizeBytes: assetData.sizeBytes || 0,
      durationSeconds: assetData.durationSeconds || null,
      processingStatus: 'Uploaded',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'mediaAssets', assetId), mediaAssetDoc);
    console.log(`[Firestore dbService] mediaAssets document created: ${assetId}`);
    return mediaAssetDoc;
  },

  // Create Road Report Document in Firestore roadReports collection
  async createReport(reportData, userUid, mediaData = null) {
    try {
      const reportsRef = collection(db, 'roadReports');
      const countSnapshot = await getDocs(reportsRef).catch(() => ({ size: 0 }));
      const count = countSnapshot.size + 1;
      const reportId = `ASET-2026-${count.toString().padStart(5, '0')}`;

      // 1. If mediaData is provided, create mediaAsset document first
      let mediaAssetIds = [];
      let evidenceImage = null;
      let evidenceVideo = null;
      let mediaResourceType = 'image';

      if (mediaData) {
        const createdAsset = await this.createMediaAsset(mediaData, userUid, reportId);
        mediaAssetIds.push(createdAsset.assetId);

        if (mediaData.resourceType === 'video') {
          evidenceVideo = mediaData.secureUrl;
          evidenceImage = mediaData.thumbnailUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80';
          mediaResourceType = 'video';
        } else {
          evidenceImage = mediaData.secureUrl;
          mediaResourceType = 'image';
        }
      } else if (reportData.evidenceImage) {
        if (reportData.evidenceImage.endsWith('.mp4') || reportData.evidenceImage.endsWith('.webm') || reportData.evidenceImage.includes('/video/')) {
          evidenceVideo = reportData.evidenceImage;
          evidenceImage = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80';
          mediaResourceType = 'video';
        } else {
          evidenceImage = reportData.evidenceImage;
        }
      }

      // Handle optional GPS coordinates explicitly
      const hasLocation = reportData.hasLocation !== false && 
                          reportData.latitude !== null && 
                          reportData.latitude !== undefined && 
                          reportData.latitude !== '' &&
                          !isNaN(parseFloat(reportData.latitude));

      const latNum = hasLocation ? parseFloat(reportData.latitude) : null;
      const lngNum = hasLocation ? parseFloat(reportData.longitude) : null;

      const newReport = {
        reportId,
        id: reportId,
        reporterUid: userUid || 'anon-uid',
        reportType: reportData.category || reportData.reportType || 'Pothole',
        category: reportData.category || reportData.reportType || 'Pothole',
        description: reportData.description || '',
        location: reportData.location || (hasLocation ? 'Geotagged Road Segment' : 'Location Omitted by Citizen'),
        hasLocation,
        latitude: latNum,
        longitude: lngNum,
        severity: reportData.severity || 'Medium',
        priority: reportData.severity === 'Critical' ? 'Critical' : (reportData.priority || 'Medium'),
        status: 'Submitted',
        verificationStatus: 'Pending',
        progress: 0,
        assignedDepartment: reportData.assignedDepartment || 'Road Maintenance Department',
        assignedOperatorUid: null,
        assignedOperatorName: 'Unassigned',
        assignedTeam: 'Pending Assignment',
        workOrderId: null,
        mediaAssetIds,
        evidenceImage: evidenceImage || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
        evidenceVideo,
        mediaResourceType,
        videoDetections: reportData.videoDetections || (mediaResourceType === 'video' ? [
          { timestamp: 1.2, bbox: [0.22, 0.42, 0.58, 0.72], category: reportData.category || 'Pothole (Severe)', confidence: 0.92, severity: 'Critical' },
          { timestamp: 3.5, bbox: [0.28, 0.35, 0.62, 0.68], category: reportData.category || 'Pothole', confidence: 0.86, severity: 'High' }
        ] : []),
        submittedBy: reportData.submittedBy || 'Citizen Contributor',
        citizenEmail: reportData.citizenEmail || 'user@example.com',
        timeline: [
          {
            status: 'Submitted',
            timestamp: new Date().toISOString(),
            note: 'Complaint registered by citizen.',
            actorName: reportData.submittedBy || 'Citizen Contributor',
            actorRole: 'CITIZEN',
            progress: 0
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'roadReports', reportId), newReport);
      console.log(`[Firestore dbService] roadReports document created: ${reportId}`);

      // 2. Create associated Hazard document if location coordinates exist
      if (hasLocation && latNum !== null && lngNum !== null) {
        const hazardId = `HZ-2026-${count.toString().padStart(4, '0')}`;
        await setDoc(doc(db, 'hazards', hazardId), {
          hazardId,
          id: hazardId,
          reportId,
          category: newReport.category,
          severity: newReport.severity,
          confidence: 1.0,
          latitude: latNum,
          longitude: lngNum,
          address: newReport.location,
          verificationStatus: 'Pending',
          evidenceImage: newReport.evidenceImage,
          description: newReport.description,
          createdAt: new Date().toISOString()
        }).catch(e => console.warn('[Hazard setDoc warning]', e.message));
      }

      return newReport;
    } catch (error) {
      console.error('[Firestore createReport Error]', error.message);
      throw error;
    }
  },

  // Verify / Reject Report Document (Department Action)
  async verifyReport(reportId, verificationData, officerUser) {
    try {
      const reportRef = doc(db, 'roadReports', reportId);
      const docSnap = await getDoc(reportRef);
      if (!docSnap.exists()) {
        throw new Error(`Report ${reportId} does not exist in Firestore.`);
      }

      const currentData = docSnap.data();
      const isApproved = verificationData.verificationStatus === 'Verified' || verificationData.verificationStatus === 'Approved';
      const newVerificationStatus = isApproved ? 'Verified' : 'Rejected';
      const newStatus = isApproved ? 'Verified' : 'Rejected';
      const newProgress = isApproved ? 10 : 0;
      const officerName = officerUser?.displayName || officerUser?.name || officerUser?.email || 'Department Officer';

      const updatedTimeline = [
        ...(currentData.timeline || []),
        {
          status: newStatus,
          timestamp: new Date().toISOString(),
          note: isApproved
            ? `Department verification complete: ${verificationData.inspectionNotes || 'Report verified.'}`
            : `Department rejected report: ${verificationData.rejectionReason || verificationData.inspectionNotes || 'Invalid report details.'}`,
          actorName: officerName,
          actorRole: 'DEPARTMENT_OFFICER',
          progress: newProgress
        }
      ];

      const updatePayload = {
        verificationStatus: newVerificationStatus,
        status: newStatus,
        progress: newProgress,
        verificationNotes: verificationData.inspectionNotes || '',
        rejectionReason: !isApproved ? (verificationData.rejectionReason || verificationData.inspectionNotes || 'Rejected by department') : null,
        verifiedBy: officerName,
        verifiedByUid: officerUser?.uid || 'dept-officer-uid',
        verifiedAt: new Date().toISOString(),
        timeline: updatedTimeline,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(reportRef, updatePayload);
      console.log(`[Firestore dbService] Road report ${reportId} verification updated: ${newVerificationStatus}`);
      return { success: true, reportId, ...updatePayload };
    } catch (error) {
      console.error('[Firestore verifyReport Error]', error.message);
      throw error;
    }
  },

  // Assign Field Operator to Complaint (Department Action)
  async assignFieldOperator(reportId, assignmentData, officerUser) {
    try {
      const reportRef = doc(db, 'roadReports', reportId);
      const docSnap = await getDoc(reportRef);
      if (!docSnap.exists()) {
        throw new Error(`Report ${reportId} does not exist in Firestore.`);
      }

      const currentData = docSnap.data();
      const officerName = officerUser?.displayName || officerUser?.name || 'Department Officer';
      const operatorName = assignmentData.operatorName || assignmentData.assignedOperatorName || 'Field Operator';
      const operatorUid = assignmentData.operatorUid || assignmentData.assignedOperatorUid || 'operator-uid';

      const updatedTimeline = [
        ...(currentData.timeline || []),
        {
          status: 'Assigned',
          timestamp: new Date().toISOString(),
          note: `Assigned to Field Operator ${operatorName} (${assignmentData.team || 'Repair Crew'}). Instructions: ${assignmentData.instructions || 'Conduct repair work.'}`,
          actorName: officerName,
          actorRole: 'DEPARTMENT_OFFICER',
          progress: 10
        }
      ];

      const updatePayload = {
        status: 'Assigned',
        progress: 10,
        assignedOperatorUid: operatorUid,
        assignedOperatorName: operatorName,
        assignedDepartment: assignmentData.department || currentData.assignedDepartment || 'PWD Maintenance Division',
        assignedTeam: assignmentData.team || 'Rapid Repair Unit',
        workInstructions: assignmentData.instructions || '',
        targetCompletionDate: assignmentData.targetDate || '',
        assignedAt: new Date().toISOString(),
        timeline: updatedTimeline,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(reportRef, updatePayload);
      console.log(`[Firestore dbService] Road report ${reportId} assigned to ${operatorName}`);
      return { success: true, reportId, ...updatePayload };
    } catch (error) {
      console.error('[Firestore assignFieldOperator Error]', error.message);
      throw error;
    }
  },

  // Start Operator Work (Field Operator Action)
  async startOperatorWork(reportId, operatorUser) {
    try {
      const reportRef = doc(db, 'roadReports', reportId);
      const docSnap = await getDoc(reportRef);
      if (!docSnap.exists()) throw new Error(`Report ${reportId} not found.`);

      const currentData = docSnap.data();
      const opName = operatorUser?.displayName || operatorUser?.name || 'Field Operator';

      const updatedTimeline = [
        ...(currentData.timeline || []),
        {
          status: 'In Progress',
          timestamp: new Date().toISOString(),
          note: `Work started by Field Operator ${opName}.`,
          actorName: opName,
          actorRole: 'FIELD_OPERATOR',
          progress: 25
        }
      ];

      const updatePayload = {
        status: 'In Progress',
        progress: 25,
        workStartedAt: new Date().toISOString(),
        timeline: updatedTimeline,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(reportRef, updatePayload);
      return { success: true, reportId, ...updatePayload };
    } catch (error) {
      console.error('[Firestore startOperatorWork Error]', error.message);
      throw error;
    }
  },

  // Update Operator Work Progress (Field Operator Action)
  async updateOperatorProgress(reportId, progressPct, notes, progressImage = null, operatorUser = null) {
    try {
      const reportRef = doc(db, 'roadReports', reportId);
      const docSnap = await getDoc(reportRef);
      if (!docSnap.exists()) throw new Error(`Report ${reportId} not found.`);

      const currentData = docSnap.data();
      const opName = operatorUser?.displayName || operatorUser?.name || 'Field Operator';
      const cleanProgress = Math.min(89, Math.max(25, parseInt(progressPct, 10) || 25));

      const updatedTimeline = [
        ...(currentData.timeline || []),
        {
          status: 'In Progress',
          timestamp: new Date().toISOString(),
          note: `Progress updated to ${cleanProgress}%: ${notes || 'Work in progress.'}`,
          actorName: opName,
          actorRole: 'FIELD_OPERATOR',
          progress: cleanProgress,
          ...(progressImage ? { evidenceImage: progressImage } : {})
        }
      ];

      const updatePayload = {
        status: 'In Progress',
        progress: cleanProgress,
        timeline: updatedTimeline,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(reportRef, updatePayload);
      return { success: true, reportId, ...updatePayload };
    } catch (error) {
      console.error('[Firestore updateOperatorProgress Error]', error.message);
      throw error;
    }
  },

  // Submit Work Completion for Review (Field Operator Action)
  async submitCompletion(reportId, completionData, operatorUser) {
    try {
      const reportRef = doc(db, 'roadReports', reportId);
      const docSnap = await getDoc(reportRef);
      if (!docSnap.exists()) throw new Error(`Report ${reportId} not found.`);

      const currentData = docSnap.data();
      const opName = operatorUser?.displayName || operatorUser?.name || 'Field Operator';

      const updatedTimeline = [
        ...(currentData.timeline || []),
        {
          status: 'Awaiting Approval',
          timestamp: new Date().toISOString(),
          note: `Repair completed by operator. Completion notes: ${completionData.notes || 'Repair complete.'}`,
          actorName: opName,
          actorRole: 'FIELD_OPERATOR',
          progress: 90,
          ...(completionData.evidenceImage ? { evidenceImage: completionData.evidenceImage } : {})
        }
      ];

      const updatePayload = {
        status: 'Awaiting Approval',
        progress: 90,
        completionNotes: completionData.notes || 'Work completed.',
        repairEvidenceImage: completionData.evidenceImage || null,
        completionSubmittedAt: new Date().toISOString(),
        timeline: updatedTimeline,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(reportRef, updatePayload);
      return { success: true, reportId, ...updatePayload };
    } catch (error) {
      console.error('[Firestore submitCompletion Error]', error.message);
      throw error;
    }
  },

  // Approve Complaint Resolution (Department Action)
  async approveResolution(reportId, approvalData, officerUser) {
    try {
      const reportRef = doc(db, 'roadReports', reportId);
      const docSnap = await getDoc(reportRef);
      if (!docSnap.exists()) throw new Error(`Report ${reportId} not found.`);

      const currentData = docSnap.data();
      const officerName = officerUser?.displayName || officerUser?.name || 'Department Officer';

      const updatedTimeline = [
        ...(currentData.timeline || []),
        {
          status: 'Resolved',
          timestamp: new Date().toISOString(),
          note: `Department approved repair completion: ${approvalData.remarks || 'Verification confirmed.'}`,
          actorName: officerName,
          actorRole: 'DEPARTMENT_OFFICER',
          progress: 100
        }
      ];

      const updatePayload = {
        status: 'Resolved',
        progress: 100,
        resolvedAt: new Date().toISOString(),
        resolvedBy: officerName,
        resolutionRemarks: approvalData.remarks || 'Approved by department officer',
        timeline: updatedTimeline,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(reportRef, updatePayload);
      console.log(`[Firestore dbService] Complaint ${reportId} RESOLVED successfully.`);
      return { success: true, reportId, ...updatePayload };
    } catch (error) {
      console.error('[Firestore approveResolution Error]', error.message);
      throw error;
    }
  },

  // Reject Completion Evidence & Return to Field (Department Action)
  async rejectCompletion(reportId, rejectionData, officerUser) {
    try {
      const reportRef = doc(db, 'roadReports', reportId);
      const docSnap = await getDoc(reportRef);
      if (!docSnap.exists()) throw new Error(`Report ${reportId} not found.`);

      const currentData = docSnap.data();
      const officerName = officerUser?.displayName || officerUser?.name || 'Department Officer';

      const updatedTimeline = [
        ...(currentData.timeline || []),
        {
          status: 'In Progress',
          timestamp: new Date().toISOString(),
          note: `Completion rejected by department officer: ${rejectionData.reason || 'Additional repair work required.'}`,
          actorName: officerName,
          actorRole: 'DEPARTMENT_OFFICER',
          progress: 50
        }
      ];

      const updatePayload = {
        status: 'In Progress',
        progress: 50,
        rejectionNotes: rejectionData.reason || 'Returned for additional work',
        timeline: updatedTimeline,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(reportRef, updatePayload);
      return { success: true, reportId, ...updatePayload };
    } catch (error) {
      console.error('[Firestore rejectCompletion Error]', error.message);
      throw error;
    }
  },

  // Update Report Status & Timeline
  async updateReportStatus(reportId, newStatus, note = '') {
    try {
      const reportRef = doc(db, 'roadReports', reportId);
      const docSnap = await getDoc(reportRef);
      if (docSnap.exists()) {
        const currentData = docSnap.data();
        const updatedTimeline = [
          ...(currentData.timeline || []),
          { status: newStatus, timestamp: new Date().toISOString(), note: note || `Status updated to ${newStatus}` }
        ];

        await updateDoc(reportRef, {
          status: newStatus,
          timeline: updatedTimeline,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('[Firestore updateReportStatus Error]', error.message);
    }
  },

  // Subscribe to Work Orders (Realtime)
  subscribeWorkOrders(callback) {
    try {
      const woRef = collection(db, 'workOrders');
      const q = query(woRef, orderBy('createdAt', 'desc'));

      return onSnapshot(q, (snapshot) => {
        const rawOrders = snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));
        const workOrders = rawOrders.map(normalizeWorkOrder);
        console.log(`[Firestore Listener] Received ${workOrders.length} work orders`);
        callback(workOrders);
      }, (error) => {
        console.warn('[Firestore WorkOrders Listener Warning]', error.message);
      });
    } catch (e) {
      console.warn('[Firestore Setup Error]', e.message);
      return () => {};
    }
  },

  // Create Work Order Document
  async createWorkOrder(woData) {
    try {
      const woRef = collection(db, 'workOrders');
      const countSnapshot = await getDocs(woRef).catch(() => ({ size: 0 }));
      const count = countSnapshot.size + 1;
      const workOrderId = woData.id || `WO-2026-0${count.toString().padStart(2, '0')}`;

      const newWO = {
        id: workOrderId,
        workOrderId,
        complaintId: woData.complaintId || null,
        hazardCategory: woData.hazardCategory || woData.category || 'Pothole',
        location: woData.location || 'Municipal Carriageway',
        assignedDepartment: woData.department || woData.assignedDepartment || 'PWD Maintenance Division 4',
        assignedTeam: woData.team || woData.assignedTeam || 'Rapid Asphalt Repair Unit A',
        officerInCharge: woData.officer || woData.officerInCharge || 'Er. S. K. Gupta',
        priority: woData.priority || 'High',
        status: woData.status || 'In Progress',
        progress: woData.progress || 10,
        targetCompletionDate: woData.targetDate || woData.targetCompletionDate || '2026-10-15',
        workInstructions: woData.instructions || woData.workInstructions || 'Conduct road defect repair.',
        activityTimeline: woData.activityTimeline || [
          { date: new Date().toLocaleString(), text: `Work order ${workOrderId} dispatched to ${woData.team || woData.assignedTeam || 'Repair Crew'}.` }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'workOrders', workOrderId), newWO);
      console.log(`[Firestore dbService] workOrders document created: ${workOrderId}`);

      // Update parent complaint
      if (woData.complaintId) {
        await this.updateReportStatus(woData.complaintId, 'Assigned', `Work order ${workOrderId} assigned to ${newWO.assignedTeam}`);
        const reportRef = doc(db, 'roadReports', woData.complaintId);
        await updateDoc(reportRef, {
          workOrderId,
          assignedDepartment: newWO.assignedDepartment,
          assignedTeam: newWO.assignedTeam,
          updatedAt: new Date().toISOString()
        }).catch(e => console.warn('[Report link update warning]', e.message));
      }

      return newWO;
    } catch (error) {
      console.error('[Firestore createWorkOrder Error]', error.message);
      throw error;
    }
  },

  // Update Work Order Progress
  async updateWorkOrderProgress(workOrderId, progressNum, statusStr, noteStr, evidenceImage = null) {
    try {
      const woRef = doc(db, 'workOrders', workOrderId);
      const docSnap = await getDoc(woRef);
      if (!docSnap.exists()) {
        throw new Error(`Work order ${workOrderId} does not exist in Firestore.`);
      }

      const currentData = docSnap.data();
      const isFinished = progressNum >= 100 || statusStr === 'Completed' || statusStr === 'Resolved';
      const finalStatus = isFinished ? 'Completed' : statusStr;

      const newTimelineEntry = {
        date: new Date().toLocaleString(),
        text: noteStr || `Progress updated to ${progressNum}% (${finalStatus})`,
        ...(evidenceImage ? { evidenceImage } : {})
      };

      const updatedTimeline = [
        ...(currentData.activityTimeline || []),
        newTimelineEntry
      ];

      const updatePayload = {
        progress: Math.min(100, Math.max(0, progressNum)),
        status: finalStatus,
        activityTimeline: updatedTimeline,
        updatedAt: new Date().toISOString(),
        ...(evidenceImage ? { completionEvidenceImage: evidenceImage } : {})
      };

      await updateDoc(woRef, updatePayload);
      console.log(`[Firestore dbService] Work order ${workOrderId} progress updated to ${progressNum}% (${finalStatus})`);

      if (isFinished && currentData.complaintId) {
        await this.updateReportStatus(currentData.complaintId, 'Resolved', `Repair completed under Work Order ${workOrderId}.`);
      }

      return { success: true, workOrderId, ...updatePayload };
    } catch (error) {
      console.error('[Firestore updateWorkOrderProgress Error]', error.message);
      throw error;
    }
  }
};
