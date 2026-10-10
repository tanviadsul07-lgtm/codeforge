import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layout & Protection
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { ROLES } from '../utils/constants';

// Auth Pages
import { SplashScreen } from '../pages/auth/SplashScreen';
import { WelcomeScreen } from '../pages/auth/WelcomeScreen';
import { LoginScreen } from '../pages/auth/LoginScreen';
import { SignupScreen } from '../pages/auth/SignupScreen';
import { RoleSelectionScreen } from '../pages/auth/RoleSelectionScreen';
import { ForgotPasswordScreen } from '../pages/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../pages/auth/ResetPasswordScreen';
import { EmailVerificationScreen } from '../pages/auth/EmailVerificationScreen';
import { AuthSuccessScreen } from '../pages/auth/AuthSuccessScreen';

// Citizen Pages
import { CitizenDashboard } from '../pages/citizen/CitizenDashboard';
import { ReportHazardScreen } from '../pages/citizen/ReportHazardScreen';
import { MyComplaintsScreen } from '../pages/citizen/MyComplaintsScreen';
import { ComplaintDetailsScreen } from '../pages/citizen/ComplaintDetailsScreen';
import { NearbyHazardsMapScreen } from '../pages/citizen/NearbyHazardsMapScreen';
import { CitizenNotificationsScreen } from '../pages/citizen/CitizenNotificationsScreen';
import { CitizenProfileScreen } from '../pages/citizen/CitizenProfileScreen';
import { EditCitizenProfileScreen } from '../pages/citizen/EditCitizenProfileScreen';
import { ChangePasswordScreen } from '../pages/citizen/ChangePasswordScreen';

// Field Operator Pages
import { FieldOperatorDashboard } from '../pages/field-operator/FieldOperatorDashboard';
import { SurveySessionsScreen } from '../pages/field-operator/SurveySessionsScreen';
import { CreateSurveySessionScreen } from '../pages/field-operator/CreateSurveySessionScreen';
import { VideoGpsUploadScreen } from '../pages/field-operator/VideoGpsUploadScreen';
import { UploadValidationScreen } from '../pages/field-operator/UploadValidationScreen';
import { AiProcessingJobsScreen } from '../pages/field-operator/AiProcessingJobsScreen';
import { AiDetectionResultsScreen } from '../pages/field-operator/AiDetectionResultsScreen';
import { HazardDetailsScreen } from '../pages/field-operator/HazardDetailsScreen';
import { HazardVerificationScreen } from '../pages/field-operator/HazardVerificationScreen';
import { LiveGeoAiScannerScreen } from '../pages/field-operator/LiveGeoAiScannerScreen';
import { FieldOperatorSettingsScreen } from '../pages/field-operator/FieldOperatorSettingsScreen';

// GIS & GeoJSON Pages
import { GisHazardMapScreen } from '../pages/gis/GisHazardMapScreen';
import { GeoJsonExportScreen } from '../pages/gis/GeoJsonExportScreen';

// Department Officer Pages
import { DepartmentDashboard } from '../pages/department/DepartmentDashboard';
import { ComplaintManagementScreen } from '../pages/department/ComplaintManagementScreen';
import { ComplaintReviewScreen } from '../pages/department/ComplaintReviewScreen';
import { HazardVerificationQueueScreen } from '../pages/department/HazardVerificationQueueScreen';
import { RepairAssignmentScreen } from '../pages/department/RepairAssignmentScreen';
import { RepairProgressUpdateScreen } from '../pages/department/RepairProgressUpdateScreen';
import { PriorityQueueScreen } from '../pages/department/PriorityQueueScreen';
import { DepartmentAnalyticsScreen } from '../pages/department/DepartmentAnalyticsScreen';
import { UserManagementScreen } from '../pages/department/UserManagementScreen';
import { DepartmentNotificationsScreen } from '../pages/department/DepartmentNotificationsScreen';
import { DepartmentSettingsScreen } from '../pages/department/DepartmentSettingsScreen';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { SharedComplaintDetails } from '../components/common/SharedComplaintDetails';

