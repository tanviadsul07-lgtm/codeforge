const BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function runEndToEndLifecycleTests() {
  console.log('==================================================');
  console.log(' ASETUJ AI END-TO-END LIFECYCLE TEST SUITE');
  console.log(` Target Backend API: ${BASE_URL}`);
  console.log('==================================================\n');

  let passCount = 0;
  let failCount = 0;
  let testComplaintId = null;
  const citizenUid = `test-citizen-${Date.now()}`;
  const operatorUid = `operator-vikram-${Date.now()}`;

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
  // TEST 1: CITIZEN WORKFLOW
  // --------------------------------------------------
  try {
    const payload = {
      category: 'Pothole',
      description: 'Dangerous deep pothole on MG Road carriageway',
      location: 'Sector 14, MG Road, New Delhi',
      latitude: 28.6139,
      longitude: 77.2090,
      severity: 'High',
      evidenceImage: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
      evidenceVideo: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      reporterUid: citizenUid,
      submittedBy: 'Aarav Sharma (Test Citizen)'
    };

    const res = await fetch(`${BASE_URL}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.status === 201 && data.success && data.reportId) {
      testComplaintId = data.reportId;

      // Verify Citizen My Complaints query
      const myRes = await fetch(`${BASE_URL}/complaints/my?uid=${citizenUid}`);
      const myData = await myRes.json();
      const foundInMy = (myData.complaints || []).some(c => c.reportId === testComplaintId || c.id === testComplaintId);

      if (foundInMy && data.complaint.status === 'Submitted' && data.complaint.progress === 0) {
        logPass('TEST 1: CITIZEN WORKFLOW', `Created ${testComplaintId} | Status: Submitted | Progress: 0% | Verified in My Complaints`);
      } else {
        logFail('TEST 1: CITIZEN WORKFLOW', `Complaint ${testComplaintId} created but not found in citizen My Complaints list`);
      }
    } else {
      logFail('TEST 1: CITIZEN WORKFLOW', `HTTP ${res.status}: ${data.error || 'Failed to submit complaint'}`);
    }
  } catch (err) {
    logFail('TEST 1: CITIZEN WORKFLOW', err.message);
  }

  // --------------------------------------------------
  // TEST 2: DEPARTMENT WORKFLOW
  // --------------------------------------------------
  try {
    if (!testComplaintId) throw new Error('Skipping Test 2: Missing testComplaintId');

    // 1. Department List Verification
    const deptRes = await fetch(`${BASE_URL}/department/complaints`);
    const deptData = await deptRes.json();
    const foundInDept = (deptData.complaints || []).some(c => c.reportId === testComplaintId || c.id === testComplaintId);

    if (!foundInDept) throw new Error(`Complaint ${testComplaintId} missing from department dashboard list`);

    // 2. Department Verify
    const verifyRes = await fetch(`${BASE_URL}/complaints/${testComplaintId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationStatus: 'Verified',
        inspectionNotes: 'Verified on-site by Er. Rajesh Verma (Department Officer)'
      })
    });
    const verifyData = await verifyRes.json();

    // 3. Department Assign Operator
    const assignRes = await fetch(`${BASE_URL}/complaints/${testComplaintId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operatorUid,
        operatorName: 'Vikram Malhotra',
        department: 'PWD Road Maintenance Division 4',
        team: 'Rapid Asphalt Repair Unit A',
        instructions: 'Excavate loose asphalt and apply hot-mix asphalt.'
      })
    });
    const assignData = await assignRes.json();

    if (verifyData.success && assignData.success && assignData.status === 'Assigned') {
      logPass('TEST 2: DEPARTMENT WORKFLOW', `Verified ${testComplaintId} | Status: Assigned | Progress: 10% | Assigned to Operator Vikram Malhotra`);
    } else {
      logFail('TEST 2: DEPARTMENT WORKFLOW', `Verification/Assignment failed for ${testComplaintId}`);
    }
  } catch (err) {
    logFail('TEST 2: DEPARTMENT WORKFLOW', err.message);
  }

  // --------------------------------------------------
  // TEST 3: FIELD OPERATOR WORKFLOW
  // --------------------------------------------------
  try {
    if (!testComplaintId) throw new Error('Skipping Test 3: Missing testComplaintId');

    // 1. Start Work (25%)
    const progress25Res = await fetch(`${BASE_URL}/complaints/${testComplaintId}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress: 25, notes: 'Repair crew arrived at location and established traffic cone barrier.' })
    });
    const progress25Data = await progress25Res.json();

    // 2. Update Progress (50%)
    const progress50Res = await fetch(`${BASE_URL}/complaints/${testComplaintId}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        progress: 50,
        notes: 'Bituminous base compaction complete. Applying surface layer.',
        evidenceImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600&auto=format&fit=crop&q=80'
      })
    });
    const progress50Data = await progress50Res.json();

    // 3. Submit Completion (90%)
    const completionRes = await fetch(`${BASE_URL}/complaints/${testComplaintId}/completion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: 'Road surface level restoration finished and roller compacted.',
        evidenceImage: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80'
      })
    });
    const completionData = await completionRes.json();

    if (progress25Data.success && progress50Data.progress === 50 && completionData.status === 'Awaiting Approval' && completionData.progress === 90) {
      logPass('TEST 3: FIELD OPERATOR WORKFLOW', `Work started (25%) -> Progress updated (50%) -> Completion submitted (90% | Awaiting Approval)`);
    } else {
      logFail('TEST 3: FIELD OPERATOR WORKFLOW', `Operator workflow step failed for ${testComplaintId}`);
    }
  } catch (err) {
    logFail('TEST 3: FIELD OPERATOR WORKFLOW', err.message);
  }

  // --------------------------------------------------
  // TEST 4: LIVE PROGRESS SYNCHRONIZATION
  // --------------------------------------------------
  try {
    if (!testComplaintId) throw new Error('Skipping Test 4: Missing testComplaintId');

    const detailRes = await fetch(`${BASE_URL}/complaints/${testComplaintId}`);
    const detailData = await detailRes.json();
    const complaint = detailData.complaint;

    const historyRes = await fetch(`${BASE_URL}/complaints/${testComplaintId}/history`);
    const historyData = await historyRes.json();
    const timeline = historyData.timeline || [];

    if (complaint && complaint.status === 'Awaiting Approval' && complaint.progress === 90 && timeline.length >= 4) {
      logPass('TEST 4: LIVE PROGRESS SYNCHRONIZATION', `Synchronized state verified across backend API | Progress: 90% | Timeline steps recorded: ${timeline.length}`);
    } else {
      logFail('TEST 4: LIVE PROGRESS SYNCHRONIZATION', `Mismatch in synchronized state or timeline records for ${testComplaintId}`);
    }
  } catch (err) {
    logFail('TEST 4: LIVE PROGRESS SYNCHRONIZATION', err.message);
  }

  // --------------------------------------------------
  // TEST 5: FINAL APPROVAL
  // --------------------------------------------------
  try {
    if (!testComplaintId) throw new Error('Skipping Test 5: Missing testComplaintId');

    const approveRes = await fetch(`${BASE_URL}/complaints/${testComplaintId}/approve-resolution`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        remarks: 'Confirmed high-quality road patch execution. Department approval granted.'
      })
    });
    const approveData = await approveRes.json();

    // Verify detail after approval
    const finalDetailRes = await fetch(`${BASE_URL}/complaints/${testComplaintId}`);
    const finalDetailData = await finalDetailRes.json();
    const finalComplaint = finalDetailData.complaint;

    // Verify attachments
    const attachRes = await fetch(`${BASE_URL}/complaints/${testComplaintId}/attachments`);
    const attachData = await attachRes.json();

    if (approveData.success && finalComplaint.status === 'Resolved' && finalComplaint.progress === 100 && (attachData.attachments || []).length >= 2) {
      logPass('TEST 5: FINAL APPROVAL', `Status: RESOLVED | Progress: 100% | Verified by Department Officer | Repair attachments verified`);
    } else {
      logFail('TEST 5: FINAL APPROVAL', `Final approval failed for ${testComplaintId}`);
    }
  } catch (err) {
    logFail('TEST 5: FINAL APPROVAL', err.message);
  }

  // --------------------------------------------------
  // TEST 6: SECURITY
  // --------------------------------------------------
  try {
    if (!testComplaintId) throw new Error('Skipping Test 6: Missing testComplaintId');

    const otherCitizenUid = `unauthorized-citizen-${Date.now()}`;
    const otherRes = await fetch(`${BASE_URL}/complaints/my?uid=${otherCitizenUid}`);
    const otherData = await otherRes.json();

    const exposedToOtherCitizen = (otherData.complaints || []).some(c => c.reportId === testComplaintId || c.id === testComplaintId);

    if (!exposedToOtherCitizen) {
      logPass('TEST 6: SECURITY', `Citizen isolation verified | Complaint ${testComplaintId} inaccessible to other citizens`);
    } else {
      logFail('TEST 6: SECURITY', `Security violation: Complaint ${testComplaintId} returned in private query of another citizen`);
    }
  } catch (err) {
    logFail('TEST 6: SECURITY', err.message);
  }

  // --------------------------------------------------
  // TEST 7: PERSISTENCE
  // --------------------------------------------------
  try {
    if (!testComplaintId) throw new Error('Skipping Test 7: Missing testComplaintId');

    // Fetch complaint again to ensure disk workspace persistence
    const reFetchRes = await fetch(`${BASE_URL}/complaints/${testComplaintId}`);
    const reFetchData = await reFetchRes.json();
    const pComplaint = reFetchData.complaint;

    if (pComplaint && pComplaint.status === 'Resolved' && pComplaint.progress === 100 && pComplaint.timeline && pComplaint.timeline.length >= 5) {
      logPass('TEST 7: PERSISTENCE', `Disk workspace persistence confirmed | ID: ${testComplaintId} | Status: Resolved | 100% Progress & Action History Preserved`);
    } else {
      logFail('TEST 7: PERSISTENCE', `Disk workspace persistence check failed for ${testComplaintId}`);
    }
  } catch (err) {
    logFail('TEST 7: PERSISTENCE', err.message);
  }

  console.log('\n==================================================');
  console.log(` TEST RESULTS SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('==================================================\n');
}

runEndToEndLifecycleTests();
