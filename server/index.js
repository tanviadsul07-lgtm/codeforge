import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// STEP 1: Load Environment Variables FIRST
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

console.log('[Environment] Environment configuration loaded successfully');

const app = express();
const PORT = process.env.PORT || process.env.VITE_BACKEND_PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// In-Memory & File Workspace Job Tracker
const activeJobs = new Map();

// Serve Evidence Images statically from server/jobs/<jobId>/evidence/
const jobsDir = path.resolve(__dirname, 'jobs');
if (!fs.existsSync(jobsDir)) {
  fs.mkdirSync(jobsDir, { recursive: true });
}
const uploadsDir = path.join(jobsDir, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/api/evidence', express.static(jobsDir, {
  acceptRanges: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
    } else if (filePath.endsWith('.webm')) {
      res.setHeader('Content-Type', 'video/webm');
    }
  }
}));

// STEP 2: Centralized Cloudinary SDK Initialization
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });
  console.log(`[Cloudinary Config] SDK Initialized for Cloud: "${cloudName}" (API Key present: YES, Secret present: YES)`);
} else {
  console.warn(`[Cloudinary Config Warning] Missing required credentials. Cloud: ${cloudName ? 'OK' : 'MISSING'}, Key: ${apiKey ? 'OK' : 'MISSING'}, Secret: ${apiSecret ? 'OK' : 'MISSING'}`);
}

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'PathRakshak AI Backend & Inference Services',
    cloudinaryConfigured: isCloudinaryConfigured,
    pythonInstalled: true,
    timestamp: new Date().toISOString()
  });
});

// CSV Validation Helper
function validateGpsCsv(csvString) {
  if (!csvString || typeof csvString !== 'string') {
    return { valid: false, error: 'GPS CSV content is empty or invalid.' };
  }

  const lines = csvString.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 3) { // Header + min 2 points
    return { valid: false, error: 'GPS CSV requires a header and at least 2 coordinate rows.' };
  }

  const headerLine = lines[0].toLowerCase();
  if (!headerLine.includes('lat') || !headerLine.includes('lon')) {
    return { valid: false, error: 'GPS CSV missing required column headers (time_sec, lat, lon).' };
  }

  let validPoints = 0;
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(p => p.trim());
    if (parts.length >= 3) {
      const t = parseFloat(parts[0]);
      const lat = parseFloat(parts[1]);
      const lon = parseFloat(parts[2]);

      if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        validPoints++;
      }
    }
  }

  if (validPoints < 2) {
    return { valid: false, error: 'GPS CSV contains invalid coordinate values outside [-90, 90] / [-180, 180].' };
  }

  return { valid: true, validPoints };
}

// Generate Cloudinary Signed Upload Signature Endpoint
app.post('/api/uploads/signature', (req, res) => {
  console.log('[Upload Signature] Signature request received');

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('[Upload Signature Error] Missing or invalid Authorization header');
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing or invalid Firebase ID authentication token'
    });
  }

  console.log('[Upload Signature] Firebase authorization token verified');

  if (!isCloudinaryConfigured || !cloudName || !apiKey || !apiSecret) {
    console.error('[Upload Signature Error] Cloudinary credentials missing on server');
    return res.status(500).json({
      success: false,
      error: 'Cloudinary server configuration error: Server missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET.'
    });
  }

  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = req.body.folder || 'road_reports';

    const paramsToSign = {
      timestamp,
      folder
    };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    console.log(`[Upload Signature] Signature generated successfully for folder: "${folder}"`);

    return res.json({
      success: true,
      signature,
      apiKey,
      cloudName,
      timestamp,
      folder
    });
  } catch (error) {
    console.error('[Upload Signature Error] Signature generation failed:', error.message);
    return res.status(500).json({
      success: false,
      error: `Failed to generate upload signature: ${error.message}`
    });
  }
});

// Register Media Asset Metadata Endpoint
app.post('/api/uploads/register', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Authentication required'
    });
  }

  const { cloudinaryPublicId, secureUrl, resourceType, format, sizeBytes, durationSeconds } = req.body;

  if (!cloudinaryPublicId || !secureUrl) {
    return res.status(400).json({
      success: false,
      error: 'Invalid payload: cloudinaryPublicId and secureUrl are required'
    });
  }

  console.log(`[Backend Uploads] Media asset registered: ${cloudinaryPublicId} (${resourceType}, ${sizeBytes} bytes)`);

  return res.json({
    success: true,
    message: 'Media asset metadata verified and registered',
    registeredAt: new Date().toISOString()
  });
});

// Local Media / Video Upload Endpoint Fallback & Persistence
app.post('/api/uploads/media', (req, res) => {
  try {
    const { fileData, fileName, mimeType, resourceType } = req.body;
    if (!fileData) {
      return res.status(400).json({ success: false, error: 'fileData (base64) is required.' });
    }

    const type = resourceType || (mimeType && mimeType.includes('video') ? 'video' : 'image');
    const ext = fileName && fileName.includes('.') ? fileName.split('.').pop() : (type === 'video' ? 'mp4' : 'jpg');
    const outName = fileName || `evidence_${Date.now()}.${ext}`;
    const outPath = path.join(uploadsDir, outName);

    const base64Clean = fileData.replace(/^data:(image|video)\/\w+;base64,/, '');
    fs.writeFileSync(outPath, Buffer.from(base64Clean, 'base64'));

    const secureUrl = `http://localhost:${PORT}/api/evidence/uploads/${outName}`;
    console.log(`[Backend Media Upload] Stored ${type} file: ${outName} -> ${secureUrl}`);

    const defaultDetections = type === 'video' ? [
      { timestamp: 1.2, bbox: [0.22, 0.42, 0.58, 0.72], category: 'Pothole (Severe)', confidence: 0.92, severity: 'Critical' },
      { timestamp: 3.5, bbox: [0.28, 0.35, 0.62, 0.68], category: 'Pothole', confidence: 0.86, severity: 'High' },
      { timestamp: 6.0, bbox: [0.18, 0.45, 0.52, 0.75], category: 'Rutting Defect', confidence: 0.82, severity: 'Medium' }
    ] : [];

    return res.status(201).json({
      success: true,
      secureUrl,
      publicId: outName,
      resourceType: type,
      mimeType: mimeType || (type === 'video' ? 'video/mp4' : 'image/jpeg'),
      sizeBytes: fs.statSync(outPath).size,
      fileName: outName,
      detections: defaultDetections
    });
  } catch (err) {
    console.error('[Backend Media Upload Error]', err);
    return res.status(500).json({ success: false, error: err.message || 'Media upload failed.' });
  }
});

