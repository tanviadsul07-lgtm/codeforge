const BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function runLiveScannerTests() {
  console.log('==================================================');
  console.log(' ASETUJ AI LIVE GEOAI CAMERA SCANNER TEST SUITE');
  console.log(` Target Backend API: ${BASE_URL}`);
  console.log('==================================================\n');

  let passCount = 0;
  let failCount = 0;
  let activeScanSessionId = null;
  let generatedComplaintId = null;

  function logPass(testName, details) {
    passCount++;
    console.log(`[PASS] ${testName}`);
    if (details) console.log(`       Details: ${details}`);
  }

  function logFail(testName, error) {
    failCount++;
    console.error(`[FAIL] ${testName}`);
    console.error(`       Error: ${error}`);
  }

  // --------------------------------------------------
  // TEST A: START LIVE SCAN SESSION
  // --------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/scan-sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operatorUid: 'test-operator-uid',
        operatorName: 'Vikram Malhotra (Field Operator Test)',
        deviceName: 'USB Mobile Camera (DroidCam / Iriun UVC)'
      })
    });

    const data = await res.json();
    if (res.status === 201 && data.success && data.scanSessionId) {
      activeScanSessionId = data.scanSessionId;
      logPass('TEST A: START LIVE SCAN SESSION', `Created Session ID: ${activeScanSessionId} | Status: ACTIVE`);
    } else {
      logFail('TEST A: START LIVE SCAN SESSION', `HTTP ${res.status}: ${data.error || 'Failed to start scan session'}`);
    }
  } catch (err) {
    logFail('TEST A: START LIVE SCAN SESSION', err.message);
  }

  // --------------------------------------------------
  // TEST B: LIVE FRAME AI INFERENCE & DETECTION METADATA
  // --------------------------------------------------
  try {
    if (!activeScanSessionId) throw new Error('Skipping Test B: Missing activeScanSessionId');

    // Simulate 5 consecutive video frames arriving from camera stream
    let totalDetections = 0;
    for (let i = 1; i <= 5; i++) {
      const frameRes = await fetch(`${BASE_URL}/analysis/live-frame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanSessionId: activeScanSessionId,
          frameTimestamp: new Date().toISOString(),
          latitude: 28.6139 + (i * 0.0001),
          longitude: 77.2090 + (i * 0.0001),
          category: 'Pothole (Severe)',
          forceDetection: true
        })
      });
      const frameData = await frameRes.json();
      totalDetections += (frameData.detections || []).length;
    }

    if (totalDetections > 0) {
      logPass('TEST B: LIVE FRAME AI INFERENCE', `Processed 5 live camera frames | Total Detections: ${totalDetections}`);
    } else {
      logFail('TEST B: LIVE FRAME AI INFERENCE', 'No detections recorded across processed frames');
    }
  } catch (err) {
    logFail('TEST B: LIVE FRAME AI INFERENCE', err.message);
  }

  // --------------------------------------------------
  // TEST C: STOP SCAN & CONSOLIDATE DUPLICATE DETECTIONS
  // --------------------------------------------------
  try {
    if (!activeScanSessionId) throw new Error('Skipping Test C: Missing activeScanSessionId');

    const stopRes = await fetch(`${BASE_URL}/scan-sessions/${activeScanSessionId}/stop`, {
      method: 'POST'
    });
    const stopData = await stopRes.json();
    const session = stopData.session;

    if (stopData.success && session && session.status === 'COMPLETED' && (session.consolidatedHazards || []).length > 0) {
      logPass('TEST C: STOP SCAN & CONSOLIDATE DUPLICATES', `Session STOPPED | Raw Detections: ${session.summaryStats.rawDetectionsCount} -> Unique Hazards: ${session.consolidatedHazards.length}`);
    } else {
      logFail('TEST C: STOP SCAN & CONSOLIDATE DUPLICATES', 'Session finalization or consolidation failed');
    }
  } catch (err) {
    logFail('TEST C: STOP SCAN & CONSOLIDATE DUPLICATES', err.message);
  }

  // --------------------------------------------------
  // TEST D: AUTOMATIC COMPLAINT DRAFT GENERATION (IDEMPOTENT)
  // --------------------------------------------------
  try {
    if (!activeScanSessionId) throw new Error('Skipping Test D: Missing activeScanSessionId');

    // First Call: Create Complaint
    const compRes1 = await fetch(`${BASE_URL}/scan-sessions/${activeScanSessionId}/create-complaint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Road hazard complaint generated from Live GeoAI Mobile Camera Scan session.'
      })
    });
    const compData1 = await compRes1.json();

    if (compRes1.status === 201 && compData1.success && compData1.complaintId) {
      generatedComplaintId = compData1.complaintId;
    } else {
      throw new Error(`First complaint creation call failed: ${compData1.error}`);
    }

    // Second Call (Idempotency Check)
    const compRes2 = await fetch(`${BASE_URL}/scan-sessions/${activeScanSessionId}/create-complaint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const compData2 = await compRes2.json();

    if (compData2.alreadyExists && compData2.complaintId === generatedComplaintId) {
      logPass('TEST D: COMPLAINT DRAFT GENERATION', `Generated Complaint ID: ${generatedComplaintId} | Idempotent duplicate submission protection confirmed`);
    } else {
      logFail('TEST D: COMPLAINT DRAFT GENERATION', 'Idempotency check failed: Repeated call created duplicate complaint ID');
    }
  } catch (err) {
    logFail('TEST D: COMPLAINT DRAFT GENERATION', err.message);
  }

  // --------------------------------------------------
  // TEST E: GOVERNMENT WORKFLOW INTEGRATION
  // --------------------------------------------------
  try {
    if (!generatedComplaintId) throw new Error('Skipping Test E: Missing generatedComplaintId');

    const detailRes = await fetch(`${BASE_URL}/complaints/${generatedComplaintId}`);
    const detailData = await detailRes.json();
    const complaint = detailData.complaint;

    const deptRes = await fetch(`${BASE_URL}/department/complaints`);
    const deptData = await deptRes.json();
    const foundInDept = (deptData.complaints || []).some(c => c.reportId === generatedComplaintId || c.id === generatedComplaintId);

    if (complaint && complaint.status === 'Submitted' && foundInDept) {
      logPass('TEST E: GOVERNMENT WORKFLOW INTEGRATION', `Complaint ${generatedComplaintId} integrated into Department Dashboard & Complaint Lifecycle`);
    } else {
      logFail('TEST E: GOVERNMENT WORKFLOW INTEGRATION', `Complaint ${generatedComplaintId} missing from government workflow dataset`);
    }
  } catch (err) {
    logFail('TEST E: GOVERNMENT WORKFLOW INTEGRATION', err.message);
  }

  console.log('\n==================================================');
  console.log(` TEST RESULTS SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('==================================================\n');
}

runLiveScannerTests();
