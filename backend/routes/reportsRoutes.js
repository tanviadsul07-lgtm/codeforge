import express from 'express';
import { adminDb, verifyAuthToken, requireRole } from '../services/firebaseAdmin.js';

const router = express.Router();

// Create Road Report
router.post('/', verifyAuthToken, async (req, res) => {
  const { category, description, location, latitude, longitude, severity, evidenceImage } = req.body;

  if (!category || !location) {
    return res.status(400).json({ success: false, error: 'Category and Location are required fields' });
  }

  try {
    const reportsRef = adminDb.collection('roadReports');
    const snapshot = await reportsRef.get();
    const count = snapshot.size + 1;
    const reportId = `PR-2026-0${count.toString().padStart(2, '0')}`;

    const newReport = {
      reportId,
      reporterUid: req.user.uid,
      submittedBy: req.user.displayName || req.user.email,
      citizenEmail: req.user.email,
      category,
      description: description || '',
      location,
      latitude: parseFloat(latitude) || null,
      longitude: parseFloat(longitude) || null,
      severity: severity || 'Medium',
      priority: severity === 'Critical' ? 'Critical' : 'Medium',
      status: 'Submitted',
      assignedDepartment: 'Pending Assignment',
      assignedTeam: 'Pending',
      workOrderId: null,
      evidenceImage: evidenceImage || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
      timeline: [
        { status: 'Submitted', timestamp: new Date().toISOString(), note: 'Complaint logged by citizen.' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await reportsRef.doc(reportId).set(newReport);

    // If coordinates exist, also add hazard geolocated pin
    if (newReport.latitude && newReport.longitude) {
      const hazardId = `HZ-2026-${count.toString().padStart(3, '0')}`;
      await adminDb.collection('hazards').doc(hazardId).set({
        hazardId,
        reportId,
        category,
        severity: newReport.severity,
        confidence: 1.0,
        latitude: newReport.latitude,
        longitude: newReport.longitude,
        address: location,
        verificationStatus: 'Verified',
        evidenceImage: newReport.evidenceImage,
        description,
        createdAt: new Date().toISOString()
      });
    }

    return res.status(201).json({ success: true, report: newReport });
  } catch (error) {
    console.error('[Create Report Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// List Reports
router.get('/', verifyAuthToken, async (req, res) => {
  try {
    const reportsRef = adminDb.collection('roadReports');
    let query = reportsRef;

    // Citizens only see their own submitted reports
    if (req.user.role === 'CITIZEN') {
      query = reportsRef.where('reporterUid', '==', req.user.uid);
    }

    const snapshot = await query.get();
    const reports = snapshot.docs.map(doc => doc.data());
    return res.json({ success: true, reports });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Update Report Status
router.patch('/:id', verifyAuthToken, requireRole(['ROAD_DEPARTMENT', 'FIELD_OPERATOR']), async (req, res) => {
  const { id } = req.params;
  const { status, note, assignedTeam } = req.body;

  try {
    const reportRef = adminDb.collection('roadReports').doc(id);
    const doc = await reportRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    const currentData = doc.data();
    const updatedTimeline = [
      ...(currentData.timeline || []),
      { status, timestamp: new Date().toISOString(), note: note || `Status updated to ${status}` }
    ];

    const updates = {
      status,
      timeline: updatedTimeline,
      updatedAt: new Date().toISOString()
    };
    if (assignedTeam) updates.assignedTeam = assignedTeam;

    await reportRef.update(updates);
    return res.json({ success: true, message: `Updated report ${id} status to ${status}` });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
