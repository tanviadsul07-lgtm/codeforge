import fs from 'fs';

async function testFullAiPipeline() {
  console.log('=== Step 1: Health Check ===');
  const healthRes = await fetch('http://localhost:5000/api/health');
  const healthData = await healthRes.json();
  console.log('Health:', healthData);

  console.log('\n=== Step 2: Reading Reference GPS CSV ===');
  const gpsPath = 'C:\\Users\\jsand\\Downloads\\Hackathon26\\Hackathon26\\data\\drive_gps.csv';
  const videoPath = 'C:\\Users\\jsand\\Downloads\\Hackathon26\\Hackathon26\\data\\drive.mp4';
  const gpsCsvContent = fs.readFileSync(gpsPath, 'utf-8');

  console.log('GPS CSV lines:', gpsCsvContent.trim().split('\n').length);

  console.log('\n=== Step 3: Submitting AI Processing Job ===');
  const submitRes = await fetch('http://localhost:5000/api/analysis/submit-job', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-firebase-id-token'
    },
    body: JSON.stringify({
      videoPath: videoPath,
      gpsCsvContent: gpsCsvContent,
      sampleFps: 3.0,
      offsetSeconds: 0.0
    })
  });

  const submitData = await submitRes.json();
  console.log('Submit Response Status:', submitRes.status);
  console.log('Submit Response:', submitData);

  if (!submitData.success || !submitData.jobId) {
    throw new Error(`Job submission failed: ${submitData.error}`);
  }

  const jobId = submitData.jobId;
  console.log(`\n=== Step 4: Polling Job Status for ${jobId} ===`);

  let completedJob = null;
  for (let attempt = 1; attempt <= 30; attempt++) {
    await new Promise(r => setTimeout(r, 1500));

    const pollRes = await fetch(`http://localhost:5000/api/analysis/jobs/${jobId}`, {
      headers: { 'Authorization': 'Bearer test-firebase-id-token' }
    });

    const pollData = await pollRes.json();
    const job = pollData.job;
    console.log(`Poll #${attempt}: Status=${job.status}, Progress=${job.progressPercent}%`);

    if (job.status === 'COMPLETED') {
      completedJob = job;
      break;
    } else if (job.status === 'FAILED') {
      throw new Error(`AI Job failed: ${job.error}`);
    }
  }

  if (!completedJob) {
    throw new Error('Timed out waiting for AI job completion.');
  }

  console.log('\n==================================================');
  console.log(' SUCCESS! Real Video + GPS AI Detection Verified!');
  console.log(' Job ID:', completedJob.jobId);
  console.log(' Hazards Detected:', completedJob.hazardCount);
  console.log(' Route Points Count:', completedJob.route?.features[0]?.geometry?.coordinates?.length);

  if (completedJob.features.length > 0) {
    console.log(' Sample Hazard Feature #1:', {
      id: completedJob.features[0].id,
      category: completedJob.features[0].category,
      severity: completedJob.features[0].severity,
      confidence: completedJob.features[0].confidence,
      latitude: completedJob.features[0].latitude,
      longitude: completedJob.features[0].longitude,
      evidenceImage: completedJob.features[0].evidenceImage
    });

    // Test evidence image HTTP access
    const imgRes = await fetch(completedJob.features[0].evidenceImage);
    console.log(' Evidence Image HTTP Status:', imgRes.status);
  }
  console.log('==================================================');
}

testFullAiPipeline().catch(err => {
  console.error('\nTEST EXCEPTION:', err);
  process.exit(1);
});
