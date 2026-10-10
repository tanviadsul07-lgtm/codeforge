import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { ROLES } from '../utils/constants';
import { withTimeout } from '../utils/timeout';

// Helper to format user-friendly Firebase Auth error messages
const formatAuthError = (errorCode, defaultMessage) => {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email address or password. Please check your credentials.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please log in.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact system support.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a few minutes before trying again.';
    case 'auth/network-request-failed':
    case 'auth/timeout':
      return 'Network communication timeout. Please check your connection and try again.';
    default:
      return defaultMessage || 'Authentication error occurred. Please try again.';
  }
};

// Pre-configured Demo Accounts Map for auto-provisioning test accounts in Firebase Auth
const DEMO_ACCOUNTS_MAP = {
  'citizen@pathrakshak.ai': { role: ROLES.CITIZEN, name: 'Aarav Sharma (Citizen Demo)' },
  'operator@pathrakshak.ai': { role: ROLES.FIELD_OPERATOR, name: 'Vikram Malhotra (Field Operator Demo)' },
  'department@pathrakshak.ai': { role: ROLES.DEPARTMENT_OFFICER, name: 'Dr. Rajesh Verma (Department Officer Demo)' },
  'admin@pathrakshak.ai': { role: ROLES.ADMIN, name: 'System Administrator (Admin Demo)' },
  'aarav.sharma@example.com': { role: ROLES.CITIZEN, name: 'Aarav Sharma' },
  'vikram.m@pathrakshak.gov.in': { role: ROLES.FIELD_OPERATOR, name: 'Vikram Malhotra' },
  'r.verma@pwd.gov.in': { role: ROLES.DEPARTMENT_OFFICER, name: 'Dr. Rajesh Verma' },
  'admin@pwd.gov.in': { role: ROLES.ADMIN, name: 'System Administrator' }
};

