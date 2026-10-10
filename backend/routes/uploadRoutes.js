import express from 'express';
import { verifyAuthToken } from '../services/firebaseAdmin.js';
import { generateUploadSignature } from '../services/cloudinaryAdmin.js';
import { adminDb } from '../services/firebaseAdmin.js';

const router = express.Router();

// Generate Cloudinary Signed Upload Signature (Auth Protected)
router.post('/signature', verifyAuthToken, (req, res) => {
  const { folder = 'road_reports' } = req.body;
  try {
    const signatureData = generateUploadSignature(folder);
    return res.json({
      success: true,
      ...signatureData
    });
  } catch (error) {
    console.error('[Upload Signature Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Register uploaded media asset in Firestore
router.post('/register', verifyAuthToken, async (req, res) => {
  const { cloudinaryPublicId, secureUrl, resourceType, format, sizeBytes, reportId } = req.body;

  if (!secureUrl || !cloudinaryPublicId) {
    return res.status(400).json({ success: false, error: 'Missing required media parameters' });
  }

  try {
    const assetId = `asset-${Date.now()}`;
    const mediaAsset = {
      assetId,
      ownerUid: req.user.uid,
      reportId: reportId || null,
      cloudinaryPublicId,
      secureUrl,
      resourceType: resourceType || 'image',
      format: format || 'jpg',
      sizeBytes: sizeBytes || 0,
      createdAt: new Date().toISOString()
    };

    await adminDb.collection('mediaAssets').doc(assetId).set(mediaAsset);

    return res.status(201).json({ success: true, mediaAsset });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
