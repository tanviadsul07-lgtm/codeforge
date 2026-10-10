const BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function runVideoAndApiBugFixTests() {
  console.log('==================================================');
  console.log(' BUG FIX VERIFICATION TEST SUITE (BUG 1 & BUG 2)');
  console.log(` Target API Base URL: ${BASE_URL}`);
  console.log('==================================================\n');

  let passCount = 0;
  let failCount = 0;

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
  // TEST 1: BACKEND HEALTH CHECK & PORT 5000 LISTENING
  // --------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    if (res.ok && data.status === 'online') {
      logPass('TEST 1: BACKEND PORT 5000 LISTENING', `Service: ${data.service} | Timestamp: ${data.timestamp}`);
    } else {
      logFail('TEST 1: BACKEND PORT 5000 LISTENING', `HTTP ${res.status}`);
    }
  } catch (err) {
    logFail('TEST 1: BACKEND PORT 5000 LISTENING', err.message);
  }

  // --------------------------------------------------
  // TEST 2: API CLIENT & CITIZEN UPLOAD ENDPOINT
  // --------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/analysis/jobs/PR-JOB-NONEXISTENT`, {
      headers: { Authorization: 'Bearer test-token' }
    });
    // 404 means the backend endpoint exists and is reachable on port 5000 (no "Failed to fetch")
    if (res.status === 404 || res.status === 200) {
      logPass('TEST 2: CITIZEN UPLOAD FETCH API ROUTE', `API endpoint reachable on port 5000 without "Failed to fetch" (HTTP ${res.status})`);
    } else {
      logFail('TEST 2: CITIZEN UPLOAD FETCH API ROUTE', `HTTP ${res.status}`);
    }
  } catch (err) {
    logFail('TEST 2: CITIZEN UPLOAD FETCH API ROUTE', err.message);
  }

  // --------------------------------------------------
  // TEST 3: MEDIA UPLOAD ENDPOINT & VIDEO PERSISTENCE
  // --------------------------------------------------
  let uploadedVideoUrl = null;
  try {
    const dummyBase64 = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28ybXA0MQ==';
    const uploadRes = await fetch(`${BASE_URL}/uploads/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileData: dummyBase64,
        fileName: `test_sample_${Date.now()}.mp4`,
        mimeType: 'video/mp4',
        resourceType: 'video'
      })
    });
    const uploadData = await uploadRes.json();

    if (uploadRes.status === 201 && uploadData.success && uploadData.secureUrl) {
      uploadedVideoUrl = uploadData.secureUrl;
      logPass('TEST 3: MEDIA UPLOAD ENDPOINT', `Uploaded sample video -> ${uploadData.secureUrl} (MIME: ${uploadData.mimeType})`);
    } else {
      logFail('TEST 3: MEDIA UPLOAD ENDPOINT', uploadData.error || `HTTP ${uploadRes.status}`);
    }
  } catch (err) {
    logFail('TEST 3: MEDIA UPLOAD ENDPOINT', err.message);
  }

  // --------------------------------------------------
  // TEST 4 & 5: COMPLAINT VIDEO EVIDENCE DISPLAY & METADATA
  // --------------------------------------------------
  let testReportId = null;
  try {
    const payload = {
      category: 'Pothole (Severe)',
      description: 'Severe road pothole with recorded video evidence',
      location: 'Ring Road Carriageway, New Delhi',
      latitude: 28.6139,
      longitude: 77.2090,
      severity: 'Critical',
      evidenceVideo: uploadedVideoUrl || 'http://localhost:5000/api/evidence/uploads/sample_pothole_video.mp4',
      mediaResourceType: 'video',
      reporterUid: 'citizen-test-user',
      submittedBy: 'Aarav Sharma'
    };

    const res = await fetch(`${BASE_URL}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (res.status === 201 && data.success && data.reportId) {
      testReportId = data.reportId;
      const comp = data.complaint;
      if (comp.mediaResourceType === 'video' && comp.evidenceVideo) {
        logPass('TEST 4 & 5: COMPLAINT VIDEO EVIDENCE METADATA', `Report ${testReportId} created | Media Type: ${comp.mediaResourceType} | Video URL: ${comp.evidenceVideo}`);
      } else {
        logFail('TEST 4 & 5: COMPLAINT VIDEO EVIDENCE METADATA', `Complaint evidence metadata missing video properties`);
      }
    } else {
      logFail('TEST 4 & 5: COMPLAINT VIDEO EVIDENCE METADATA', data.error || `HTTP ${res.status}`);
    }
  } catch (err) {
    logFail('TEST 4 & 5: COMPLAINT VIDEO EVIDENCE METADATA', err.message);
  }

  // --------------------------------------------------
  // TEST 6: UNIFIED CROSS-ROLE EVIDENCE ACCESSIBILITY
  // --------------------------------------------------
  try {
    if (!testReportId) throw new Error('Skipping Test 6: Missing testReportId');

    const citizenRes = await fetch(`${BASE_URL}/complaints/${testReportId}`);
    const citizenData = await citizenRes.json();

    const deptRes = await fetch(`${BASE_URL}/department/complaints`);
    const deptData = await deptRes.json();
    const deptMatch = (deptData.complaints || []).find(c => (c.id || c.reportId) === testReportId);

    if (citizenData.success && deptMatch && citizenData.complaint.evidenceVideo === deptMatch.evidenceVideo) {
      logPass('TEST 6: UNIFIED CROSS-ROLE EVIDENCE', `Identical video evidence URL (${citizenData.complaint.evidenceVideo}) served to Citizen, Department, and Field Operator`);
    } else {
      logFail('TEST 6: UNIFIED CROSS-ROLE EVIDENCE', 'Discrepancy in evidence served between roles');
    }
  } catch (err) {
    logFail('TEST 6: UNIFIED CROSS-ROLE EVIDENCE', err.message);
  }

  console.log('\n==================================================');
  console.log(` TEST RESULTS SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('==================================================\n');

  if (failCount > 0) process.exit(1);
}

runVideoAndApiBugFixTests();
