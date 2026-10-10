import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let pageName = '';

    if (path === '/' || path === '/splash') pageName = 'Your Intelligent Road Protector';
    else if (path === '/welcome') pageName = 'Welcome';
    else if (path === '/login') pageName = 'Sign In';
    else if (path === '/signup') pageName = 'Create Account';
    else if (path === '/role-selection') pageName = 'Select Portal Role';
    else if (path.includes('/citizen/dashboard')) pageName = 'Citizen Dashboard';
    else if (path.includes('/citizen/report-hazard')) pageName = 'Report Hazard';
    else if (path.includes('/citizen/complaints')) pageName = 'My Complaints';
    else if (path.includes('/citizen/map')) pageName = 'Nearby Hazards Map';
    else if (path.includes('/operator/dashboard')) pageName = 'Field Operator Dashboard';
    else if (path.includes('/operator/upload')) pageName = 'Video & GPS Upload';
    else if (path.includes('/operator/jobs')) pageName = 'AI Processing Jobs';
    else if (path.includes('/operator/gis') || path.includes('/gis-map')) pageName = 'GIS Hazard Intelligence Map';
    else if (path.includes('/department/dashboard')) pageName = 'Department Control Center';
    else if (path.includes('/department/complaints')) pageName = 'Complaint Management';
    else if (path.includes('/department/work-orders')) pageName = 'Repair Work Orders';
    else if (path.includes('/department/analytics')) pageName = 'Department Analytics';
    else if (path.includes('/geojson')) pageName = 'GeoJSON Spatial Export';
    else pageName = 'Your Intelligent Road Protector';

    document.title = `PathRakshak AI | ${pageName}`;
  }, [location]);
};
