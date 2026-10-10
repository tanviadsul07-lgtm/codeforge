# PathRakshak AI — Complete Full-Stack Setup & Deployment Guide
> **Your Intelligent Road Protector** — End-to-end civic road hazard detection, geospatial GIS mapping, Cloudinary media pipeline, Express backend, and Firebase integration.

---

## 🏗️ 1. ARCHITECTURE OVERVIEW

- **Frontend**: React 18, Vite 5, React Router v6, Leaflet (OpenStreetMap), Recharts, Lucide React icons.
- **Backend API Server**: Node.js, Express, Firebase Admin SDK, Cloudinary Node SDK.
- **Authentication**: Firebase Authentication (Email & Password, Auth State Listener, ID Token verification).
- **Cloud Database**: Cloud Firestore (`users`, `roadReports`, `hazards`, `workOrders`, `mediaAssets`, `notifications`).
- **Media Storage**: Cloudinary (Signed upload signatures generated on Express backend).
- **AI Computer Vision**: Python FastAPI & OpenCV microservice (or internal heuristic CV fallback) for road defect inferencing & GPX/CSV trajectory timestamp alignment.

---

## 🛠️ 2. SYSTEM DEPENDENCIES & INVENTORY

### A. Frontend Dependencies (`package.json`)
- `firebase`: Firebase Web SDK v13
- `leaflet` & `react-leaflet`: OpenStreetMap GIS mapping
- `lucide-react`: Modern UI icons
- `react` & `react-dom`: v18.3
- `react-router-dom`: v6.26
- `recharts`: Analytics charting

### B. Backend Dependencies (`backend/package.json`)
- `express`: REST API web framework
- `firebase-admin`: Server-side trusted database & token verification
- `cloudinary`: Cloudinary server SDK for signed uploads
- `cors`, `dotenv`, `express-rate-limit`, `multer`, `axios`

### C. AI Microservice Dependencies (`ai-service/requirements.txt`)
- `fastapi`, `uvicorn`, `pydantic`, `opencv-python`, `numpy`

---

## 📁 3. FILE INVENTORY & CHANGES

### New & Modified Files Created:
1. `backend/server.js` — Main Express server & API route mounts.
2. `backend/routes/authRoutes.js` — Auth verification & RBAC role assignment.
3. `backend/routes/reportsRoutes.js` — Road report creation & listing.
4. `backend/routes/uploadRoutes.js` — Signed Cloudinary upload signatures & asset registry.
5. `backend/routes/workOrdersRoutes.js` — Repair work order creation & progress updates.
6. `backend/routes/aiRoutes.js` — Computer vision video analysis job queue.
7. `backend/services/firebaseAdmin.js` — Trusted Firebase Admin SDK initialization & token verification.
8. `backend/services/cloudinaryAdmin.js` — Cloudinary HMAC SHA1 signing.
9. `backend/services/cvEngine.js` — Computer vision feature extraction & GPX telemetry alignment.
10. `ai-service/app.py` — Python FastAPI OpenCV hazard detector.
11. `firestore.rules` — Strict Role-Based Access Control security rules.
12. `firestore.indexes.json` — Composite index definitions.
13. `src/services/authService.js` — Real Firebase client web auth.
14. `src/services/dbService.js` — Firestore real-time subscriptions & writes.
15. `src/services/cloudinaryService.js` — Frontend signed media upload handler.
16. `.env.local` & `backend/.env` — Environment secret configurations.
17. `.gitignore` — Security rules to prevent accidental credential commits.

---

## 🔑 4. ENVIRONMENT & CREDENTIAL CONFIGURATION

### A. Frontend Environment File
**Location**: `c:\Users\jsand\OneDrive\Desktop\fusion26\.env.local`

```env
VITE_APP_NAME="PathRakshak AI"
VITE_APP_TAGLINE="Your Intelligent Road Protector"

# Firebase Client Web Configuration
VITE_FIREBASE_API_KEY="YOUR_FIREBASE_WEB_API_KEY"
VITE_FIREBASE_AUTH_DOMAIN="pathrakshak-63a01.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="pathrakshak-63a01"
VITE_FIREBASE_STORAGE_BUCKET="pathrakshak-63a01.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="111824822797099211002"
VITE_FIREBASE_APP_ID="1:111824822797099211002:web:pathrakshak"

# API & Cloudinary Configuration
VITE_API_BASE_URL="http://localhost:5000/api"
VITE_CLOUDINARY_CLOUD_NAME="pathrakshak"
VITE_CLOUDINARY_UPLOAD_PRESET="pathrakshak_uploads"
```

