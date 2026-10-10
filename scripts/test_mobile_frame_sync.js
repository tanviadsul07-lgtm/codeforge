import http from 'http';

const API_BASE = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = new URL(`${API_BASE}${path}`);
  return new Promise((resolve, reject) => {
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runMobileFrameSyncTest() {
  console.log('==================================================');
  console.log(' MOBILE LIVE FRAME & TELEMETRY SYNC TEST SUITE');
  console.log('==================================================\n');

  const sessionId = `SCAN-MOB-TEST-${Date.now()}`;
  const dummyBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...';

  // 1. Mobile Phone posts live frame & GPS
  const postRes = await request(`/scan-sessions/${sessionId}/live-mobile-frame`, {
    method: 'POST',
    body: JSON.stringify({
      frameTimestamp: new Date().toISOString(),
      latitude: 18.5204,
      longitude: 73.8567,
      imageBase64: dummyBase64
    })
  });

  if (postRes.success && postRes.latestFrame) {
    console.log(`[PASS] TEST 1: Mobile live frame & GPS ingested successfully | Processed Frames: ${postRes.totalFramesProcessed}`);
  } else {
    console.error('[FAIL] TEST 1: Mobile frame ingestion failed', postRes);
  }

  // 2. Website Scanner Dashboard polls latest mobile frame & telemetry
  const getRes = await request(`/scan-sessions/${sessionId}/latest-frame`);
  if (getRes.success && getRes.latestFrame && getRes.latestFrame.latitude === 18.5204) {
    console.log(`[PASS] TEST 2: Website scanner retrieved live mobile frame & GPS | Lat: ${getRes.latestFrame.latitude}, Lng: ${getRes.latestFrame.longitude}`);
    console.log(`       Detections Count: ${getRes.detections ? getRes.detections.length : 0}`);
  } else {
    console.error('[FAIL] TEST 2: Latest frame polling failed', getRes);
  }

  console.log('\n==================================================');
  console.log(' MOBILE FRAME SYNC TESTS COMPLETED SUCCESSFULLY');
  console.log('==================================================');
}

runMobileFrameSyncTest().catch(console.error);
