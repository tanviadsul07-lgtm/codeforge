/**
 * Centralized Data Normalizers for PathRakshak AI
 * Safely transforms raw Firestore documents, API responses, and legacy records
 * into standardized schema objects required by the UI components.
 */

// Helper to normalize timestamp values (ISO string, Firestore Timestamp, Date object, or fallback)
export const normalizeTimestamp = (rawTimestamp, defaultIsoString = new Date().toISOString()) => {
  if (!rawTimestamp) return defaultIsoString;
  try {
    if (typeof rawTimestamp === 'string' && rawTimestamp.trim().length > 0) {
      const d = new Date(rawTimestamp);
      return isNaN(d.getTime()) ? defaultIsoString : d.toISOString();
    }
    if (typeof rawTimestamp === 'number') {
      const d = new Date(rawTimestamp);
      return isNaN(d.getTime()) ? defaultIsoString : d.toISOString();
    }
    if (typeof rawTimestamp === 'object') {
      if (typeof rawTimestamp.toDate === 'function') {
        return rawTimestamp.toDate().toISOString();
      }
      if (typeof rawTimestamp.seconds === 'number') {
        return new Date(rawTimestamp.seconds * 1000).toISOString();
      }
    }
  } catch (e) {
    // Fallback to default
  }
  return defaultIsoString;
};

// Helper to safely parse coordinate numbers
export const parseCoord = (value, defaultVal = 0.0) => {
  if (value === null || value === undefined) return defaultVal;
  if (typeof value === 'number') return isNaN(value) ? defaultVal : value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultVal : parsed;
};

// Helper to safely coerce values to string
export const safeString = (val, fallback = '') => {
  if (val === null || val === undefined) return fallback;
  return String(val);
};

// Normalize Citizen Complaint / Road Report Document
export const normalizeReport = (rawReport = {}) => {
  if (!rawReport || typeof rawReport !== 'object') return {};

  const id = safeString(rawReport.id || rawReport.reportId, 'PR-2026-000');
  const reportId = safeString(rawReport.reportId || rawReport.id, id);
  const category = safeString(rawReport.category || rawReport.reportType || rawReport.hazardCategory, 'Pothole');
  const reportType = safeString(rawReport.reportType || rawReport.category, category);
  const description = safeString(rawReport.description, '');

  const lat = parseCoord(rawReport.latitude, 28.6139);
  const lng = parseCoord(rawReport.longitude, 77.2090);
  const defaultLoc = (lat && lng) ? `Geotagged (${lat.toFixed(4)}, ${lng.toFixed(4)})` : 'Location Not Specified';
  const location = safeString(rawReport.location || rawReport.address, defaultLoc);

  const severity = safeString(rawReport.severity, 'Medium');
  const priority = safeString(rawReport.priority, severity === 'Critical' ? 'Critical' : 'Medium');
  const status = safeString(rawReport.status, 'Submitted');
  const verificationStatus = safeString(rawReport.verificationStatus, 'Pending');

  const submittedBy = safeString(rawReport.submittedBy, 'Citizen User');
  const citizenEmail = safeString(rawReport.citizenEmail, 'user@example.com');
  const reporterUid = safeString(rawReport.reporterUid || rawReport.userUid, 'anon-uid');

  const submittedDate = normalizeTimestamp(rawReport.submittedDate || rawReport.createdAt);
  const createdAt = normalizeTimestamp(rawReport.createdAt || rawReport.submittedDate);
  const updatedAt = normalizeTimestamp(rawReport.updatedAt);

  const evidenceImage = safeString(
    rawReport.evidenceImage,
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80'
  );
  const evidenceVideo = rawReport.evidenceVideo ? safeString(rawReport.evidenceVideo) : null;
  const mediaResourceType = safeString(rawReport.mediaResourceType, evidenceVideo ? 'video' : 'image');

  const assignedDepartment = safeString(rawReport.assignedDepartment, 'Pending Assignment');
  const assignedTeam = safeString(rawReport.assignedTeam, 'Pending');
  const workOrderId = rawReport.workOrderId ? safeString(rawReport.workOrderId) : null;
  const hazardId = rawReport.hazardId ? safeString(rawReport.hazardId) : null;

  const timeline = Array.isArray(rawReport.timeline)
    ? rawReport.timeline.map(t => ({
        status: safeString(t?.status, status),
        timestamp: normalizeTimestamp(t?.timestamp),
        note: safeString(t?.note, '')
      }))
    : [
        { status, timestamp: submittedDate, note: 'Report logged in system.' }
      ];

  return {
    ...rawReport,
    id,
    reportId,
    category,
    reportType,
    description,
    latitude: lat,
    longitude: lng,
    location,
    address: location,
    severity,
    priority,
    status,
    verificationStatus,
    submittedBy,
    citizenEmail,
    reporterUid,
    submittedDate,
    createdAt,
    updatedAt,
    evidenceImage,
    evidenceVideo,
    mediaResourceType,
    assignedDepartment,
    assignedTeam,
    workOrderId,
    hazardId,
    timeline
  };
};

