import React, { lazy, Suspense } from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

// Import the ProjectWizardData interface
import type { ProjectWizardData } from './ProjectWizard';

// Lazy load ProjectWizard components
const ProjectWizardLazy = lazy(() => import('./ProjectWizard'));

// Props interface for the LazyProjectWizard
interface LazyProjectWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (data: ProjectWizardData) => void;
}

// Loading fallback component with better UX
const ProjectWizardLoader: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '400px',
      gap: 2,
    }}
  >
    <CircularProgress size={48} />
    <Typography variant="body1" color="text.secondary">
      Loading Project Creation Wizard...
    </Typography>
  </Box>
);

// Main lazy wrapper component
export const LazyProjectWizard: React.FC<LazyProjectWizardProps> = (props) => (
  <Suspense fallback={<ProjectWizardLoader />}>
    <ProjectWizardLazy {...props} />
  </Suspense>
);

// Default export
export default LazyProjectWizard;
