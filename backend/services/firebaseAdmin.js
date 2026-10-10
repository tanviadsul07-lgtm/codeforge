import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../serviceAccountKey.json');

if (!admin.apps.length) {
  try {
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID
      });
      console.log(`[Firebase Admin] Initialized with Service Account: ${serviceAccount.project_id}`);
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || 'pathrakshak-63a01'
      });
      console.log('[Firebase Admin] Initialized with Application Default Credentials');
    }
  } catch (err) {
    console.warn('[Firebase Admin] Credential initialization warning:', err.message);
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'pathrakshak-63a01'
    });
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();

// Middleware to verify Firebase ID tokens
export const verifyAuthToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing or malformed Authorization header' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Fetch profile from Firestore to ensure updated role check
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const userProfile = userDoc.exists ? userDoc.data() : {};

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: userProfile.role || 'CITIZEN',
      displayName: userProfile.displayName || decodedToken.name || 'User'
    };
    next();
  } catch (error) {
    console.error('[Auth Middleware] Token verification failed:', error.message);
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired Firebase ID token' });
  }
};

// Middleware to enforce specific roles
export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Requires one of [${allowedRoles.join(', ')}] privileges`
      });
    }
    next();
  };
};
