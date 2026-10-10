import assert from 'node:assert';
import {
  normalizeReport,
  normalizeHazard,
  normalizeWorkOrder,
  normalizeTimestamp,
  parseCoord,
  safeString
} from '../src/utils/normalizers.js';
import {
  formatDate,
  formatDateTime,
  formatCoordinates,
  getStatusBadgeClass,
  getPriorityBadgeClass
} from '../src/utils/formatters.js';

console.log('=== RUNNING PATHRAKSHAK AI NORMALIZERS AND RESILIENCE TEST SUITE ===\n');

// 1. Test Timestamp Normalizer
console.log('[Test 1] Timestamp Normalizer with Various Inputs...');
const isoStr = '2026-10-09T12:00:00.000Z';
assert.strictEqual(normalizeTimestamp(isoStr), isoStr);

const firestoreTimestampObj = { seconds: 1728480000, nanoseconds: 0 };
const normalizedFsTs = normalizeTimestamp(firestoreTimestampObj);
assert.strictEqual(typeof normalizedFsTs, 'string');
assert.ok(normalizedFsTs.includes('2024') || normalizedFsTs.includes('2026'));

assert.strictEqual(typeof normalizeTimestamp(null), 'string');
assert.strictEqual(typeof normalizeTimestamp(undefined), 'string');
console.log('✔ Test 1 PASSED: Timestamps normalized safely\n');

// 2. Test Report Normalizer with Missing/Null Fields
console.log('[Test 2] Report Normalizer with Partial/Null Firestore Docs...');
const rawFirestoreDoc = {
  reportId: 'PR-2026-999', // Uses reportId instead of id
  reportType: 'Waterlogging', // Uses reportType instead of category
  latitude: '28.6139', // String coordinate
  longitude: 77.2090,
  createdAt: { seconds: 1760000000 },
  // status is missing
  // severity is missing
  // priority is missing
  // evidenceImage is missing
};

const normalizedDoc = normalizeReport(rawFirestoreDoc);
assert.strictEqual(normalizedDoc.id, 'PR-2026-999');
assert.strictEqual(normalizedDoc.category, 'Waterlogging');
assert.strictEqual(normalizedDoc.status, 'Submitted'); // Documented safe fallback
assert.strictEqual(normalizedDoc.severity, 'Medium');
assert.strictEqual(normalizedDoc.priority, 'Medium');
assert.strictEqual(typeof normalizedDoc.latitude, 'number');
assert.strictEqual(normalizedDoc.latitude, 28.6139);
assert.ok(normalizedDoc.evidenceImage.length > 0);
assert.ok(Array.isArray(normalizedDoc.timeline));
console.log('✔ Test 2 PASSED: Reports normalized cleanly with safe fallbacks\n');

// 3. Test Hazard & Work Order Normalizers
console.log('[Test 3] Hazard & Work Order Normalization...');
const rawHazard = {
  hazardId: 'HZ-2026-042',
  confidence: '0.88',
  latitude: '28.7041',
  longitude: '77.1025'
};
const normHazard = normalizeHazard(rawHazard);
assert.strictEqual(normHazard.id, 'HZ-2026-042');
assert.strictEqual(normHazard.confidence, 0.88);
assert.strictEqual(normHazard.latitude, 28.7041);

const rawWO = {
  workOrderId: 'WO-2026-015',
  progress: '75',
  department: 'Drainage Division'
};
const normWO = normalizeWorkOrder(rawWO);
assert.strictEqual(normWO.id, 'WO-2026-015');
assert.strictEqual(normWO.progress, 75);
assert.strictEqual(normWO.assignedDepartment, 'Drainage Division');
console.log('✔ Test 3 PASSED: Hazard and Work Order normalized cleanly\n');

// 4. Test Formatters with Firestore Timestamps and Nulls
console.log('[Test 4] Formatters Resilience...');
assert.strictEqual(formatDate(null), 'N/A');
assert.strictEqual(formatDate(undefined), 'N/A');
assert.strictEqual(formatDate({ seconds: 1728480000 }), formatDate(new Date(1728480000 * 1000)));

assert.strictEqual(formatCoordinates(null, null), 'N/A');
assert.strictEqual(formatCoordinates('28.6139', '77.2090'), '28.6139° N, 77.2090° E');
assert.strictEqual(getStatusBadgeClass(null), 'badge-neutral');
assert.strictEqual(getStatusBadgeClass('Resolved'), 'badge-success');
console.log('✔ Test 4 PASSED: Formatters resilient against unexpected types\n');

// 5. Test Filtering Logic on Problematic Complaint Lists
console.log('[Test 5] Filtering Resilience with Empty/Corrupted Lists...');
const corruptedList = [
  null,
  {}, // empty record
  { id: 'PR-2026-001', category: null, location: undefined, status: 'Submitted' },
  { reportId: 'PR-2026-002', reportType: 'Pothole', address: 'MG Road', status: null }
];

const normalizedList = corruptedList.map(c => normalizeReport(c));

const searchFilter = (list, query) => {
  const qLower = (query || '').toLowerCase();
  return list.filter(c => {
    if (!c) return false;
    const idStr = (c.id || c.reportId || '').toLowerCase();
    const catStr = (c.category || c.reportType || '').toLowerCase();
    const locStr = (c.location || c.address || '').toLowerCase();
    return !qLower || idStr.includes(qLower) || catStr.includes(qLower) || locStr.includes(qLower);
  });
};

const resultsPothole = searchFilter(normalizedList, 'Pothole');
assert.ok(resultsPothole.length >= 1);

const resultsEmpty = searchFilter([], 'Pothole');
assert.strictEqual(resultsEmpty.length, 0);

console.log('✔ Test 5 PASSED: Filtering withstands empty, null, and corrupted records\n');

console.log('==================================================');
console.log(' ALL SUITE TESTS PASSED CLEANLY (100% SUCCESS)');
console.log('==================================================');
