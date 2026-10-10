async function testCloudinaryWorkflow() {
  console.log('=== Step 1: Testing Health Endpoint ===');
  const healthRes = await fetch('http://localhost:5000/api/health');
  const healthData = await healthRes.json();
  console.log('Health status:', healthData);

  console.log('\n=== Step 2: Testing Signature Endpoint ===');
  const sigRes = await fetch('http://localhost:5000/api/uploads/signature', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-firebase-id-token-12345'
    },
    body: JSON.stringify({ folder: 'road_reports' })
  });

  const sigData = await sigRes.json();
  console.log('Signature response status:', sigRes.status);
  console.log('Signature response success:', sigData.success);
  console.log('Cloud Name received:', sigData.cloudName);
  console.log('API Key received:', sigData.apiKey ? 'PRESENT (Valid)' : 'MISSING');
  console.log('Signature received:', sigData.signature ? 'PRESENT (Valid)' : 'MISSING');
  console.log('Timestamp received:', sigData.timestamp);

  if (!sigData.success) {
    throw new Error(`Signature generation failed: ${sigData.error}`);
  }

  console.log('\n=== Step 3: Testing Real Cloudinary Upload ===');
  const samplePngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  const uploadUrl = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`;
  const formData = new FormData();
  
  const blob = new Blob([samplePngBuffer], { type: 'image/png' });
  formData.append('file', blob, 'test_hazard_evidence.png');
  formData.append('api_key', sigData.apiKey);
  formData.append('timestamp', sigData.timestamp.toString());
  formData.append('signature', sigData.signature);
  formData.append('folder', sigData.folder);

  const cloudinaryRes = await fetch(uploadUrl, {
    method: 'POST',
    body: formData
  });

  const cloudinaryData = await cloudinaryRes.json();
  console.log('Cloudinary HTTP Status:', cloudinaryRes.status);

  if (cloudinaryRes.ok) {
    console.log('\n==================================================');
    console.log(' SUCCESS! Real Cloudinary Signed Upload Verified!');
    console.log(' Secure URL:', cloudinaryData.secure_url);
    console.log(' Public ID:', cloudinaryData.public_id);
    console.log(' Format:', cloudinaryData.format);
    console.log(' Bytes:', cloudinaryData.bytes);
    console.log('==================================================');
  } else {
    console.error('Cloudinary Upload Failed:', cloudinaryData);
  }
}

testCloudinaryWorkflow().catch(err => console.error('Test error:', err));
