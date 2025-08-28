import React, { lazy, Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';

// Lazy load Settings components to improve initial bundle size
const SettingsPageLazy = lazy(() => import('./SettingsPage'));
const GeneralSettingsLazy = lazy(() => import('./GeneralSettings'));
const ThemeSettingsLazy = lazy(() => import('./ThemeSettings'));
const AIServiceSettingsLazy = lazy(() => import('./AIServiceSettings'));
const ProjectSettingsLazy = lazy(() => import('./ProjectSettings'));
const AdvancedSettingsLazy = lazy(() => import('./AdvancedSettings'));

// Loading fallback component
const SettingsLoader: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px',
    }}
  >
    <CircularProgress size={40} />
  </Box>
);

// Wrapper components with Suspense
export const LazySettingsPage: React.FC = () => (
  <Suspense fallback={<SettingsLoader />}>
    <SettingsPageLazy />
  </Suspense>
);

export const LazyGeneralSettings: React.FC = () => (
  <Suspense fallback={<SettingsLoader />}>
    <GeneralSettingsLazy />
  </Suspense>
);

export const LazyThemeSettings: React.FC = () => (
  <Suspense fallback={<SettingsLoader />}>
    <ThemeSettingsLazy />
  </Suspense>
);

export const LazyAIServiceSettings: React.FC = () => (
  <Suspense fallback={<SettingsLoader />}>
    <AIServiceSettingsLazy />
  </Suspense>
);

export const LazyProjectSettings: React.FC = () => (
  <Suspense fallback={<SettingsLoader />}>
    <ProjectSettingsLazy />
  </Suspense>
);

export const LazyAdvancedSettings: React.FC = () => (
  <Suspense fallback={<SettingsLoader />}>
    <AdvancedSettingsLazy />
  </Suspense>
);

// Default export for the main Settings page
export default LazySettingsPage;
