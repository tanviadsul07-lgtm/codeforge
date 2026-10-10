import express from 'express';
import { adminDb, verifyAuthToken, requireRole } from '../services/firebaseAdmin.js';

const router = express.Router();

// Create Work Order (Department Officer only)
router.post('/', verifyAuthToken, requireRole(['ROAD_DEPARTMENT']), async (req, res) => {
  const { complaintId, department, team, officer, priority, targetDate, instructions } = req.body;

  if (!complaintId) {
    return res.status(400).json({ success: false, error: 'complaintId is required' });
  }

  try {
    const woRef = adminDb.collection('workOrders');
    const snapshot = await woRef.get();
    const count = snapshot.size + 1;
    const workOrderId = `WO-2026-0${count.toString().padStart(2, '0')}`;

    const newWO = {
      workOrderId,
      complaintId,
      assignedDepartment: department || 'PWD Maintenance Division 4',
      assignedTeam: team || 'Rapid Asphalt Repair Unit A',
      officerInCharge: officer || req.user.displayName,
      priority: priority || 'High',
      status: 'In Progress',
      progress: 10,
      targetCompletionDate: targetDate || '2026-10-15',
      workInstructions: instructions || 'Conduct road defect repair.',
      activityTimeline: [
        { date: new Date().toISOString(), text: `Work order created by ${req.user.displayName}.` }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await woRef.doc(workOrderId).set(newWO);

    // Update parent report
    const reportRef = adminDb.collection('roadReports').doc(complaintId);
    await reportRef.update({
      status: 'Assigned',
      workOrderId,
      assignedTeam: newWO.assignedTeam,
      updatedAt: new Date().toISOString()
    });

    return res.status(201).json({ success: true, workOrder: newWO });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// List Work Orders
router.get('/', verifyAuthToken, async (req, res) => {
  try {
    const snapshot = await adminDb.collection('workOrders').get();
    const workOrders = snapshot.docs.map(doc => doc.data());
    return res.json({ success: true, workOrders });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Update Work Order Progress
router.patch('/:id', verifyAuthToken, requireRole(['ROAD_DEPARTMENT', 'FIELD_OPERATOR']), async (req, res) => {
  const { id } = req.params;
  const { progress, status, note } = req.body;

  try {
    const woRef = adminDb.collection('workOrders').doc(id);
    const doc = await woRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Work order not found' });
    }

    const currentWO = doc.data();
    const isFinished = progress >= 100 || status === 'Completed';
    const finalStatus = isFinished ? 'Completed' : status || currentWO.status;

    const updatedTimeline = [
      ...(currentWO.activityTimeline || []),
      { date: new Date().toISOString(), text: note || `Progress updated to ${progress}% (${finalStatus})` }
    ];

    await woRef.update({
      progress: Math.min(100, progress),
      status: finalStatus,
      activityTimeline: updatedTimeline,
      completedAt: isFinished ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    });

    if (isFinished && currentWO.complaintId) {
      await adminDb.collection('roadReports').doc(currentWO.complaintId).update({
        status: 'Resolved',
        updatedAt: new Date().toISOString()
      });
    }

    return res.json({ success: true, message: `Work order ${id} updated` });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
