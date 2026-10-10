import express from 'express';
import { adminAuth, adminDb, verifyAuthToken, requireRole } from '../services/firebaseAdmin.js';

const router = express.Router();

// Verify Auth Token & Get User Profile
router.post('/verify', verifyAuthToken, async (req, res) => {
  try {
    const userRef = adminDb.collection('users').doc(req.user.uid);
    let userDoc = await userRef.get();

    if (!userDoc.exists) {
      // First time registration setup - PUBLIC REGISTRATION ALWAYS DEFAULTS TO CITIZEN
      const newProfile = {
        uid: req.user.uid,
        displayName: req.user.displayName || 'Citizen Contributor',
        email: req.user.email,
        role: 'CITIZEN',
        accountStatus: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await userRef.set(newProfile);
      userDoc = await userRef.get();
    }

    return res.json({
      success: true,
      user: userDoc.data()
    });
  } catch (error) {
    console.error('[Auth Route Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Admin-only Endpoint to assign operational roles (FIELD_OPERATOR, ROAD_DEPARTMENT)
router.post('/admin-set-role', verifyAuthToken, requireRole(['ROAD_DEPARTMENT']), async (req, res) => {
  const { targetUid, newRole } = req.body;
  if (!targetUid || !['CITIZEN', 'FIELD_OPERATOR', 'ROAD_DEPARTMENT'].includes(newRole)) {
    return res.status(400).json({ success: false, error: 'Invalid targetUid or role parameters' });
  }

  try {
    const targetRef = adminDb.collection('users').doc(targetUid);
    await targetRef.update({
      role: newRole,
      updatedAt: new Date().toISOString()
    });

    return res.json({ success: true, message: `Updated user ${targetUid} role to ${newRole}` });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
