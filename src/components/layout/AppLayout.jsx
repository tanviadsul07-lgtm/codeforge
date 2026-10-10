import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { usePageTitle } from '../../hooks/usePageTitle';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  usePageTitle();

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="app-content animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