// Shared & Error Pages
import { GlobalSearchResultsScreen } from '../pages/shared/GlobalSearchResultsScreen';
import { GeneralSettingsScreen } from '../pages/shared/GeneralSettingsScreen';
import { HelpAndDocsScreen } from '../pages/shared/HelpAndDocsScreen';
import { SystemDiagnosticsScreen } from '../pages/shared/SystemDiagnosticsScreen';
import { NotFoundScreen } from '../pages/errors/NotFoundScreen';
import { MobileCameraScreen } from '../pages/field-operator/MobileCameraScreen';
import { RouteErrorScreen } from '../pages/errors/RouteErrorScreen';

export const router = createBrowserRouter([
  // Public & Auth Routes
  { path: '/', element: <SplashScreen />, errorElement: <RouteErrorScreen /> },
  { path: '/welcome', element: <WelcomeScreen />, errorElement: <RouteErrorScreen /> },
  { path: '/login', element: <LoginScreen />, errorElement: <RouteErrorScreen /> },
  { path: '/signup', element: <SignupScreen />, errorElement: <RouteErrorScreen /> },
  { path: '/role-selection', element: <RoleSelectionScreen />, errorElement: <RouteErrorScreen /> },
  { path: '/select-role', element: <RoleSelectionScreen />, errorElement: <RouteErrorScreen /> },
  { path: '/forgot-password', element: <ForgotPasswordScreen />, errorElement: <RouteErrorScreen /> },
  { path: '/reset-password', element: <ResetPasswordScreen />, errorElement: <RouteErrorScreen /> },
  { path: '/verify-email', element: <EmailVerificationScreen />, errorElement: <RouteErrorScreen /> },
  { path: '/auth-success', element: <AuthSuccessScreen />, errorElement: <RouteErrorScreen /> },
  { path: '/mobile-camera', element: <MobileCameraScreen />, errorElement: <RouteErrorScreen /> },

  // Protected Application Layout Routes
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorScreen />,
    children: [
      // Citizen Routes (Protected by CITIZEN role)
      { path: '/citizen/dashboard', element: <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}><CitizenDashboard /></ProtectedRoute> },
      { path: '/citizen/report-hazard', element: <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}><ReportHazardScreen /></ProtectedRoute> },
      { path: '/citizen/upload', element: <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}><VideoGpsUploadScreen /></ProtectedRoute> },
      { path: '/citizen/jobs', element: <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}><AiProcessingJobsScreen /></ProtectedRoute> },
      { path: '/citizen/results/:jobId', element: <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}><AiDetectionResultsScreen /></ProtectedRoute> },
      { path: '/citizen/complaints', element: <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}><MyComplaintsScreen /></ProtectedRoute> },
      { path: '/citizen/complaints/:id', element: <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}><ComplaintDetailsScreen /></ProtectedRoute> },
      { path: '/citizen/map', element: <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}><NearbyHazardsMapScreen /></ProtectedRoute> },
      { path: '/citizen/notifications', element: <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}><CitizenNotificationsScreen /></ProtectedRoute> },
      { path: '/citizen/profile', element: <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}><CitizenProfileScreen /></ProtectedRoute> },
      { path: '/citizen/profile/edit', element: <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}><EditCitizenProfileScreen /></ProtectedRoute> },
      { path: '/citizen/profile/password', element: <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}><ChangePasswordScreen /></ProtectedRoute> },

      // System Admin Routes (Protected by ADMIN role)
      { path: '/admin/dashboard', element: <ProtectedRoute allowedRoles={[ROLES.ADMIN]}><AdminDashboard /></ProtectedRoute> },
      { path: '/admin/complaints/:id', element: <ProtectedRoute allowedRoles={[ROLES.ADMIN]}><SharedComplaintDetails /></ProtectedRoute> },
      { path: '/admin/users', element: <ProtectedRoute allowedRoles={[ROLES.ADMIN]}><UserManagementScreen /></ProtectedRoute> },

      // Field Operator Routes (Protected by FIELD_OPERATOR role)
      { path: '/operator/dashboard', element: <ProtectedRoute allowedRoles={[ROLES.FIELD_OPERATOR]}><FieldOperatorDashboard /></ProtectedRoute> },
      { path: '/operator/live-scanner', element: <ProtectedRoute allowedRoles={[ROLES.FIELD_OPERATOR, ROLES.CITIZEN, ROLES.DEPARTMENT_OFFICER]}><LiveGeoAiScannerScreen /></ProtectedRoute> },
      { path: '/operator/complaints/:id', element: <ProtectedRoute allowedRoles={[ROLES.FIELD_OPERATOR, ROLES.ADMIN]}><SharedComplaintDetails /></ProtectedRoute> },
      { path: '/operator/surveys', element: <ProtectedRoute allowedRoles={[ROLES.FIELD_OPERATOR]}><SurveySessionsScreen /></ProtectedRoute> },
      { path: '/operator/surveys/create', element: <ProtectedRoute allowedRoles={[ROLES.FIELD_OPERATOR]}><CreateSurveySessionScreen /></ProtectedRoute> },
      { path: '/operator/surveys/:id', element: <ProtectedRoute allowedRoles={[ROLES.FIELD_OPERATOR]}><AiDetectionResultsScreen /></ProtectedRoute> },
      { path: '/operator/upload', element: <ProtectedRoute allowedRoles={[ROLES.FIELD_OPERATOR]}><VideoGpsUploadScreen /></ProtectedRoute> },
      { path: '/operator/upload/validation', element: <ProtectedRoute allowedRoles={[ROLES.FIELD_OPERATOR]}><UploadValidationScreen /></ProtectedRoute> },
      { path: '/operator/jobs', element: <ProtectedRoute allowedRoles={[ROLES.FIELD_OPERATOR]}><AiProcessingJobsScreen /></ProtectedRoute> },
      { path: '/operator/results/:jobId', element: <ProtectedRoute allowedRoles={[ROLES.FIELD_OPERATOR]}><AiDetectionResultsScreen /></ProtectedRoute> },
      { path: '/operator/hazards/:id', element: <ProtectedRoute allowedRoles={[ROLES.FIELD_OPERATOR]}><HazardDetailsScreen /></ProtectedRoute> },
      { path: '/operator/hazards/:id/verify', element: <ProtectedRoute allowedRoles={[ROLES.FIELD_OPERATOR]}><HazardVerificationScreen /></ProtectedRoute> },
      { path: '/operator/gis', element: <ProtectedRoute allowedRoles={[ROLES.FIELD_OPERATOR]}><GisHazardMapScreen /></ProtectedRoute> },
      { path: '/operator/geojson', element: <ProtectedRoute allowedRoles={[ROLES.FIELD_OPERATOR]}><GeoJsonExportScreen /></ProtectedRoute> },
      { path: '/operator/profile', element: <ProtectedRoute allowedRoles={[ROLES.FIELD_OPERATOR]}><CitizenProfileScreen /></ProtectedRoute> },
      { path: '/operator/settings', element: <ProtectedRoute allowedRoles={[ROLES.FIELD_OPERATOR]}><FieldOperatorSettingsScreen /></ProtectedRoute> },

      // GIS & Spatial Routes (Shared Read-Only Telemetry)
      { path: '/gis-map', element: <GisHazardMapScreen /> },
      { path: '/geojson-export', element: <GeoJsonExportScreen /> },
      { path: '/live-scanner', element: <LiveGeoAiScannerScreen /> },

      // Road Department Officer Routes (Protected by ROAD_DEPARTMENT role)
      { path: '/department/dashboard', element: <ProtectedRoute allowedRoles={[ROLES.DEPARTMENT_OFFICER, ROLES.ADMIN]}><DepartmentDashboard /></ProtectedRoute> },
      { path: '/department/complaints', element: <ProtectedRoute allowedRoles={[ROLES.DEPARTMENT_OFFICER, ROLES.ADMIN]}><ComplaintManagementScreen /></ProtectedRoute> },
      { path: '/department/complaints/:id', element: <ProtectedRoute allowedRoles={[ROLES.DEPARTMENT_OFFICER, ROLES.ADMIN]}><SharedComplaintDetails /></ProtectedRoute> },
      { path: '/department/complaints/:id/review', element: <ProtectedRoute allowedRoles={[ROLES.DEPARTMENT_OFFICER, ROLES.ADMIN]}><SharedComplaintDetails /></ProtectedRoute> },
      { path: '/department/verification-queue', element: <ProtectedRoute allowedRoles={[ROLES.DEPARTMENT_OFFICER, ROLES.ADMIN]}><HazardVerificationQueueScreen /></ProtectedRoute> },
      { path: '/department/repair-assignment/:id', element: <ProtectedRoute allowedRoles={[ROLES.DEPARTMENT_OFFICER, ROLES.ADMIN]}><RepairAssignmentScreen /></ProtectedRoute> },
      { path: '/department/repair-progress/:id', element: <ProtectedRoute allowedRoles={[ROLES.DEPARTMENT_OFFICER, ROLES.FIELD_OPERATOR, ROLES.ADMIN]}><RepairProgressUpdateScreen /></ProtectedRoute> },
      { path: '/department/work-orders/:id/update', element: <ProtectedRoute allowedRoles={[ROLES.DEPARTMENT_OFFICER, ROLES.FIELD_OPERATOR, ROLES.ADMIN]}><RepairProgressUpdateScreen /></ProtectedRoute> },
      { path: '/department/resolved/:id', element: <ProtectedRoute allowedRoles={[ROLES.DEPARTMENT_OFFICER, ROLES.ADMIN]}><SharedComplaintDetails /></ProtectedRoute> },
      { path: '/department/priority-queue', element: <ProtectedRoute allowedRoles={[ROLES.DEPARTMENT_OFFICER, ROLES.ADMIN]}><PriorityQueueScreen /></ProtectedRoute> },
      { path: '/department/analytics', element: <ProtectedRoute allowedRoles={[ROLES.DEPARTMENT_OFFICER, ROLES.ADMIN]}><DepartmentAnalyticsScreen /></ProtectedRoute> },
      { path: '/department/users', element: <ProtectedRoute allowedRoles={[ROLES.DEPARTMENT_OFFICER, ROLES.ADMIN]}><UserManagementScreen /></ProtectedRoute> },
      { path: '/department/notifications', element: <ProtectedRoute allowedRoles={[ROLES.DEPARTMENT_OFFICER, ROLES.ADMIN]}><DepartmentNotificationsScreen /></ProtectedRoute> },
      { path: '/department/settings', element: <ProtectedRoute allowedRoles={[ROLES.DEPARTMENT_OFFICER, ROLES.ADMIN]}><DepartmentSettingsScreen /></ProtectedRoute> },
      { path: '/department/profile', element: <ProtectedRoute allowedRoles={[ROLES.DEPARTMENT_OFFICER, ROLES.ADMIN]}><CitizenProfileScreen /></ProtectedRoute> },

      // Shared System Routes
      { path: '/notifications', element: <CitizenNotificationsScreen /> },
      { path: '/search', element: <GlobalSearchResultsScreen /> },
      { path: '/settings', element: <GeneralSettingsScreen /> },
      { path: '/help', element: <HelpAndDocsScreen /> },
      { path: '/diagnostics', element: <SystemDiagnosticsScreen /> },
      { path: '/profile', element: <CitizenProfileScreen /> },
      { path: '/profile/edit', element: <EditCitizenProfileScreen /> },
      { path: '/profile/password', element: <ChangePasswordScreen /> },
    ]
  },

  // 404 Catch-All
  { path: '*', element: <NotFoundScreen /> }
]);