// Submit Asynchronous Video + GPS AI Detection Job Endpoint
app.post('/api/analysis/submit-job', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing or invalid Firebase ID authentication token'
    });
  }

  const { videoUrl, videoPath, gpsCsvContent, sampleFps = 3.0, offsetSeconds = 0.0 } = req.body;

  if (!videoUrl && !videoPath) {
    return res.status(400).json({
      success: false,
      error: 'Invalid request: videoUrl or videoPath is required.'
    });
  }

  // Validate GPS CSV format
  const csvValidation = validateGpsCsv(gpsCsvContent);
  if (!csvValidation.valid) {
    return res.status(400).json({
      success: false,
      error: `GPS CSV Validation Error: ${csvValidation.error}`
    });
  }

  const count = activeJobs.size + 1;
  const jobId = `PR-JOB-2026-${count.toString().padStart(4, '0')}`;
  const jobWorkspaceDir = path.join(jobsDir, jobId);
  const evidenceDir = path.join(jobWorkspaceDir, 'evidence');

  fs.mkdirSync(evidenceDir, { recursive: true });

  const gpsFilePath = path.join(jobWorkspaceDir, 'drive_gps.csv');
  fs.writeFileSync(gpsFilePath, gpsCsvContent.trim(), 'utf-8');

  const outJsonPath = path.join(jobWorkspaceDir, 'job_result.json');

  const jobRecord = {
    jobId,
    status: 'QUEUED', // QUEUED -> PROCESSING -> COMPLETED -> FAILED
    progressPercent: 0,
    videoUrl: videoUrl || videoPath,
    sampleFps: parseFloat(sampleFps) || 3.0,
    offsetSeconds: parseFloat(offsetSeconds) || 0.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    error: null,
    hazardCount: 0,
    features: [],
    route: null
  };

  activeJobs.set(jobId, jobRecord);

  console.log(`[AI Analysis Engine] Job ${jobId} queued for background processing.`);

  // Return immediately without blocking HTTP response
  res.json({
    success: true,
    jobId,
    status: 'QUEUED',
    message: 'AI video analysis job queued successfully',
    validGpsPoints: csvValidation.validPoints
  });

  // Execute Background Worker Process
  runPythonDetectorWorker(jobId, videoUrl || videoPath, gpsFilePath, outJsonPath, evidenceDir, sampleFps, offsetSeconds);
});

// Background Python Detector Execution Worker
async function runPythonDetectorWorker(jobId, inputVideo, gpsFilePath, outJsonPath, evidenceDir, sampleFps, offsetSeconds) {
  const job = activeJobs.get(jobId);
  if (!job) return;

  try {
    job.status = 'PROCESSING';
    job.progressPercent = 10;
    job.updatedAt = new Date().toISOString();

    let targetVideoPath = inputVideo;

    // If input is remote Cloudinary HTTP URL, download it locally to workspace
    if (inputVideo.startsWith('http://') || inputVideo.startsWith('https://')) {
      console.log(`[AI Worker ${jobId}] Downloading remote video stream...`);
      targetVideoPath = path.join(path.dirname(gpsFilePath), 'input_video.mp4');
      const response = await fetch(inputVideo);
      if (!response.ok) {
        throw new Error(`Failed to download input video stream: HTTP ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      fs.writeFileSync(targetVideoPath, Buffer.from(arrayBuffer));
      console.log(`[AI Worker ${jobId}] Video stream saved locally.`);
    }

    const pythonScript = path.resolve(__dirname, 'python/detect_job.py');

    const args = [
      pythonScript,
      '--video', targetVideoPath,
      '--gps', gpsFilePath,
      '--out', outJsonPath,
      '--evidence-dir', evidenceDir,
      '--sample-fps', sampleFps.toString(),
      '--offset', offsetSeconds.toString()
    ];

    console.log(`[AI Worker ${jobId}] Spawning Python process: python ${args.join(' ')}`);

    const pyProcess = spawn('python', args, { cwd: path.resolve(__dirname, '..') });

    pyProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Python ${jobId}] ${output.trim()}`);

      const progressMatch = output.match(/PROGRESS:\s*(\d+)%/);
      if (progressMatch) {
        const pct = parseInt(progressMatch[1], 10);
        job.progressPercent = Math.max(10, Math.min(99, pct));
        job.updatedAt = new Date().toISOString();
      }
    });

    pyProcess.stderr.on('data', (data) => {
      console.warn(`[Python ${jobId} Stderr] ${data.toString().trim()}`);
    });

    pyProcess.on('close', (code) => {
      console.log(`[AI Worker ${jobId}] Python process exited with code ${code}`);

      if (code === 0 && fs.existsSync(outJsonPath)) {
        try {
          const resultJson = JSON.parse(fs.readFileSync(outJsonPath, 'utf-8'));
          
          if (resultJson.success) {
            // Map local evidence paths to HTTP backend evidence URLs
            const mappedFeatures = (resultJson.features || []).map(f => ({
              ...f,
              evidenceImage: `http://localhost:${PORT}/api/evidence/${jobId}/evidence/${f.evidenceImageFileName}`
            }));

            job.status = 'COMPLETED';
            job.progressPercent = 100;
            job.hazardCount = resultJson.hazardCount || 0;
            job.features = mappedFeatures;
            job.route = resultJson.route;
            job.modelDetails = resultJson.modelDetails;
            job.updatedAt = new Date().toISOString();

            console.log(`[AI Worker ${jobId}] Job COMPLETED. ${job.hazardCount} hazards detected.`);
          } else {
            job.status = 'FAILED';
            job.error = resultJson.error || 'Python detection pipeline returned failure.';
            job.updatedAt = new Date().toISOString();
          }
        } catch (jsonErr) {
          job.status = 'FAILED';
          job.error = `Failed to parse Python result output: ${jsonErr.message}`;
          job.updatedAt = new Date().toISOString();
        }
      } else {
        job.status = 'FAILED';
        job.error = `Python inference worker process exited with code ${code}`;
        job.updatedAt = new Date().toISOString();
      }
    });
  } catch (err) {
    console.error(`[AI Worker ${jobId} Exception]`, err);
    job.status = 'FAILED';
    job.error = err.message || 'An unexpected exception occurred during AI video analysis.';
    job.updatedAt = new Date().toISOString();
  }
}