### B. Backend Environment File
**Location**: `c:\Users\jsand\OneDrive\Desktop\fusion26\backend\.env`

```env
PORT=5000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:3000
FIREBASE_PROJECT_ID=pathrakshak-63a01
GOOGLE_APPLICATION_CREDENTIALS=serviceAccountKey.json

# Cloudinary Server Secrets (SERVER ONLY - DO NOT EXPOSE TO FRONTEND)
CLOUDINARY_CLOUD_NAME=pathrakshak
CLOUDINARY_API_KEY=311494319942591
CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_SERVER_SECRET

AI_SERVICE_URL=http://localhost:8000
```

### C. Firebase Admin Service Account Key
**Location**: `c:\Users\jsand\OneDrive\Desktop\fusion26\backend\serviceAccountKey.json`
*(Explicity ignored by `.gitignore`)*

---

## ⚡ 5. STEP-BY-STEP RUNNING & TESTING INSTRUCTIONS

### Step 1: Install Dependencies
Open terminal in the project directory:

```bash
# Install Frontend Dependencies
npm install

# Install Backend Dependencies
cd backend
npm install
cd ..
```

### Step 2: Start Backend Server
In Terminal 1 (Backend):
```bash
cd backend
npm start
```
*Backend runs on `http://localhost:5000` with Health Check at `http://localhost:5000/api/health`.*

### Step 3: Start AI Microservice (Optional)
In Terminal 2 (AI Service):
```bash
cd ai-service
pip install -r requirements.txt
python app.py
```
*AI service runs on `http://localhost:8000`.*

### Step 4: Start Frontend Vite App
In Terminal 3 (Frontend):
```bash
npm run dev
```
*Frontend runs at `http://localhost:3000`.*

---

## 🧪 6. END-TO-END VERIFICATION WORKFLOWS

1. **User Registration & Auth**:
   - Navigate to `http://localhost:3000/signup`.
   - Register a new citizen account.
   - Verify user profile is created in Firebase Auth & Firestore `users/{uid}` with role `CITIZEN`.

2. **Citizen Road Hazard Report**:
   - Go to **Report Road Hazard** (`/citizen/report-hazard`).
   - Select category, fill description, add location, and upload photo evidence.
   - The photo is uploaded via signed signature to Cloudinary.
   - The report is written to Firestore `roadReports` and immediately rendered on the **GIS Hazard Map**.

3. **Field Operator AI Video & GPS Audit**:
   - Switch role to **Field Operator** in the sidebar.
   - Go to **Upload Video & GPS** (`/operator/upload`).
   - Upload dashcam video and GPX trajectory file.
   - Click **Validate Upload & Start AI Inference**.
   - The backend runs computer vision inference, aligns detections with GPX timestamps, and stores hazards in Firestore.

4. **Road Department Review & Work Order Dispatch**:
   - Switch role to **Road Department Officer**.
   - Navigate to **Complaint Management** (`/department/complaints`).
   - Click **Assign** on a report to issue a Work Order.
   - Select repair crew, priority, and completion date.
   - The work order is saved to Firestore `workOrders` and updates the citizen's complaint timeline in real time.

5. **Client-Side GeoJSON Export**:
   - Go to **GeoJSON Export** (`/geojson-export`).
   - Click **Download GeoJSON File**.
   - Valid RFC 7946 GeoJSON containing WGS-84 `[longitude, latitude]` points is generated and downloaded to your computer.

---

## 🛡️ 7. DEPLOYMENT & SECURITY RULES

1. **Firestore Security Rules**:
   Deploy `firestore.rules` using Firebase CLI:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Firestore Indexes**:
   Deploy composite indexes using `firestore.indexes.json`:
   ```bash
   firebase deploy --only firestore:indexes
   ```

3. **Production Deployment**:
   - **Frontend**: Deploy `dist/` bundle to Vercel, Netlify, or Firebase Hosting.
   - **Backend**: Deploy `backend/` to Railway, Render, GCP Cloud Run, or AWS App Runner. Store `CLOUDINARY_API_SECRET` and `GOOGLE_APPLICATION_CREDENTIALS` as environment secrets in hosting provider settings.
