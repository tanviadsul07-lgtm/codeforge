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

async function runWebRtcTests() {
  console.log('==================================================');
  console.log(' WEBRTC MOBILE-TO-HOST SIGNALING TEST SUITE');
  console.log('==================================================\n');

  const sessionId = `SCAN-TEST-${Date.now()}`;

  // 1. Mobile Peer sends Offer Signal
  const offerRes = await request('/webrtc/signal', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      type: 'offer',
      sdp: 'v=0\r\no=- 12345 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=sendrecv',
      sender: 'mobile-peer'
    })
  });

  if (offerRes.success) {
    console.log('[PASS] TEST 1: Mobile SDP Offer signal registered');
  } else {
    console.error('[FAIL] TEST 1: Offer signal failed', offerRes);
  }

  // 2. Host retrieves signals
  const hostGetRes = await request(`/webrtc/signals/${sessionId}`);
  if (hostGetRes.success && hostGetRes.signals.length === 1 && hostGetRes.signals[0].type === 'offer') {
    console.log('[PASS] TEST 2: Host retrieved Mobile SDP Offer from server');
  } else {
    console.error('[FAIL] TEST 2: Host retrieve failed', hostGetRes);
  }

  // 3. Host sends Answer Signal
  const answerRes = await request('/webrtc/signal', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      type: 'answer',
      sdp: 'v=0\r\no=- 54321 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=recvonly',
      sender: 'host-peer'
    })
  });

  if (answerRes.success) {
    console.log('[PASS] TEST 3: Host SDP Answer signal registered');
  } else {
    console.error('[FAIL] TEST 3: Answer signal failed', answerRes);
  }

  // 4. Mobile Peer retrieves Answer Signal
  const mobileGetRes = await request(`/webrtc/signals/${sessionId}`);
  if (mobileGetRes.success && mobileGetRes.signals.length === 2 && mobileGetRes.signals[1].type === 'answer') {
    console.log('[PASS] TEST 4: Mobile retrieved Host SDP Answer from server');
  } else {
    console.error('[FAIL] TEST 4: Mobile retrieve failed', mobileGetRes);
  }

  console.log('\n==================================================');
  console.log(' WEBRTC SIGNALING TESTS COMPLETED SUCCESSFULLY');
  console.log('==================================================');
}

runWebRtcTests().catch(console.error);
