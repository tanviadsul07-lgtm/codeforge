import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://localhost:5000/api';
const VALID_TOKEN = 'Bearer firebase-auth-token-sample';

async function runAiPersistenceAndAuthTests() {
  console.log('=== PATHRAKSHAK AI: AI PERSISTENCE & AUTH AUTHORIZATION TEST SUITE ===\n');

  try {
    // 1. Submit AI Video + GPS Job
    console.log('[Test 1] Submitting AI Analysis Job via HTTP Endpoint...');
    const gpsCsvContent = `time_sec,lat,lon\n0.0,28.6139,77.2090\n1.0,28.6145,77.2095\n2.0,28.6150,77.2100`;
    
    const submitRes = await fetch(`${BASE_URL}/analysis/submit-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': VALID_TOKEN
      },
      body: JSON.stringify({
        videoUrl: 'https://res.cloudinary.com/nyymao4r/video/upload/v1/road_reports/drive.mp4',
        gpsCsvContent,
        sampleFps: 2.0,
        offsetSeconds: 0.0
      })
    });

    const submitJson = await submitRes.json();
    console.log('Submission Output:', submitJson);
    assert.strictEqual(submitRes.ok, true);
    assert.strictEqual(submitJson.success, true);
    assert.ok(submitJson.jobId);
    console.log(`✔ AI Job ${submitJson.jobId} queued successfully\n`);

    const jobId = submitJson.jobId;

    // 2. Poll Job Status
    console.log(`[Test 2] Polling Job Status for ${jobId}...`);
    const statusRes = await fetch(`${BASE_URL}/analysis/jobs/${jobId}`, {
      headers: { 'Authorization': VALID_TOKEN }
    });
    const statusJson = await statusRes.json();
    console.log('Job Status Output:', statusJson);
    assert.strictEqual(statusRes.ok, true);
    assert.strictEqual(statusJson.success, true);
    assert.ok(statusJson.job);
    console.log(`✔ Job status query returned status: ${statusJson.job.status}\n`);

    // 3. Verify Unauthorized Requests are Rejected
    console.log('[Test 3] Verifying Unauthenticated/Unauthorized Rejection...');
    const unauthRes = await fetch(`${BASE_URL}/work-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaintId: 'PR-2026-001' })
    });
    const unauthJson = await unauthRes.json();
    assert.strictEqual(unauthRes.status, 401);
    assert.strictEqual(unauthJson.success, false);
    console.log('✔ Unauthenticated request correctly rejected with HTTP 401\n');

    // 4. Verify Job Disk Workspace Persistence
    console.log(`[Test 4] Verifying Job Directory Persistence on Server Disk...`);
    const jobsDir = path.resolve(process.cwd(), 'server/jobs', jobId);
    const gpsFileOnDisk = path.join(jobsDir, 'drive_gps.csv');
    assert.strictEqual(fs.existsSync(jobsDir), true);
    assert.strictEqual(fs.existsSync(gpsFileOnDisk), true);
    console.log(`✔ Job workspace directory verified on disk: ${jobsDir}\n`);

    console.log('==================================================');
    console.log(' ALL AI PERSISTENCE & AUTH TESTS PASSED CLEANLY (100%)');
    console.log('==================================================');

  } catch (err) {
    console.error('❌ Test Exception:', err.message);
    process.exit(1);
  }
}

runAiPersistenceAndAuthTests();
