import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Alert,
  InputAdornment,
  IconButton,
  Tooltip,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Folder as ProjectIcon,
  FolderOpen as FolderOpenIcon,
  Backup as BackupIcon,
  Save as SaveIcon,
  History as HistoryIcon,
  Visibility as VisibilityIcon,
  Schedule as ScheduleIcon,
  Storage as StorageIcon,
  CleaningServices as CleanIcon,
} from '@mui/icons-material';

import { useSettingsStore } from '../../stores/settingsStore';

const ProjectSettings: React.FC = () => {
  const { settings, updateSettings } = useSettingsStore();
  const [pathDialogOpen, setPathDialogOpen] = useState(false);
  const [customPath, setCustomPath] = useState('');
  
  // Project path handlers
  const handleDefaultPathChange = (path: string) => {
    updateSettings('projects.defaultPath', path);
  };
  
  const handleSelectPath = async () => {
    // In a real Electron app, this would use dialog.showOpenDialog
    // For now, we'll use a simple text input
    setCustomPath(settings.projects?.defaultPath || '');
    setPathDialogOpen(true);
  };
  
  const handlePathDialogConfirm = () => {
    if (customPath.trim()) {
      handleDefaultPathChange(customPath.trim());
    }
    setPathDialogOpen(false);
  };
  
  // Backup settings handlers
  const handleBackupEnabledChange = (enabled: boolean) => {
    updateSettings('projects.backupEnabled', enabled);
  };
  
  const handleBackupIntervalChange = (interval: number) => {
    updateSettings('projects.backupInterval', interval * 60); // Convert minutes to seconds
  };
  
  // Other settings handlers
  const handleMaxRecentProjectsChange = (max: number) => {
    updateSettings('projects.maxRecentProjects', max);
  };
  
  const handleAutoSaveChange = (autoSave: boolean) => {
    updateSettings('projects.autoSave', autoSave);
  };
  
  const handleShowHiddenFilesChange = (showHidden: boolean) => {
    updateSettings('projects.showHiddenFiles', showHidden);
  };
  
  // Helper functions
  const formatInterval = (seconds: number) => {
    const minutes = seconds / 60;
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = minutes / 60;
    if (hours < 24) {
      return `${hours} hours`;
    }
    const days = hours / 24;
    return `${days} days`;
  };
  
  const getDefaultProjectsPath = () => {
    // In a real Electron app, this would use os.homedir()
    return 'C:\\Users\\QC\\Documents\\PAAT Projects';
  };

  return (
    <Stack spacing={3}>
      {/* Project Location */}
      <Card>
        <CardHeader 
          title="Project Location" 
          subheader="Default location for new projects and workspace management"
          avatar={<ProjectIcon color="primary" />}
        />
        <CardContent>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Default Project Directory
              </Typography>
              <TextField
                label="Project Path"
                value={settings.projects?.defaultPath || getDefaultProjectsPath()}
                onChange={(e) => handleDefaultPathChange(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start"><FolderOpenIcon /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Browse Folder">
                        <IconButton onClick={handleSelectPath} size="small">
                          <FolderOpenIcon />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
                helperText="This is where new projects will be created by default"
              />
            </Box>
            
            <Alert severity="info">
              PAAT will create new projects in this directory. You can always choose 
              a different location when creating individual projects.
            </Alert>
          </Stack>
        </CardContent>
      </Card>

      {/* Backup Configuration */}
      <Card>
        <CardHeader 
          title="Backup & Recovery" 
          subheader="Automatic backup configuration for project safety"
          avatar={<BackupIcon color="primary" />}
          action={
            <FormControlLabel
              control={
                <Switch
                  checked={settings.projects?.backupEnabled || false}
                  onChange={(e) => handleBackupEnabledChange(e.target.checked)}
                />
              }
              label="Enable Backups"
              labelPlacement="start"
            />
          }
        />
        <CardContent>
          <Stack spacing={3}>
            {settings.projects?.backupEnabled && (
              <>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Backup Interval: {formatInterval(settings.projects?.backupInterval || 3600)}
                  </Typography>
                  <Slider
                    value={(settings.projects?.backupInterval || 3600) / 60} // Convert to minutes
                    onChange={(_, value) => handleBackupIntervalChange(value as number)}
                    min={15}
                    max={1440} // 24 hours
                    step={15}
                    marks={[
                      { value: 15, label: '15m' },
                      { value: 60, label: '1h' },
                      { value: 360, label: '6h' },
                      { value: 1440, label: '24h' },
                    ]}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}m`}
                  />
                </Box>
                
                <Alert severity="success">
                  <Typography variant="body2">
                    <strong>Automatic Backups Enabled</strong><br />
                    Project data will be automatically backed up every {formatInterval(settings.projects?.backupInterval || 3600)}.
                    Backups are stored locally to ensure your data remains private.
                  </Typography>
                </Alert>
              </>
            )}
            
            {!settings.projects?.backupEnabled && (
              <Alert severity="warning">
                Backups are disabled. Consider enabling automatic backups to protect your project data 
                against accidental loss or corruption.
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Project Management */}
      <Card>
        <CardHeader 
          title="Project Management" 
          subheader="Workspace and project handling preferences"
          avatar={<StorageIcon color="primary" />}
        />
        <CardContent>
          <Stack spacing={3}>
            {/* Auto-save */}
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.projects?.autoSave || false}
                    onChange={(e) => handleAutoSaveChange(e.target.checked)}
                  />
                }
                label="Auto-save project changes"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Automatically save project data when changes are made
              </Typography>
            </Box>
            
            {/* Recent Projects */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Maximum Recent Projects: {settings.projects?.maxRecentProjects || 10}
              </Typography>
              <Slider
                value={settings.projects?.maxRecentProjects || 10}
                onChange={(_, value) => handleMaxRecentProjectsChange(value as number)}
                min={5}
                max={50}
                step={5}
                marks={[
                  { value: 5, label: '5' },
                  { value: 10, label: '10' },
                  { value: 25, label: '25' },
                  { value: 50, label: '50' },
                ]}
                valueLabelDisplay="auto"
              />
              <Typography variant="body2" color="text.secondary">
                How many recent projects to show in the dashboard
              </Typography>
            </Box>
            
            {/* File Visibility */}
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.projects?.showHiddenFiles || false}
                    onChange={(e) => handleShowHiddenFilesChange(e.target.checked)}
                  />
                }
                label="Show hidden files and folders"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Display hidden files (starting with .) in project file explorers
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Project Templates */}
      <Card>
        <CardHeader 
          title="Project Templates" 
          subheader="Default project configurations and templates"
          avatar={<CleanIcon color="primary" />}
        />
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="body1" gutterBottom>
              Quick Start Templates
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label="Web Application" variant="outlined" />
              <Chip label="API Project" variant="outlined" />
              <Chip label="Data Science" variant="outlined" />
              <Chip label="Mobile App" variant="outlined" />
              <Chip label="Desktop App" variant="outlined" />
              <Chip label="Documentation" variant="outlined" />
            </Box>
            
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Coming Soon:</strong> Custom project templates will allow you to create 
                standardized project structures with pre-configured settings, dependencies, 
                and folder structures.
              </Typography>
            </Alert>
          </Stack>
        </CardContent>
      </Card>

      {/* Storage & Performance */}
      <Card>
        <CardHeader 
          title="Storage & Performance" 
          subheader="Project storage optimization and performance settings"
          avatar={<StorageIcon color="primary" />}
        />
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="body1" gutterBottom>
              Storage Optimization
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Database size optimization and cleanup tools will be available in future updates.
                Current storage usage is managed automatically.
              </Typography>
            </Box>
            
            <Button
              variant="outlined"
              disabled
              startIcon={<CleanIcon />}
            >
              Clean Temporary Files (Coming Soon)
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card sx={{ bgcolor: 'background.default' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            About Project Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            These settings control how PAAT manages your projects, including default locations,
            backup strategies, and workspace organization preferences.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Backup Strategy:</strong> PAAT uses local backups to ensure your data remains 
            private and secure. Backups include project metadata, task information, and configuration 
            data, but not actual project files (which should be managed by your version control system).
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Performance:</strong> Auto-save and backup settings may impact performance on 
            slower systems. Adjust intervals based on your hardware capabilities and data importance.
          </Typography>
        </CardContent>
      </Card>

      {/* Path Selection Dialog */}
      <Dialog open={pathDialogOpen} onClose={() => setPathDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Select Default Project Directory</DialogTitle>
        <DialogContent>
          <TextField
            label="Project Directory Path"
            value={customPath}
            onChange={(e) => setCustomPath(e.target.value)}
            fullWidth
            margin="normal"
            placeholder="C:\Users\YourName\Documents\PAAT Projects"
            helperText="Enter the full path where you want new projects to be created by default"
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            In the full application, you would be able to browse and select folders using a native file dialog.
            For now, please type the full path to your desired project directory.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPathDialogOpen(false)}>Cancel</Button>
          <Button onClick={handlePathDialogConfirm} variant="contained">Confirm</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default ProjectSettings;
