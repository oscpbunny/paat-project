import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Box,
  Alert,
  Skeleton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Palette as PaletteIcon,
  SmartToy as AIIcon,
  Folder as ProjectIcon,
  Code as CodeIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Refresh as ResetIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import { useSettingsStore } from '../../stores/settingsStore';
import { SettingsTab, SettingsTabInfo } from '../../types/settings';
import GeneralSettings from './GeneralSettings';
import ThemeSettings from './ThemeSettings';
import AIServiceSettings from './AIServiceSettings';
import ProjectSettings from './ProjectSettings';
import AdvancedSettings from './AdvancedSettings';

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  value: SettingsTab;
  currentValue: SettingsTab;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, currentValue }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== currentValue}
      id={`settings-tabpanel-${value}`}
      aria-labelledby={`settings-tab-${value}`}
    >
      {value === currentValue && (
        <AnimatePresence mode="wait">
          <motion.div
            key={value}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Box sx={{ py: 3, px: 1 }}>
              {children}
            </Box>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const {
    settings,
    isLoading,
    isInitialized,
    error,
    resetSettings,
    exportSettings,
    importSettings,
    validateSettings,
  } = useSettingsStore();

  // Settings tab configuration
  const tabs: SettingsTabInfo[] = [
    {
      id: 'general',
      label: 'General',
      icon: SettingsIcon,
      description: 'Basic application preferences and behavior',
    },
    {
      id: 'theme',
      label: 'Appearance',
      icon: PaletteIcon,
      description: 'Theme, colors, and visual customization',
    },
    {
      id: 'ai',
      label: 'AI Services',
      icon: AIIcon,
      description: 'Configure Ollama and Vamsh AI integrations',
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: ProjectIcon,
      description: 'Project management and file handling preferences',
    },
    {
      id: 'advanced',
      label: 'Advanced',
      icon: CodeIcon,
      description: 'Developer settings and advanced options',
    },
  ];

  // Show snackbar message
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: SettingsTab) => {
    setActiveTab(newValue);
  };

  // Handle settings reset
  const handleResetSettings = async () => {
    try {
      await resetSettings();
      setResetDialogOpen(false);
      showSnackbar('Settings have been reset to defaults', 'success');
    } catch (error) {
      console.error('Failed to reset settings:', error);
      showSnackbar('Failed to reset settings', 'error');
    }
  };

  // Handle settings export
  const handleExportSettings = () => {
    try {
      const exportData = exportSettings();
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `paat-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showSnackbar('Settings exported successfully', 'success');
    } catch (error) {
      console.error('Failed to export settings:', error);
      showSnackbar('Failed to export settings', 'error');
    }
  };

  // Handle settings import
  const handleImportSettings = async () => {
    if (!importData.trim()) {
      showSnackbar('Please paste settings data to import', 'warning');
      return;
    }

    try {
      const result = await importSettings(importData);
      
      if (result.isValid) {
        setImportDialogOpen(false);
        setImportData('');
        showSnackbar(
          result.warnings.length > 0 
            ? `Settings imported with ${result.warnings.length} warnings`
            : 'Settings imported successfully',
          result.warnings.length > 0 ? 'warning' : 'success'
        );
      } else {
        showSnackbar(
          `Import failed: ${result.errors.map(e => e.message).join(', ')}`,
          'error'
        );
      }
    } catch (error) {
      console.error('Failed to import settings:', error);
      showSnackbar('Failed to import settings', 'error');
    }
  };

  // Handle file import
  const handleImportFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
    };
    reader.readAsText(file);
  };

  // Validate settings on mount and when settings change
  useEffect(() => {
    if (isInitialized && !isLoading) {
      const validation = validateSettings();
      if (!validation.isValid) {
        showSnackbar(
          `Settings validation issues: ${validation.errors.length} errors, ${validation.warnings.length} warnings`,
          'warning'
        );
      }
    }
  }, [isInitialized, isLoading, settings, validateSettings]);

  // Show loading state
  if (isLoading || !isInitialized) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rectangular" height={600} sx={{ mt: 2 }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Customize your PAAT experience
        </Typography>
      </Box>

      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Settings panel */}
      <Paper elevation={1} sx={{ overflow: 'hidden' }}>
        {/* Action buttons */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleExportSettings}
            variant="outlined"
          >
            Export
          </Button>
          <Button
            size="small"
            startIcon={<UploadIcon />}
            onClick={() => setImportDialogOpen(true)}
            variant="outlined"
          >
            Import
          </Button>
          <Button
            size="small"
            startIcon={<ResetIcon />}
            onClick={() => setResetDialogOpen(true)}
            variant="outlined"
            color="warning"
          >
            Reset
          </Button>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 72,
              textTransform: 'none',
            },
          }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              label={
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ fontSize: '1.25rem', display: 'flex' }}>
                    <tab.icon />
                  </Box>
                  <Typography variant="caption">{tab.label}</Typography>
                </Box>
              }
              value={tab.id}
              id={`settings-tab-${tab.id}`}
              aria-controls={`settings-tabpanel-${tab.id}`}
            />
          ))}
        </Tabs>

        {/* Tab content */}
        <TabPanel value="general" currentValue={activeTab}>
          <GeneralSettings />
        </TabPanel>

        <TabPanel value="theme" currentValue={activeTab}>
          <ThemeSettings />
        </TabPanel>

        <TabPanel value="ai" currentValue={activeTab}>
          <AIServiceSettings />
        </TabPanel>

        <TabPanel value="projects" currentValue={activeTab}>
          <ProjectSettings />
        </TabPanel>

        <TabPanel value="advanced" currentValue={activeTab}>
          <AdvancedSettings />
        </TabPanel>
      </Paper>

      {/* Reset confirmation dialog */}
      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reset Settings</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reset all settings to their default values? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleResetSettings} color="warning" variant="contained">
            Reset All Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import settings dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Import Settings</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Import settings from a previously exported configuration file or paste the settings data directly.
          </Typography>
          
          <input
            accept=".json"
            style={{ display: 'none' }}
            id="import-file-input"
            type="file"
            onChange={handleImportFromFile}
          />
          <label htmlFor="import-file-input">
            <Button variant="outlined" component="span" sx={{ mb: 2 }}>
              Choose File
            </Button>
          </label>
          
          <TextField
            multiline
            rows={10}
            fullWidth
            label="Settings JSON"
            placeholder="Paste settings JSON here..."
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            sx={{ fontFamily: 'monospace' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleImportSettings} variant="contained" disabled={!importData.trim()}>
            Import Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SettingsPage;
