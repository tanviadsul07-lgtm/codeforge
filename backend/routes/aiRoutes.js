import express from 'express';
import { verifyAuthToken, requireRole, adminDb } from '../services/firebaseAdmin.js';
import { runRoadAnalysis } from '../services/cvEngine.js';

const router = express.Router();

// Trigger Video Computer Vision Inference Pass
router.post('/video-analysis', verifyAuthToken, requireRole(['FIELD_OPERATOR', 'ROAD_DEPARTMENT']), async (req, res) => {
  const { videoUrl, gpsTrajectoryData, roadName, area } = req.body;

  try {
    const jobId = `SUR-2026-${Date.now().toString().slice(-4)}`;
    
    // Create initial Job in Firestore
    const surveyJob = {
      id: jobId,
      name: `AI Inspection - ${roadName || 'Carriageway'}`,
      roadName: roadName || 'Central Corridor',
      area: area || 'Metropolitan Zone',
      date: new Date().toISOString().split('T')[0],
      videoFile: videoUrl || 'dashcam_survey_stream.mp4',
      videoSize: '420 MB',
      gpsFile: 'gps_logs.gpx',
      gpsStatus: gpsTrajectoryData && gpsTrajectoryData.length ? `Valid (${gpsTrajectoryData.length} Trackpoints)` : 'Valid Trajectory',
      processingStatus: 'PROCESSING',
      progressPercent: 25,
      hazardCount: 0,
      createdAt: new Date().toISOString()
    };

    await adminDb.collection('surveys').doc(jobId).set(surveyJob);

    // Run Asynchronous AI Inference Pass
    runRoadAnalysis(videoUrl, gpsTrajectoryData).then(async (result) => {
      // Save Detections into hazards collection
      const hazardsBatch = adminDb.batch();
      result.detections.forEach(det => {
        const hazardRef = adminDb.collection('hazards').doc(det.id);
        hazardsBatch.set(hazardRef, {
          hazardId: det.id,
          sessionId: jobId,
          category: det.category,
          severity: det.severity,
          confidence: det.confidence,
          videoTimestamp: det.videoTimestamp,
          boundingBox: det.boundingBox,
          latitude: det.latitude,
          longitude: det.longitude,
          address: surveyJob.roadName,
          verificationStatus: 'Pending Verification',
          evidenceImage: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
          description: det.description,
          createdAt: new Date().toISOString()
        });
      });
      await hazardsBatch.commit();

      // Update survey job document
      await adminDb.collection('surveys').doc(jobId).update({
        processingStatus: 'COMPLETED',
        progressPercent: 100,
        hazardCount: result.detections.length,
        updatedAt: new Date().toISOString()
      });
    }).catch(err => {
      console.error('[AI Processing Task Failed]', err);
      adminDb.collection('surveys').doc(jobId).update({
        processingStatus: 'FAILED',
        error: err.message
      });
    });

    return res.status(202).json({
      success: true,
      message: 'AI video analysis job queued',
      jobId,
      status: 'PROCESSING'
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Get Video Analysis Status
router.get('/video-analysis/:jobId', verifyAuthToken, async (req, res) => {
  const { jobId } = req.params;
  try {
    const doc = await adminDb.collection('surveys').doc(jobId).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    const hazardsSnapshot = await adminDb.collection('hazards').where('sessionId', '==', jobId).get();
    const detections = hazardsSnapshot.docs.map(d => d.data());

    return res.json({
      success: true,
      job: doc.data(),
      detections
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
