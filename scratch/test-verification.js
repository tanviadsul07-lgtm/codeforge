async function testVerificationEndpoint() {
  console.log('=== Testing Backend Verification Audit Endpoint ===');

  // Test 1: Unauthorized call (No token)
  const unauthRes = await fetch('http://localhost:5000/api/hazards/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportId: 'PR-2026-001', verificationStatus: 'Verified' })
  });
  console.log('Unauthorized Call Status:', unauthRes.status);
  const unauthData = await unauthRes.json();
  console.log('Unauthorized Call Response:', unauthData);

  // Test 2: Authenticated call with Firebase token
  const authRes = await fetch('http://localhost:5000/api/hazards/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-operator-firebase-id-token'
    },
    body: JSON.stringify({
      reportId: 'PR-2026-001',
      verificationStatus: 'Verified',
      category: 'Pothole',
      severity: 'High',
      inspectionNotes: 'Verified 45cm deep pothole in right carriageway lane.'
    })
  });
  console.log('\nAuthenticated Verification Status:', authRes.status);
  const authData = await authRes.json();
  console.log('Authenticated Verification Response:', authData);

  if (unauthRes.status === 401 && authRes.ok && authData.success) {
    console.log('\n==================================================');
    console.log(' SUCCESS! Protected Field Operator Endpoint Verified!');
    console.log('==================================================');
  } else {
    console.error('Verification Test Failed');
  }
}

testVerificationEndpoint().catch(console.error);
