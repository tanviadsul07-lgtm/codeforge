async function testUnauthorizedRequest() {
  console.log('Testing Unauthorized Request (No Authorization Header)...');
  const res = await fetch('http://localhost:5000/api/uploads/signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder: 'road_reports' })
  });

  const data = await res.json();
  console.log('Response Status:', res.status);
  console.log('Response Body:', data);

  if (res.status === 401 && data.success === false) {
    console.log('SUCCESS: Unauthorized request correctly rejected with 401!');
  } else {
    console.error('FAILED: Expected 401 Unauthorized');
  }
}

testUnauthorizedRequest().catch(console.error);
