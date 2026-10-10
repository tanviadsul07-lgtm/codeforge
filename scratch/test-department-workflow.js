const BASE_URL = 'http://localhost:5000/api';
const FAKE_TOKEN = 'Bearer sample-firebase-id-token-department-officer';

async function testDepartmentWorkflow() {
  console.log('=== PATHRAKSHAK AI: PHASE 4 DEPARTMENT OFFICER WORKFLOW VERIFICATION ===\n');

  try {
    // 1. Health Check
    console.log('[1] Testing Health Endpoint...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthJson = await healthRes.json();
    console.log('Health Status:', healthJson);
    if (healthRes.ok && healthJson.status === 'online') {
      console.log('✔ Health endpoint PASSED\n');
    } else {
      throw new Error('Health check failed');
    }

    // 2. Create Work Order
    console.log('[2] Testing Work Order Creation Endpoint...');
    const createRes = await fetch(`${BASE_URL}/work-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': FAKE_TOKEN
      },
      body: JSON.stringify({
        complaintId: 'PR-2026-001',
        assignedDepartment: 'PWD Maintenance Division 4',
        assignedTeam: 'Rapid Asphalt Repair Unit A',
        officerInCharge: 'Er. S. K. Gupta',
        priority: 'High',
        targetCompletionDate: '2026-10-15',
        workInstructions: 'Conduct hot mix asphalt patching on carriageway defect.'
      })
    });

    const createJson = await createRes.json();
    console.log('Create Work Order Output:', createJson);
    if (createRes.ok && createJson.success && createJson.workOrderId) {
      console.log(`✔ Work order created successfully: ${createJson.workOrderId}\n`);
    } else {
      throw new Error(`Work order creation failed: ${createJson.error}`);
    }

    const testWoId = createJson.workOrderId;

    // 3. Update Work Order Progress
    console.log(`[3] Testing Work Order Progress Update Endpoint for ${testWoId}...`);
    const progressRes = await fetch(`${BASE_URL}/work-orders/${testWoId}/progress`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': FAKE_TOKEN
      },
      body: JSON.stringify({
        progress: 100,
        status: 'Completed',
        note: 'Asphalt paving and roller compaction completed. Carriageway re-opened for traffic.'
      })
    });

    const progressJson = await progressRes.json();
    console.log('Progress Update Output:', progressJson);
    if (progressRes.ok && progressJson.success && progressJson.progress === 100) {
      console.log('✔ Work order progress updated to 100% and Completed\n');
    } else {
      throw new Error(`Work order progress update failed: ${progressJson.error}`);
    }

    // 4. Query Work Orders
    console.log('[4] Testing Work Orders List Query Endpoint...');
    const listRes = await fetch(`${BASE_URL}/work-orders`, {
      headers: {
        'Authorization': FAKE_TOKEN
      }
    });

    const listJson = await listRes.json();
    console.log('Work Orders List Output:', listJson);
    if (listRes.ok && listJson.success) {
      console.log('✔ Work orders list endpoint PASSED\n');
    } else {
      throw new Error('Work orders list query failed');
    }

    console.log('==================================================');
    console.log(' ALL PHASE 4 DEPARTMENT WORKFLOW TESTS PASSED CLEANLY');
    console.log('==================================================');

  } catch (err) {
    console.error('❌ Verification Error:', err.message);
    process.exit(1);
  }
}

testDepartmentWorkflow();