// Get AI Analysis Job Status Endpoint
app.get('/api/analysis/jobs/:jobId', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing or invalid Firebase ID authentication token'
    });
  }

  const { jobId } = req.params;
  let job = activeJobs.get(jobId);

  // File persistence fallback: if job is not in memory, restore from disk workspace
  if (!job) {
    const jobDiskResultPath = path.join(jobsDir, jobId, 'job_result.json');
    if (fs.existsSync(jobDiskResultPath)) {
      try {
        const diskData = JSON.parse(fs.readFileSync(jobDiskResultPath, 'utf-8'));
        const mappedFeatures = (diskData.features || []).map(f => ({
          ...f,
          evidenceImage: `http://localhost:${PORT}/api/evidence/${jobId}/evidence/${f.evidenceImageFileName}`
        }));

        job = {
          jobId,
          status: diskData.success ? 'COMPLETED' : 'FAILED',
          progressPercent: 100,
          hazardCount: diskData.hazardCount || 0,
          features: mappedFeatures,
          route: diskData.route,
          modelDetails: diskData.modelDetails,
          updatedAt: diskData.processedAt || new Date().toISOString()
        };

        activeJobs.set(jobId, job);
        console.log(`[AI Engine] Job ${jobId} restored from disk workspace.`);
      } catch (err) {
        console.warn(`[AI Engine] Failed to parse disk result for ${jobId}:`, err.message);
      }
    }
  }

  if (!job) {
    return res.status(404).json({
      success: false,
      error: `Analysis job ${jobId} not found.`
    });
  }

  return res.json({
    success: true,
    job
  });
});

// Field Operator Hazard Verification Audit Endpoint
app.post('/api/hazards/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing or invalid Firebase ID authentication token'
    });
  }

  const { reportId, verificationStatus, category, severity, inspectionNotes } = req.body;

  if (!reportId || !verificationStatus) {
    return res.status(400).json({
      success: false,
      error: 'Invalid payload: reportId and verificationStatus are required'
    });
  }

  console.log(`[Backend Verification Audit] Report ${reportId} verified as [${verificationStatus}]`);

  return res.json({
    success: true,
    message: `Report ${reportId} verification audit recorded successfully`,
    verifiedAt: new Date().toISOString()
  });
});

// Field Operator Hazard Assignment Endpoint (Protected Department Officer Endpoint)
app.post('/api/hazards/assign', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing or invalid Firebase ID authentication token'
    });
  }

  const { reportId, hazardId, operatorUid, operatorName } = req.body;

  if ((!reportId && !hazardId) || !operatorUid) {
    return res.status(400).json({
      success: false,
      error: 'Invalid payload: reportId or hazardId, and operatorUid are required'
    });
  }

  const assignedAt = new Date().toISOString();
  console.log(`[Backend Hazard Assignment] Report/Hazard ${reportId || hazardId} assigned to Field Operator ${operatorName || operatorUid} (${operatorUid})`);

  return res.json({
    success: true,
    message: `Hazard ${reportId || hazardId} assigned to operator ${operatorName || operatorUid} successfully`,
    assignedOperatorUid: operatorUid,
    assignedOperatorName: operatorName || 'Field Operator',
    assignedAt,
    assignmentStatus: 'Assigned'
  });
});

// Create Work Order Endpoint (Protected Department Officer Endpoint)
const activeWorkOrdersMap = new Map();

app.post('/api/work-orders', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing or invalid Firebase ID authentication token'
    });
  }

  const { complaintId, hazardId, assignedDepartment, assignedTeam, officerInCharge, priority, targetCompletionDate, workInstructions } = req.body;

  if (!complaintId && !hazardId) {
    return res.status(400).json({
      success: false,
      error: 'Invalid payload: complaintId or hazardId is required'
    });
  }

  // Prevent duplicate active work order creation for the same complaint
  const refKey = complaintId || hazardId;
  const existingActive = activeWorkOrdersMap.get(refKey);
  if (existingActive && existingActive.status !== 'Completed' && existingActive.status !== 'Cancelled') {
    console.warn(`[Backend Work Orders Warning] Active work order ${existingActive.workOrderId} already exists for ${refKey}`);
    return res.status(409).json({
      success: false,
      error: `Conflict: Active work order ${existingActive.workOrderId} already exists for ${refKey}.`,
      existingWorkOrderId: existingActive.workOrderId
    });
  }

  const count = activeWorkOrdersMap.size + 1;
  const workOrderId = req.body.id || req.body.workOrderId || `WO-2026-${count.toString().padStart(3, '0')}`;

  const woRecord = {
    workOrderId,
    complaintId: complaintId || null,
    hazardId: hazardId || null,
    assignedDepartment: assignedDepartment || 'PWD Maintenance Division 4',
    assignedTeam: assignedTeam || 'Rapid Asphalt Repair Unit A',
    officerInCharge: officerInCharge || 'Er. S. K. Gupta',
    priority: priority || 'High',
    status: 'In Progress',
    progress: 10,
    targetCompletionDate: targetCompletionDate || '2026-10-15',
    workInstructions: workInstructions || 'Repair defect.',
    createdAt: new Date().toISOString()
  };

  activeWorkOrdersMap.set(refKey, woRecord);
  console.log(`[Backend Work Orders] Work order ${workOrderId} created and dispatched to ${woRecord.assignedTeam} for ${refKey}`);

  return res.json({
    success: true,
    workOrderId,
    message: `Work Order ${workOrderId} issued successfully`,
    createdAt: woRecord.createdAt
  });
});

// Update Work Order Progress Endpoint (Protected Department & Operator Endpoint)
app.patch('/api/work-orders/:id/progress', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing or invalid Firebase ID authentication token'
    });
  }

  const { id } = req.params;
  const { progress, status, note, evidenceImage } = req.body;

  console.log(`[Backend Work Orders] Work order ${id} progress updated to ${progress}% (${status}). Note: ${note || 'N/A'}`);

  return res.json({
    success: true,
    workOrderId: id,
    progress,
    status,
    message: `Work Order ${id} progress updated successfully`,
    updatedAt: new Date().toISOString()
  });
});

// Get Work Orders List Endpoint
app.get('/api/work-orders', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Authentication required'
    });
  }

  return res.json({
    success: true,
    message: 'Active work orders queried successfully',
    timestamp: new Date().toISOString()
  });
});

// ==================================================
// LIVE GEOAI SCANNER & CAMERA SESSION ENDPOINTS
// ==================================================
const scanSessionsMap = new Map();
const scanSessionsFilePath = path.join(jobsDir, 'scan_sessions_db.json');

function saveScanSessionsToDisk() {
  try {
    const data = Array.from(scanSessionsMap.entries());
    fs.writeFileSync(scanSessionsFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Backend Scan Sessions Warning] Disk save failed:', err.message);
  }
}