export const authService = {
  // Listen to Auth State Changes
  onAuthChange(callback) {
    console.log('[AuthStage] Initializing onAuthStateChanged listener');
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log(`[AuthStage] Auth state active for UID: ${user.uid}`);
        try {
          // Attempt to fetch profile with timeout to prevent hanging onAuthStateChanged
          const userDoc = await withTimeout(
            getDoc(doc(db, 'users', user.uid)),
            6000,
            'Firestore User Profile Fetch'
          ).catch(err => {
            console.warn('[AuthStage] Firestore profile fetch deferred/timed out:', err.message);
            return null;
          });

          let profile = (userDoc && userDoc.exists && userDoc.exists()) ? userDoc.data() : null;
          
          if (!profile) {
            const demoInfo = user.email ? DEMO_ACCOUNTS_MAP[user.email.toLowerCase()] : null;
            profile = {
              uid: user.uid,
              displayName: demoInfo ? demoInfo.name : (user.displayName || 'Citizen Contributor'),
              email: user.email,
              role: demoInfo ? demoInfo.role : ROLES.CITIZEN,
              accountStatus: 'ACTIVE',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            // Non-blocking firestore profile save attempt
            withTimeout(setDoc(doc(db, 'users', user.uid), profile), 6000, 'Firestore Set Profile')
              .catch(err => console.warn('[AuthStage] Async profile set deferred:', err.message));
          }
          
          callback({ firebaseUser: user, profile });
        } catch (err) {
          console.warn('[AuthStage] Firestore profile resolution warning:', err.message);
          callback({
            firebaseUser: user,
            profile: { uid: user.uid, email: user.email, role: ROLES.CITIZEN, displayName: user.displayName || 'Citizen' }
          });
        }
      } else {
        console.log('[AuthStage] Auth state unauthenticated');
        callback(null);
      }
    });
  },

  // Register New User
  async register({ email, password, fullName }) {
    console.log('[AuthStage 1/3] Starting user registration');
    try {
      // Step 1: Firebase Auth user creation with timeout
      const userCredential = await withTimeout(
        createUserWithEmailAndPassword(auth, email, password),
        10000,
        'Firebase User Registration'
      );
      const user = userCredential.user;
      console.log(`[AuthStage 2/3] Firebase Auth account created for UID: ${user.uid}`);

      if (fullName) {
        updateProfile(user, { displayName: fullName }).catch(() => {});
      }

      // Step 2: Prepare profile object (PUBLIC REGISTRATION ALWAYS RECEIVES CITIZEN)
      const profile = {
        uid: user.uid,
        displayName: fullName || 'Citizen Contributor',
        email: user.email,
        role: ROLES.CITIZEN,
        accountStatus: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Step 3: Write Firestore profile document with safe timeout & partial failure tolerance
      try {
        await withTimeout(
          setDoc(doc(db, 'users', user.uid), profile),
          8000,
          'Firestore Profile Creation'
        );
        console.log('[AuthStage 3/3] Firestore profile document created successfully');
      } catch (fsErr) {
        console.warn('[AuthStage 3/3 Partial Failure] Firestore profile write timed out/failed, account created in Auth:', fsErr.message);
      }

      return { success: true, user, profile };
    } catch (error) {
      console.error('[AuthStage Error] Registration failed:', error.code || 'UNKNOWN', error.message);
      return {
        success: false,
        code: error.code || 'auth/unknown',
        error: formatAuthError(error.code, error.message)
      };
    }
  },

  // Login Existing User (with auto-provisioning for demo credentials)
  async login(email, password) {
    console.log('[AuthStage 1/2] Starting user login');
    const normalizedEmail = (email || '').trim().toLowerCase();

    try {
      let userCredential;
      try {
        userCredential = await withTimeout(
          signInWithEmailAndPassword(auth, email, password),
          10000,
          'Firebase Login'
        );
      } catch (signInErr) {
        // If demo account sign-in fails due to missing account in Firebase Auth, auto-provision it
        if (DEMO_ACCOUNTS_MAP[normalizedEmail] && (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential')) {
          console.log(`[AuthStage Demo Auto-Provision] Provisioning demo account: ${normalizedEmail}`);
          userCredential = await withTimeout(
            createUserWithEmailAndPassword(auth, email, password),
            10000,
            'Firebase Demo User Auto-Creation'
          );
          const demoInfo = DEMO_ACCOUNTS_MAP[normalizedEmail];
          const demoProfile = {
            uid: userCredential.user.uid,
            displayName: demoInfo.name,
            email: userCredential.user.email,
            role: demoInfo.role,
            accountStatus: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'users', userCredential.user.uid), demoProfile).catch(e => console.warn('Demo profile set error:', e.message));
          return { success: true, user: userCredential.user, profile: demoProfile };
        }
        throw signInErr;
      }

      const user = userCredential.user;
      console.log(`[AuthStage 2/2] Firebase Auth login successful for UID: ${user.uid}`);
      
      let profile = null;
      
      try {
        const userDoc = await withTimeout(getDoc(doc(db, 'users', user.uid)), 6000, 'Fetch Firestore Profile');
        if (userDoc && userDoc.exists && userDoc.exists()) {
          profile = userDoc.data();
        }
      } catch (fsErr) {
        console.warn('[AuthStage Login Profile Warning] Could not fetch profile from Firestore, using fallback:', fsErr.message);
      }

      if (!profile) {
        const demoInfo = DEMO_ACCOUNTS_MAP[normalizedEmail];
        profile = {
          uid: user.uid,
          email: user.email,
          role: demoInfo ? demoInfo.role : ROLES.CITIZEN,
          displayName: demoInfo ? demoInfo.name : (user.displayName || 'Citizen'),
          accountStatus: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        setDoc(doc(db, 'users', user.uid), profile).catch(e => console.warn('[AuthStage] Non-blocking profile write deferred:', e.message));
      }
      
      return { success: true, user, profile };
    } catch (error) {
      console.error('[AuthStage Error] Login failed:', error.code || 'UNKNOWN', error.message);
      return {
        success: false,
        code: error.code || 'auth/unknown',
        error: formatAuthError(error.code, error.message)
      };
    }
  },

  // Logout
  async logout() {
    console.log('[AuthStage] Logging out');
    try {
      await withTimeout(signOut(auth), 5000, 'Firebase SignOut');
      return { success: true };
    } catch (error) {
      console.error('[AuthStage Error] Logout failed:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Reset Password
  async resetPassword(email) {
    console.log('[AuthStage] Sending password reset email');
    try {
      await withTimeout(sendPasswordResetEmail(auth, email), 10000, 'Password Reset Email');
      return { success: true };
    } catch (error) {
      console.error('[AuthStage Error] Reset password failed:', error.code, error.message);
      return {
        success: false,
        code: error.code || 'auth/unknown',
        error: formatAuthError(error.code, error.message)
      };
    }
  },

  // Update Profile
  async updateUserProfile(uid, fields) {
    try {
      const safeFields = { ...fields };
      delete safeFields.role;
      delete safeFields.accountStatus;

      await withTimeout(
        updateDoc(doc(db, 'users', uid), {
          ...safeFields,
          updatedAt: new Date().toISOString()
        }),
        8000,
        'Update Profile'
      );
      return { success: true };
    } catch (error) {
      console.error('[AuthStage Error] Update profile failed:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Get Auth Token
  async getIdToken() {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  }
};
