/**
 * PAAT - AI Personal Assistant Agent Tool
 * Main Content Area Component with Routing
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

// Import page components
import Dashboard from '../Dashboard/Dashboard';
import ProjectsPage from '../Projects/ProjectsPage';
import ProjectDetailsPage from '../Projects/ProjectDetailsPage';
import MonitoringPage from '../Monitoring/MonitoringPage';

const MainContent: React.FC = () => {
  return (
    <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Routes>
        {/* Dashboard Route */}
        <Route path="/" element={<Dashboard />} />
        
        {/* Projects Routes */}
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
        
        {/* Monitoring Routes */}
        <Route path="/monitoring" element={<MonitoringPage />} />
        
        {/* Tasks Routes */}
        <Route path="/tasks" element={<Dashboard />} />
        
        {/* Settings Routes */}
        <Route path="/settings" element={<Dashboard />} />
        
        {/* Default redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  );
};

export default MainContent;