// Normalize Road Hazard Record (AI/Sensor Detections)
export const normalizeHazard = (rawHazard = {}) => {
  if (!rawHazard || typeof rawHazard !== 'object') return {};

  const id = safeString(rawHazard.id || rawHazard.hazardId, 'HZ-2026-000');
  const hazardId = safeString(rawHazard.hazardId || rawHazard.id, id);
  const category = safeString(rawHazard.category || rawHazard.reportType, 'Pothole');
  const severity = safeString(rawHazard.severity, 'Medium');
  const confidence = parseCoord(rawHazard.confidence, 0.95);

  const latitude = parseCoord(rawHazard.latitude, 28.6139);
  const longitude = parseCoord(rawHazard.longitude, 77.2090);
  const address = safeString(rawHazard.address || rawHazard.location, `Site Position (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
  const verificationStatus = safeString(rawHazard.verificationStatus, 'Pending');

  const description = safeString(rawHazard.description, '');
  const evidenceImage = safeString(rawHazard.evidenceImage, '');
  const reportId = rawHazard.reportId ? safeString(rawHazard.reportId) : null;
  const complaintId = rawHazard.complaintId ? safeString(rawHazard.complaintId) : reportId;
  const sessionId = safeString(rawHazard.sessionId, 'AI-SURVEY-DIRECT');
  const createdAt = normalizeTimestamp(rawHazard.createdAt || rawHazard.timestamp);

  return {
    ...rawHazard,
    id,
    hazardId,
    category,
    severity,
    confidence,
    latitude,
    longitude,
    address,
    location: address,
    verificationStatus,
    description,
    evidenceImage,
    reportId,
    complaintId,
    sessionId,
    createdAt,
    timestamp: createdAt
  };
};

// Normalize Work Order Document
export const normalizeWorkOrder = (rawWO = {}) => {
  if (!rawWO || typeof rawWO !== 'object') return {};

  const id = safeString(rawWO.id || rawWO.workOrderId, 'WO-2026-000');
  const workOrderId = safeString(rawWO.workOrderId || rawWO.id, id);
  const complaintId = rawWO.complaintId ? safeString(rawWO.complaintId) : null;

  const hazardCategory = safeString(rawWO.hazardCategory || rawWO.category, 'Pothole');
  const location = safeString(rawWO.location || rawWO.address, 'Municipal Carriageway');
  const assignedDepartment = safeString(rawWO.assignedDepartment || rawWO.department, 'PWD Maintenance Division 4');
  const assignedTeam = safeString(rawWO.assignedTeam || rawWO.team, 'Rapid Asphalt Repair Unit A');
  const officerInCharge = safeString(rawWO.officerInCharge || rawWO.officer, 'Er. S. K. Gupta');

  const priority = safeString(rawWO.priority, 'High');
  const status = safeString(rawWO.status, 'In Progress');
  const progress = Math.min(100, Math.max(0, typeof rawWO.progress === 'number' ? rawWO.progress : (parseInt(rawWO.progress, 10) || 0)));
  const targetCompletionDate = safeString(rawWO.targetCompletionDate || rawWO.targetDate, '2026-10-15');
  const workInstructions = safeString(rawWO.workInstructions || rawWO.instructions, 'Conduct road surface restoration.');

  const createdAt = normalizeTimestamp(rawWO.createdAt);
  const updatedAt = normalizeTimestamp(rawWO.updatedAt);

  const activityTimeline = Array.isArray(rawWO.activityTimeline)
    ? rawWO.activityTimeline.map(item => ({
        date: safeString(item?.date, new Date().toLocaleString()),
        text: safeString(item?.text, ''),
        ...(item?.evidenceImage ? { evidenceImage: safeString(item.evidenceImage) } : {})
      }))
    : [
        { date: new Date().toLocaleString(), text: `Work order ${workOrderId} issued to ${assignedTeam}.` }
      ];

  return {
    ...rawWO,
    id,
    workOrderId,
    complaintId,
    hazardCategory,
    category: hazardCategory,
    location,
    assignedDepartment,
    department: assignedDepartment,
    assignedTeam,
    team: assignedTeam,
    officerInCharge,
    officer: officerInCharge,
    priority,
    status,
    progress,
    targetCompletionDate,
    targetDate: targetCompletionDate,
    workInstructions,
    instructions: workInstructions,
    createdAt,
    updatedAt,
    activityTimeline
  };
};

// Normalize Survey Session Record
export const normalizeSurveySession = (rawSurvey = {}) => {
  if (!rawSurvey || typeof rawSurvey !== 'object') return {};

  const id = safeString(rawSurvey.id || rawSurvey.sessionId, 'SUR-2026-000');
  const name = safeString(rawSurvey.name, 'Road Survey Session');
  const roadName = safeString(rawSurvey.roadName, 'Arterial Corridor');
  const area = safeString(rawSurvey.area, 'Municipal Zone');
  const date = safeString(rawSurvey.date, new Date().toISOString().split('T')[0]);
  const processingStatus = safeString(rawSurvey.processingStatus, 'Processing');
  const progressPercent = typeof rawSurvey.progressPercent === 'number' ? rawSurvey.progressPercent : 0;
  const hazardCount = typeof rawSurvey.hazardCount === 'number' ? rawSurvey.hazardCount : 0;

  return {
    ...rawSurvey,
    id,
    sessionId: id,
    name,
    roadName,
    area,
    date,
    processingStatus,
    progressPercent,
    hazardCount
  };
};

// Normalize User Record
export const normalizeUser = (rawUser = {}) => {
  if (!rawUser || typeof rawUser !== 'object') return {};

  const uid = safeString(rawUser.uid || rawUser.userId, 'anon-uid');
  const name = safeString(rawUser.name || rawUser.displayName, 'User');
  const email = safeString(rawUser.email, 'user@example.com');
  const role = safeString(rawUser.role, 'CITIZEN');
  const accountStatus = safeString(rawUser.accountStatus, 'Active');

  return {
    ...rawUser,
    uid,
    userId: uid,
    name,
    displayName: name,
    email,
    role,
    accountStatus
  };
};