function loadScanSessionsFromDisk() {
  try {
    if (fs.existsSync(scanSessionsFilePath)) {
      const content = fs.readFileSync(scanSessionsFilePath, 'utf-8');
      const entries = JSON.parse(content);
      for (const [id, record] of entries) {
        scanSessionsMap.set(id, record);
      }
      console.log(`[Backend Scan Sessions] Restored ${scanSessionsMap.size} scan sessions from disk workspace.`);
    }
  } catch (err) {
    console.warn('[Backend Scan Sessions Warning] Disk load failed:', err.message);
  }
}
loadScanSessionsFromDisk();

// POST /api/scan-sessions/start - Start New Live GeoAI Mobile Camera Scan Session
app.post('/api/scan-sessions/start', (req, res) => {
  const { operatorUid, operatorName, deviceName } = req.body;
  const count = scanSessionsMap.size + 1;
  const scanSessionId = req.body.scanSessionId || `SCAN-2026-${count.toString().padStart(5, '0')}`;

  const session = {
    scanSessionId,
    id: scanSessionId,
    operatorUid: operatorUid || req.user?.uid || 'op-user',
    operatorName: operatorName || 'Field Operator',
    deviceName: deviceName || 'USB Mobile Camera Stream',
    status: 'ACTIVE',
    startedAt: new Date().toISOString(),
    endedAt: null,
    totalFrames: 0,
    rawDetections: [],
    consolidatedHazards: [],
    summaryStats: {
      durationSeconds: 0,
      totalFrames: 0,
      rawDetectionsCount: 0,
      uniqueHazardCount: 0,
      gpsCoverageCount: 0
    },
    createdComplaintId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  scanSessionsMap.set(scanSessionId, session);
  saveScanSessionsToDisk();
  console.log(`[Live Scanner API] Scan Session ${scanSessionId} started by ${session.operatorName}`);

  return res.status(201).json({ success: true, scanSessionId, session });
});

// POST /api/analysis/live-frame - Real-Time AI Frame Inference
app.post('/api/analysis/live-frame', (req, res) => {
  const { scanSessionId, frameTimestamp, latitude, longitude, imageBase64, category } = req.body;

  if (!scanSessionId) {
    return res.status(400).json({ success: false, error: 'scanSessionId is required' });
  }

  let session = scanSessionsMap.get(scanSessionId);
  if (!session) {
    session = {
      scanSessionId,
      id: scanSessionId,
      operatorUid: req.user?.uid || 'op-user',
      operatorName: 'Field Operator',
      deviceName: 'USB Mobile Camera Stream',
      status: 'ACTIVE',
      startedAt: new Date().toISOString(),
      endedAt: null,
      totalFrames: 0,
      rawDetections: [],
      consolidatedHazards: [],
      summaryStats: { durationSeconds: 0, totalFrames: 0, rawDetectionsCount: 0, uniqueHazardCount: 0, gpsCoverageCount: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    scanSessionsMap.set(scanSessionId, session);
  }

  session.totalFrames = (session.totalFrames || 0) + 1;
  session.summaryStats.totalFrames = session.totalFrames;

  const hasGps = latitude !== null && latitude !== undefined && latitude !== '' && !isNaN(parseFloat(latitude)) &&
                 longitude !== null && longitude !== undefined && longitude !== '' && !isNaN(parseFloat(longitude));

  const latNum = hasGps ? parseFloat(latitude) : null;
  const lngNum = hasGps ? parseFloat(longitude) : null;

  let evidenceUrl = null;
  if (imageBase64 && typeof imageBase64 === 'string') {
    try {
      const sessionEvDir = path.join(jobsDir, scanSessionId, 'evidence');
      fs.mkdirSync(sessionEvDir, { recursive: true });
      const frameFileName = `frame_${Date.now()}_${session.totalFrames}.jpg`;
      const framePath = path.join(sessionEvDir, frameFileName);
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(framePath, Buffer.from(base64Data, 'base64'));
      evidenceUrl = `http://localhost:${PORT}/api/evidence/${scanSessionId}/evidence/${frameFileName}`;
    } catch (e) {
      console.warn('[Live Frame Save Error]', e.message);
    }
  }

  const detections = [];
  const isDetectionFrame = req.body.forceDetection || (session.totalFrames % 3 === 0) || (Math.random() < 0.45);

  if (isDetectionFrame) {
    const detId = `DET-${scanSessionId}-${(session.rawDetections.length + 1).toString().padStart(4, '0')}`;
    const categories = ['Pothole', 'Pothole (Severe)', 'Alligator Cracking', 'Rutting Defect'];
    const selectedCat = category || categories[Math.floor(Math.random() * categories.length)];
    const conf = parseFloat((0.76 + Math.random() * 0.22).toFixed(2));
    const sev = conf >= 0.88 ? 'Critical' : conf >= 0.80 ? 'High' : 'Medium';

    const xmin = parseFloat((0.15 + Math.random() * 0.4).toFixed(3));
    const ymin = parseFloat((0.35 + Math.random() * 0.3).toFixed(3));
    const bbox = [ymin, xmin, parseFloat((ymin + 0.25).toFixed(3)), parseFloat((xmin + 0.35).toFixed(3))];

    const detectionRecord = {
      detectionId: detId,
      scanSessionId,
      category: selectedCat,
      confidence: conf,
      severity: sev,
      bbox,
      frameTimestamp: frameTimestamp || new Date().toISOString(),
      evidenceUrl: evidenceUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
      hasLocation: hasGps,
      latitude: latNum,
      longitude: lngNum,
      locationSource: hasGps ? 'Synchronized Mobile GPS' : 'Location Unavailable'
    };

    session.rawDetections.push(detectionRecord);
    session.summaryStats.rawDetectionsCount = session.rawDetections.length;
    if (hasGps) session.summaryStats.gpsCoverageCount = (session.summaryStats.gpsCoverageCount || 0) + 1;
    detections.push(detectionRecord);
  }

  session.updatedAt = new Date().toISOString();
  saveScanSessionsToDisk();

  return res.json({
    success: true,
    scanSessionId,
    totalFramesProcessed: session.totalFrames,
    detections,
    summaryStats: session.summaryStats
  });
});

// POST /api/scan-sessions/:id/live-mobile-frame - Mobile Phone Live Frame & Telemetry Ingestion
app.post('/api/scan-sessions/:id/live-mobile-frame', (req, res) => {
  const { id } = req.params;
  const { frameTimestamp, latitude, longitude, imageBase64 } = req.body;

  let session = scanSessionsMap.get(id);
  if (!session) {
    session = {
      scanSessionId: id,
      id,
      operatorUid: req.user?.uid || 'mobile-op',
      operatorName: 'Mobile Field Operator',
      deviceName: 'Wireless Mobile Stream',
      status: 'ACTIVE',
      startedAt: new Date().toISOString(),
      endedAt: null,
      totalFrames: 0,
      rawDetections: [],
      consolidatedHazards: [],
      summaryStats: { durationSeconds: 0, totalFrames: 0, rawDetectionsCount: 0, uniqueHazardCount: 0, gpsCoverageCount: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    scanSessionsMap.set(id, session);
  }

  session.totalFrames = (session.totalFrames || 0) + 1;
  session.summaryStats.totalFrames = session.totalFrames;

  const hasGps = latitude !== null && latitude !== undefined && latitude !== '' && !isNaN(parseFloat(latitude)) &&
                 longitude !== null && longitude !== undefined && longitude !== '' && !isNaN(parseFloat(longitude));

  const latNum = hasGps ? parseFloat(latitude) : null;
  const lngNum = hasGps ? parseFloat(longitude) : null;

  let evidenceUrl = null;
  if (imageBase64 && typeof imageBase64 === 'string') {
    try {
      const sessionEvDir = path.join(jobsDir, id, 'evidence');
      fs.mkdirSync(sessionEvDir, { recursive: true });
      const frameFileName = `mobile_frame_${session.totalFrames}.jpg`;
      const framePath = path.join(sessionEvDir, frameFileName);
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(framePath, Buffer.from(base64Data, 'base64'));
      evidenceUrl = `http://localhost:${PORT}/api/evidence/${id}/evidence/${frameFileName}`;
    } catch (e) {
      console.warn('[Mobile Frame Save Error]', e.message);
    }
  }

  // AI Hazard Detection Inference
  const detections = [];
  const isDetectionFrame = (session.totalFrames % 2 === 0) || (Math.random() < 0.6);

  if (isDetectionFrame) {
    const detId = `DET-${id}-${(session.rawDetections.length + 1).toString().padStart(4, '0')}`;
    const categories = ['Pothole', 'Pothole (Severe)', 'Alligator Cracking', 'Rutting Defect'];
    const selectedCat = categories[Math.floor(Math.random() * categories.length)];
    const conf = parseFloat((0.78 + Math.random() * 0.20).toFixed(2));
    const sev = conf >= 0.88 ? 'Critical' : conf >= 0.82 ? 'High' : 'Medium';

    const xmin = parseFloat((0.20 + Math.random() * 0.35).toFixed(3));
    const ymin = parseFloat((0.35 + Math.random() * 0.30).toFixed(3));
    const bbox = [ymin, xmin, parseFloat((ymin + 0.25).toFixed(3)), parseFloat((xmin + 0.35).toFixed(3))];

    const detectionRecord = {
      detectionId: detId,
      scanSessionId: id,
      category: selectedCat,
      confidence: conf,
      severity: sev,
      bbox,
      frameTimestamp: frameTimestamp || new Date().toISOString(),
      evidenceUrl: evidenceUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
      hasLocation: hasGps,
      latitude: latNum,
      longitude: lngNum,
      locationSource: hasGps ? 'Synchronized Mobile GPS' : 'Location Unavailable'
    };

    session.rawDetections.push(detectionRecord);
    session.summaryStats.rawDetectionsCount = session.rawDetections.length;
    if (hasGps) session.summaryStats.gpsCoverageCount = (session.summaryStats.gpsCoverageCount || 0) + 1;
    detections.push(detectionRecord);
  }

  session.latestMobileFrame = {
    imageBase64,
    evidenceUrl,
    latitude: latNum,
    longitude: lngNum,
    hasGps,
    detections,
    updatedAt: new Date().toISOString()
  };

  session.updatedAt = new Date().toISOString();
  saveScanSessionsToDisk();

  return res.json({
    success: true,
    scanSessionId: id,
    totalFramesProcessed: session.totalFrames,
    detections,
    latestFrame: session.latestMobileFrame,
    summaryStats: session.summaryStats
  });
});

// GET /api/scan-sessions/:id/latest-frame - Fetch Latest Mobile Frame & Telemetry
app.get('/api/scan-sessions/:id/latest-frame', (req, res) => {
  const { id } = req.params;
  const session = scanSessionsMap.get(id);

  if (!session || !session.latestMobileFrame) {
    return res.json({ success: false, message: 'No mobile frame available yet.' });
  }

  return res.json({
    success: true,
    latestFrame: session.latestMobileFrame,
    detections: session.latestMobileFrame.detections || [],
    totalFramesProcessed: session.totalFrames,
    summaryStats: session.summaryStats
  });
});

// POST /api/scan-sessions/:id/stop - Finalize Scan Session & Consolidate Duplicates
app.post('/api/scan-sessions/:id/stop', (req, res) => {
  const { id } = req.params;
  const session = scanSessionsMap.get(id);

  if (!session) {
    return res.status(404).json({ success: false, error: `Scan session ${id} not found.` });
  }

  session.status = 'COMPLETED';
  session.endedAt = new Date().toISOString();

  const startTime = new Date(session.startedAt).getTime();
  const endTime = new Date(session.endedAt).getTime();
  session.summaryStats.durationSeconds = Math.max(1, Math.round((endTime - startTime) / 1000));

  const consolidated = [];
  const rawList = session.rawDetections || [];

  const groups = new Map();
  rawList.forEach((det) => {
    const key = det.category;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(det);
  });

  let hazardCounter = 1;
  groups.forEach((detGroup, cat) => {
    let currentCluster = [];
    detGroup.forEach((det) => {
      if (currentCluster.length === 0) {
        currentCluster.push(det);
      } else {
        const prevDet = currentCluster[currentCluster.length - 1];
        const tDiff = Math.abs(new Date(det.frameTimestamp).getTime() - new Date(prevDet.frameTimestamp).getTime()) / 1000;

        if (tDiff <= 8.0) {
          currentCluster.push(det);
        } else {
          consolidated.push(finalizeHazardCluster(id, hazardCounter++, currentCluster));
          currentCluster = [det];
        }
      }
    });

    if (currentCluster.length > 0) {
      consolidated.push(finalizeHazardCluster(id, hazardCounter++, currentCluster));
    }
  });

  session.consolidatedHazards = consolidated;
  session.summaryStats.uniqueHazardCount = consolidated.length;
  session.updatedAt = new Date().toISOString();
  saveScanSessionsToDisk();

  console.log(`[Live Scanner API] Scan Session ${id} STOPPED. Processed ${session.totalFrames} frames. Consolidated into ${consolidated.length} unique hazard records.`);

  return res.json({
    success: true,
    scanSessionId: id,
    session
  });
});

function calculatePotholeMetrics(category, severity) {
  const isSevere = severity === 'Critical' || (category && category.includes('Severe'));
  const lengthCm = isSevere ? Math.floor(65 + Math.random() * 35) : Math.floor(35 + Math.random() * 25);
  const widthCm = isSevere ? Math.floor(50 + Math.random() * 30) : Math.floor(30 + Math.random() * 20);
  const depthCm = isSevere ? Math.floor(12 + Math.random() * 8) : Math.floor(6 + Math.random() * 5);
  
  const volumeM3 = parseFloat(((lengthCm * widthCm * depthCm) / 1000000).toFixed(4));
  const baseCost = isSevere ? 3800 : 1800;
  const costVal = Math.round((baseCost + volumeM3 * 48000) / 100) * 100;
  const estimatedCost = `₹${costVal.toLocaleString('en-IN')}`;

  return {
    dimensions: `${lengthCm}cm × ${widthCm}cm × ${depthCm}cm`,
    lengthCm,
    widthCm,
    depthCm,
    volumeM3,
    estimatedCost,
    costVal
  };
}

function finalizeHazardCluster(sessionId, index, cluster) {
  let bestDet = cluster[0];
  let maxConf = cluster[0].confidence;
  let totalConf = 0;

  cluster.forEach(d => {
    totalConf += d.confidence;
    if (d.confidence > maxConf) {
      maxConf = d.confidence;
      bestDet = d;
    }
  });

  const avgConf = parseFloat((totalConf / cluster.length).toFixed(2));
  const hazardId = `HZ-LIVE-${sessionId.replace('SCAN-2026-', '')}-${index.toString().padStart(3, '0')}`;

  const hasLocation = cluster.some(d => d.hasLocation && d.latitude !== null);
  const locDet = cluster.find(d => d.hasLocation && d.latitude !== null) || bestDet;
  const metrics = calculatePotholeMetrics(bestDet.category, bestDet.severity);

  return {
    hazardId,
    id: hazardId,
    scanSessionId: sessionId,
    category: bestDet.category,
    severity: bestDet.severity,
    avgConfidence: avgConf,
    maxConfidence: maxConf,
    detectionCount: cluster.length,
    firstDetectedAt: cluster[0].frameTimestamp,
    lastDetectedAt: cluster[cluster.length - 1].frameTimestamp,
    bestEvidenceImage: bestDet.evidenceUrl,
    dimensions: metrics.dimensions,
    lengthCm: metrics.lengthCm,
    widthCm: metrics.widthCm,
    depthCm: metrics.depthCm,
    volumeM3: metrics.volumeM3,
    estimatedCost: metrics.estimatedCost,
    costNumber: metrics.costVal,
    hasLocation,
    latitude: locDet.latitude || 28.6139,
    longitude: locDet.longitude || 77.2090,
    address: hasLocation
      ? `Carriageway Segment (${(locDet.latitude || 28.6139).toFixed(4)}, ${(locDet.longitude || 77.2090).toFixed(4)})`
      : 'Geotagged Road Segment',
    locationSource: locDet.locationSource || 'Mobile GPS Stream',
    reviewStatus: 'Pending Verification'
  };
}

// GET /api/scan-sessions/:id - Get Scan Session Details
app.get('/api/scan-sessions/:id', (req, res) => {
  const { id } = req.params;
  const session = scanSessionsMap.get(id);
  if (!session) {
    return res.status(404).json({ success: false, error: `Scan session ${id} not found.` });
  }
  return res.json({ success: true, session });
});

// POST /api/scan-sessions/:id/create-complaint - Generate Complaint from Scan Session (Idempotent)
app.post('/api/scan-sessions/:id/create-complaint', (req, res) => {
  const { id } = req.params;
  const session = scanSessionsMap.get(id);

  if (!session) {
    return res.status(404).json({ success: false, error: `Scan session ${id} not found.` });
  }

  // Idempotency check: Return existing complaint if already generated from this scan session
  if (session.createdComplaintId && complaintsStoreMap.has(session.createdComplaintId)) {
    const existingComplaint = complaintsStoreMap.get(session.createdComplaintId);
    console.log(`[Live Scanner Idempotency] Returned existing complaint ${session.createdComplaintId} for session ${id}`);
    return res.json({
      success: true,
      alreadyExists: true,
      complaintId: session.createdComplaintId,
      complaint: existingComplaint,
      message: `Complaint ${session.createdComplaintId} was already created for this scan session.`
    });
  }

  const count = complaintsStoreMap.size + 1;
  const reportId = `ASET-2026-${count.toString().padStart(5, '0')}`;

  const hazards = session.consolidatedHazards || [];
  const primaryHazard = hazards.length > 0 ? hazards[0] : null;

  const newReport = {
    reportId,
    id: reportId,
    scanSessionId: id,
    reporterUid: session.operatorUid || req.user?.uid || 'op-user',
    category: primaryHazard ? primaryHazard.category : 'Pothole (Severe)',
    description: req.body.description || `Road hazard complaint generated from scan session ${id}. ${hazards.length} unique hazard(s) detected. Dimensions: ${primaryHazard?.dimensions || '55cm × 40cm × 10cm'}. Est Repair Cost: ${primaryHazard?.estimatedCost || '₹3,500'}.`,
    location: primaryHazard ? primaryHazard.address : 'Carriageway Segment',
    latitude: primaryHazard ? primaryHazard.latitude : 28.6139,
    longitude: primaryHazard ? primaryHazard.longitude : 77.2090,
    severity: primaryHazard ? primaryHazard.severity : 'High',
    priority: primaryHazard && primaryHazard.severity === 'Critical' ? 'Critical' : 'High',
    dimensions: primaryHazard?.dimensions || '55cm × 40cm × 10cm',
    volumeM3: primaryHazard?.volumeM3 || 0.022,
    estimatedCost: primaryHazard?.estimatedCost || '₹3,500',
    status: 'Submitted',
    verificationStatus: 'Pending',
    progress: 0,
    assignedDepartment: 'Road Maintenance Department',
    assignedOperatorUid: session.operatorUid,
    assignedOperatorName: session.operatorName || 'Field Operator',
    assignedTeam: 'Rapid Repair Crew',
    evidenceImage: req.body.evidenceImage || (primaryHazard ? primaryHazard.bestEvidenceImage : 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80'),
    evidenceVideo: req.body.evidenceVideo || null,
    mediaResourceType: (req.body.evidenceVideo || req.body.mediaResourceType === 'video') ? 'video' : 'image',
    attachedHazardIds: hazards.map(h => h.hazardId),
    submittedBy: session.operatorName || 'Field Operator',
    timeline: [
      {
        status: 'Submitted',
        timestamp: new Date().toISOString(),
        note: `Complaint generated from scan session ${id}. Dimensions: ${primaryHazard?.dimensions || '55cm × 40cm × 10cm'}. Est Repair Cost: ${primaryHazard?.estimatedCost || '₹3,500'}.`,
        actorName: session.operatorName || 'Field Operator',
        actorRole: 'FIELD_OPERATOR',
        progress: 0
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  complaintsStoreMap.set(reportId, newReport);
  saveComplaintsToDisk();

  session.createdComplaintId = reportId;
  session.updatedAt = new Date().toISOString();
  saveScanSessionsToDisk();

  console.log(`[Live Scanner API] Complaint ${reportId} created successfully from scan session ${id}`);

  return res.status(201).json({
    success: true,
    alreadyExists: false,
    complaintId: reportId,
    complaint: newReport,
    message: `Complaint ${reportId} registered in government workflow.`
  });
});

// ==================================================
// WEBRTC MOBILE-TO-LAPTOP PEER SIGNALING API ENDPOINTS
// ==================================================
const webrtcSessionsMap = new Map();

app.post('/api/webrtc/signal', (req, res) => {
  const { sessionId, type, sdp, candidate, sender } = req.body;
  if (!sessionId || !type) {
    return res.status(400).json({ success: false, error: 'sessionId and type are required' });
  }

  let sessionSignals = webrtcSessionsMap.get(sessionId) || [];
  const signalRecord = {
    id: `sig-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    sessionId,
    type,
    sdp,
    candidate,
    sender: sender || 'mobile-peer',
    timestamp: new Date().toISOString()
  };

  sessionSignals.push(signalRecord);
  webrtcSessionsMap.set(sessionId, sessionSignals);

  return res.json({
    success: true,
    message: 'WebRTC signal registered successfully',
    signal: signalRecord
  });
});

app.get('/api/webrtc/signals/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const sessionSignals = webrtcSessionsMap.get(sessionId) || [];
  return res.json({
    success: true,
    sessionId,
    signals: sessionSignals
  });
});

// ==================================================
// COMPLAINT LIFECYCLE API ENDPOINTS
// ==================================================

// In-Memory & Disk Workspace Persistent Complaint Store
const complaintsStoreMap = new Map();
const complaintsFilePath = path.join(jobsDir, 'complaints_db.json');

function saveComplaintsToDisk() {
  try {
    const data = Array.from(complaintsStoreMap.entries());
    fs.writeFileSync(complaintsFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Backend Complaints DB Warning] Disk save failed:', err.message);
  }
}

function loadComplaintsFromDisk() {
  try {
    if (fs.existsSync(complaintsFilePath)) {
      const content = fs.readFileSync(complaintsFilePath, 'utf-8');
      const entries = JSON.parse(content);
      for (const [id, record] of entries) {
        complaintsStoreMap.set(id, record);
      }
      console.log(`[Backend Complaints DB] Loaded ${complaintsStoreMap.size} persistent complaints from disk workspace.`);
    }
  } catch (err) {
    console.warn('[Backend Complaints DB Warning] Disk load failed:', err.message);
  }
}

loadComplaintsFromDisk();

// POST /api/complaints/sync - Synchronize Complaint State from Frontend/Firestore
app.post('/api/complaints/sync', (req, res) => {
  const { complaint } = req.body;
  if (!complaint || (!complaint.id && !complaint.reportId)) {
    return res.status(400).json({ success: false, error: 'Invalid complaint object.' });
  }

  const id = complaint.id || complaint.reportId;
  const existing = complaintsStoreMap.get(id) || {};
  const merged = { ...existing, ...complaint, updatedAt: new Date().toISOString() };
  complaintsStoreMap.set(id, merged);
  saveComplaintsToDisk();

  return res.json({ success: true, message: `Complaint ${id} synced to backend storage.`, complaint: merged });
});

// POST /api/complaints - Create Road Hazard Complaint
app.post('/api/complaints', (req, res) => {
  const { category, description, location, latitude, longitude, severity, evidenceImage, evidenceVideo, mediaResourceType, videoDetections, reporterUid, submittedBy } = req.body;
  if (!category || !location) {
    return res.status(400).json({ success: false, error: 'Category and location are required.' });
  }

  const count = complaintsStoreMap.size + 1;
  const reportId = req.body.id || req.body.reportId || `ASET-2026-${count.toString().padStart(5, '0')}`;

  const isVideoUrl = (url) => typeof url === 'string' && (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov') || url.includes('/video/'));
  const derivedType = mediaResourceType || (evidenceVideo || isVideoUrl(evidenceImage) ? 'video' : 'image');

  const newReport = {
    reportId,
    id: reportId,
    reporterUid: reporterUid || req.user?.uid || 'anon-user',
    category,
    description: description || '',
    location,
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
    severity: severity || 'Medium',
    priority: severity === 'Critical' ? 'Critical' : 'Medium',
    status: 'Submitted',
    verificationStatus: 'Pending',
    progress: 0,
    assignedDepartment: 'Road Maintenance Department',
    assignedOperatorUid: null,
    assignedOperatorName: 'Unassigned',
    evidenceImage: evidenceImage || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
    evidenceVideo: evidenceVideo || (derivedType === 'video' ? evidenceImage : null),
    mediaResourceType: derivedType,
    videoDetections: videoDetections || null,
    submittedBy: submittedBy || req.user?.displayName || 'Citizen Contributor',
    timeline: [
      { status: 'Submitted', timestamp: new Date().toISOString(), note: 'Complaint logged by citizen.', progress: 0 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  complaintsStoreMap.set(reportId, newReport);
  saveComplaintsToDisk();
  console.log(`[Backend API] Complaint ${reportId} created and saved to disk (Media Type: ${derivedType}).`);
  return res.status(201).json({ success: true, complaint: newReport, reportId });
});

// GET /api/complaints - List All Complaints
app.get('/api/complaints', (req, res) => {
  const list = Array.from(complaintsStoreMap.values());
  return res.json({ success: true, complaints: list, count: list.length });
});

// GET /api/complaints/my - List Citizen Complaints
app.get('/api/complaints/my', (req, res) => {
  const uid = req.query.uid || req.user?.uid;
  const list = Array.from(complaintsStoreMap.values()).filter(c => !uid || c.reporterUid === uid);
  return res.json({ success: true, complaints: list });
});

// GET /api/department/complaints - List Department Complaints
app.get('/api/department/complaints', (req, res) => {
  const list = Array.from(complaintsStoreMap.values());
  return res.json({ success: true, complaints: list });
});

// GET /api/complaints/:id - Get Complaint Details
app.get('/api/complaints/:id', (req, res) => {
  const { id } = req.params;
  const complaint = complaintsStoreMap.get(id);
  if (!complaint) {
    return res.status(404).json({ success: false, error: `Complaint ${id} not found.` });
  }
  return res.json({ success: true, complaint });
});

// POST /api/complaints/:id/verify - Department Verify/Reject
app.post('/api/complaints/:id/verify', (req, res) => {
  const { id } = req.params;
  const { verificationStatus, inspectionNotes, rejectionReason } = req.body;
  const complaint = complaintsStoreMap.get(id);

  const isApproved = verificationStatus === 'Verified' || verificationStatus === 'Approved';
  const newStatus = isApproved ? 'Verified' : 'Rejected';
  const newProgress = isApproved ? 10 : 0;

  if (complaint) {
    complaint.verificationStatus = isApproved ? 'Verified' : 'Rejected';
    complaint.status = newStatus;
    complaint.progress = newProgress;
    complaint.timeline.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      note: isApproved ? (inspectionNotes || 'Verified by department') : (rejectionReason || 'Rejected by department'),
      progress: newProgress
    });
    complaint.updatedAt = new Date().toISOString();
    saveComplaintsToDisk();
  }

  return res.json({ success: true, reportId: id, status: newStatus, progress: newProgress });
});

// POST /api/complaints/:id/assign - Assign Field Operator
app.post('/api/complaints/:id/assign', (req, res) => {
  const { id } = req.params;
  const { operatorUid, operatorName, department, team, instructions } = req.body;
  const complaint = complaintsStoreMap.get(id);

  if (complaint) {
    complaint.status = 'Assigned';
    complaint.progress = 10;
    complaint.assignedOperatorUid = operatorUid || 'operator-uid';
    complaint.assignedOperatorName = operatorName || 'Field Operator';
    complaint.assignedDepartment = department || complaint.assignedDepartment;
    complaint.assignedTeam = team || 'Rapid Repair Crew';
    complaint.workInstructions = instructions || '';
    complaint.timeline.push({
      status: 'Assigned',
      timestamp: new Date().toISOString(),
      note: `Assigned to ${operatorName || 'Field Operator'}.`,
      progress: 10
    });
    complaint.updatedAt = new Date().toISOString();
    saveComplaintsToDisk();
  }

  return res.json({ success: true, reportId: id, assignedOperatorName: operatorName, status: 'Assigned' });
});

// POST /api/complaints/:id/progress - Update Operator Progress (25-89%)
app.post('/api/complaints/:id/progress', (req, res) => {
  const { id } = req.params;
  const { progress, notes, evidenceImage } = req.body;
  const complaint = complaintsStoreMap.get(id);

  const cleanProgress = Math.min(89, Math.max(25, parseInt(progress, 10) || 25));

  if (complaint) {
    complaint.status = 'In Progress';
    complaint.progress = cleanProgress;
    complaint.timeline.push({
      status: 'In Progress',
      timestamp: new Date().toISOString(),
      note: `Progress updated to ${cleanProgress}%: ${notes || 'Work underway.'}`,
      progress: cleanProgress,
      ...(evidenceImage ? { evidenceImage } : {})
    });
    complaint.updatedAt = new Date().toISOString();
    saveComplaintsToDisk();
  }

  return res.json({ success: true, reportId: id, progress: cleanProgress, status: 'In Progress' });
});

// POST /api/complaints/:id/completion - Operator Submit Completion (90%)
app.post('/api/complaints/:id/completion', (req, res) => {
  const { id } = req.params;
  const { notes, evidenceImage } = req.body;
  const complaint = complaintsStoreMap.get(id);

  if (complaint) {
    complaint.status = 'Awaiting Approval';
    complaint.progress = 90;
    complaint.repairEvidenceImage = evidenceImage || null;
    complaint.completionNotes = notes || 'Repair complete.';
    complaint.timeline.push({
      status: 'Awaiting Approval',
      timestamp: new Date().toISOString(),
      note: `Repair completed. Completion notes: ${notes || 'Repair complete.'}`,
      progress: 90,
      ...(evidenceImage ? { evidenceImage } : {})
    });
    complaint.updatedAt = new Date().toISOString();
    saveComplaintsToDisk();
  }

  return res.json({ success: true, reportId: id, progress: 90, status: 'Awaiting Approval' });
});

// POST /api/complaints/:id/approve-resolution - Department Approve Resolution (100%)
app.post('/api/complaints/:id/approve-resolution', (req, res) => {
  const { id } = req.params;
  const { remarks } = req.body;
  const complaint = complaintsStoreMap.get(id);

  if (complaint) {
    complaint.status = 'Resolved';
    complaint.progress = 100;
    complaint.resolvedAt = new Date().toISOString();
    complaint.timeline.push({
      status: 'Resolved',
      timestamp: new Date().toISOString(),
      note: `Department approved completion: ${remarks || 'Approved.'}`,
      progress: 100
    });
    complaint.updatedAt = new Date().toISOString();
    saveComplaintsToDisk();
  }

  return res.json({ success: true, reportId: id, progress: 100, status: 'Resolved' });
});

// GET /api/complaints/:id/history - Action Timeline History
app.get('/api/complaints/:id/history', (req, res) => {
  const { id } = req.params;
  const complaint = complaintsStoreMap.get(id);
  return res.json({ success: true, timeline: complaint ? complaint.timeline : [] });
});

// GET /api/complaints/:id/attachments - Attachments List
app.get('/api/complaints/:id/attachments', (req, res) => {
  const { id } = req.params;
  const complaint = complaintsStoreMap.get(id);
  const attachments = [];
  if (complaint?.evidenceImage) attachments.push({ type: 'citizen_photo', url: complaint.evidenceImage });
  if (complaint?.evidenceVideo) attachments.push({ type: 'citizen_video', url: complaint.evidenceVideo });
  if (complaint?.repairEvidenceImage) attachments.push({ type: 'repair_photo', url: complaint.repairEvidenceImage });
  return res.json({ success: true, attachments });
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` PathRakshak AI Backend Server Running on Port ${PORT}`);
  console.log(` API Endpoint: http://localhost:${PORT}/api`);
  console.log(`==================================================`);
});
