import React, { useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Alert,
  Slider,
  Divider,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Code as CodeIcon,
  BugReport as DebugIcon,
  Speed as PerformanceIcon,
  Analytics as TelemetryIcon,
  Tune as TuneIcon,
  Refresh as HotReloadIcon,
  ViewCompact as DensityIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

import { useSettingsStore } from '../../stores/settingsStore';

const AdvancedSettings: React.FC = () => {
  const { settings, updateSettings } = useSettingsStore();
  const [resetWarningOpen, setResetWarningOpen] = useState(false);
  
  // Development settings handlers
  const handleDebugModeChange = (enabled: boolean) => {
    updateSettings('development.debugMode', enabled);
  };
  
  const handleLogLevelChange = (level: 'error' | 'warn' | 'info' | 'debug') => {
    updateSettings('development.logLevel', level);
  };
  
  const handleTelemetryChange = (enabled: boolean) => {
    updateSettings('development.enableTelemetry', enabled);
  };
  
  const handlePerformanceMetricsChange = (enabled: boolean) => {
    updateSettings('development.showPerformanceMetrics', enabled);
  };
  
  const handleHotReloadChange = (enabled: boolean) => {
    updateSettings('development.enableHotReload', enabled);
  };
  
  // UI settings handlers
  const handleSidebarWidthChange = (width: number) => {
    updateSettings('ui.sidebarWidth', width);
  };
  
  const handleShowStatusBarChange = (show: boolean) => {
    updateSettings('ui.showStatusBar', show);
  };
  
  const handleShowToolbarChange = (show: boolean) => {
    updateSettings('ui.showToolbar', show);
  };
  
  const handleDensityChange = (density: 'comfortable' | 'compact' | 'spacious') => {
    updateSettings('ui.density', density);
  };
  
  const handleAnimationSpeedChange = (speed: 'slow' | 'normal' | 'fast') => {
    updateSettings('ui.animationSpeed', speed);
  };
  
  // Get log level color
  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'error';
      case 'warn': return 'warning';
      case 'info': return 'info';
      case 'debug': return 'success';
      default: return 'default';
    }
  };
  
  // Get density description
  const getDensityDescription = (density: string) => {
    switch (density) {
      case 'compact': return 'More content fits on screen with minimal spacing';
      case 'comfortable': return 'Balanced spacing for easy reading and interaction';
      case 'spacious': return 'Maximum spacing for accessibility and clarity';
      default: return '';
    }
  };

  return (
    <Stack spacing={3}>
      {/* Development Settings */}
      <Card>
        <CardHeader 
          title="Development Options" 
          subheader="Debug and development-specific settings"
          avatar={<DebugIcon color="primary" />}
        />
        <CardContent>
          <Stack spacing={3}>
            {/* Debug Mode */}
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.development?.debugMode || false}
                    onChange={(e) => handleDebugModeChange(e.target.checked)}
                  />
                }
                label="Enable Debug Mode"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Show additional debugging information and developer tools in the interface
              </Typography>
              
              {settings.development?.debugMode && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Debug Mode Active:</strong> This may impact performance and expose 
                    sensitive information. Disable for normal use.
                  </Typography>
                </Alert>
              )}
            </Box>
            
            {/* Log Level */}
            <Box>
              <FormControl fullWidth>
                <InputLabel>Logging Level</InputLabel>
                <Select
                  value={settings.development?.logLevel || 'info'}
                  onChange={(e) => handleLogLevelChange(e.target.value as any)}
                  label="Logging Level"
                >
                  <MenuItem value="error">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ErrorIcon color="error" fontSize="small" />
                      Error Only
                    </Box>
                  </MenuItem>
                  <MenuItem value="warn">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningIcon color="warning" fontSize="small" />
                      Warnings & Errors
                    </Box>
                  </MenuItem>
                  <MenuItem value="info">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <InfoIcon color="info" fontSize="small" />
                      Info, Warnings & Errors
                    </Box>
                  </MenuItem>
                  <MenuItem value="debug">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CodeIcon color="success" fontSize="small" />
                      All Messages (Debug)
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
              
              <Box sx={{ mt: 1 }}>
                <Chip 
                  label={`Current: ${(settings.development?.logLevel || 'info').toUpperCase()}`}
                  size="small"
                  color={getLogLevelColor(settings.development?.logLevel || 'info') as any}
                  variant="outlined"
                />
              </Box>
            </Box>
            
            {/* Performance Metrics */}
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.development?.showPerformanceMetrics || false}
                    onChange={(e) => handlePerformanceMetricsChange(e.target.checked)}
                  />
                }
                label="Show Performance Metrics"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Display performance statistics and timing information in the UI
              </Typography>
            </Box>
            
            {/* Hot Reload */}
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.development?.enableHotReload !== false} // Default to true
                    onChange={(e) => handleHotReloadChange(e.target.checked)}
                  />
                }
                label="Enable Hot Reload"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Automatically reload the application when code changes are detected (development mode only)
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Privacy & Telemetry */}
      <Card>
        <CardHeader 
          title="Privacy & Analytics" 
          subheader="Data collection and usage analytics preferences"
          avatar={<TelemetryIcon color="primary" />}
        />
        <CardContent>
          <Stack spacing={3}>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.development?.enableTelemetry !== false} // Default to true
                    onChange={(e) => handleTelemetryChange(e.target.checked)}
                  />
                }
                label="Enable Anonymous Usage Analytics"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Help improve PAAT by sharing anonymous usage statistics and performance data
              </Typography>
            </Box>
            
            {settings.development?.enableTelemetry !== false ? (
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Privacy First:</strong> All telemetry data is anonymous and processed locally.
                  No personal information, project data, or sensitive content is ever transmitted.
                  You can disable this at any time.
                </Typography>
              </Alert>
            ) : (
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>Telemetry Disabled:</strong> Usage analytics are turned off. 
                  This may limit our ability to identify and fix issues that affect your experience.
                </Typography>
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* UI Density & Layout */}
      <Card>
        <CardHeader 
          title="Interface Density" 
          subheader="Control spacing and layout density of the user interface"
          avatar={<DensityIcon color="primary" />}
        />
        <CardContent>
          <Stack spacing={3}>
            {/* UI Density */}
            <Box>
              <FormControl fullWidth>
                <InputLabel>Interface Density</InputLabel>
                <Select
                  value={settings.ui?.density || 'comfortable'}
                  onChange={(e) => handleDensityChange(e.target.value as any)}
                  label="Interface Density"
                >
                  <MenuItem value="compact">Compact</MenuItem>
                  <MenuItem value="comfortable">Comfortable</MenuItem>
                  <MenuItem value="spacious">Spacious</MenuItem>
                </Select>
              </FormControl>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {getDensityDescription(settings.ui?.density || 'comfortable')}
              </Typography>
            </Box>
            
            {/* Sidebar Width */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Sidebar Width: {settings.ui?.sidebarWidth || 240}px
              </Typography>
              <Slider
                value={settings.ui?.sidebarWidth || 240}
                onChange={(_, value) => handleSidebarWidthChange(value as number)}
                min={200}
                max={400}
                step={20}
                marks={[
                  { value: 200, label: '200px' },
                  { value: 240, label: '240px' },
                  { value: 300, label: '300px' },
                  { value: 400, label: '400px' },
                ]}
                valueLabelDisplay="auto"
              />
            </Box>
            
            {/* Animation Speed */}
            <Box>
              <FormControl fullWidth>
                <InputLabel>Animation Speed</InputLabel>
                <Select
                  value={settings.ui?.animationSpeed || 'normal'}
                  onChange={(e) => handleAnimationSpeedChange(e.target.value as any)}
                  label="Animation Speed"
                >
                  <MenuItem value="slow">Slow (Accessibility)</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="fast">Fast</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Control the speed of UI animations and transitions
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Interface Components */}
      <Card>
        <CardHeader 
          title="Interface Components" 
          subheader="Show or hide specific UI elements"
          avatar={<TuneIcon color="primary" />}
        />
        <CardContent>
          <Stack spacing={3}>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.ui?.showStatusBar !== false} // Default to true
                    onChange={(e) => handleShowStatusBarChange(e.target.checked)}
                  />
                }
                label="Show Status Bar"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Display the status bar at the bottom of the application window
              </Typography>
            </Box>
            
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.ui?.showToolbar !== false} // Default to true
                    onChange={(e) => handleShowToolbarChange(e.target.checked)}
                  />
                }
                label="Show Toolbar"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Display the main toolbar with quick action buttons
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Performance Optimization */}
      <Card>
        <CardHeader 
          title="Performance Optimization" 
          subheader="Advanced performance and resource usage settings"
          avatar={<PerformanceIcon color="primary" />}
        />
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="body1" gutterBottom>
              Experimental Features
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label="GPU Acceleration" variant="outlined" disabled />
              <Chip label="Memory Optimization" variant="outlined" disabled />
              <Chip label="Background Processing" variant="outlined" disabled />
              <Chip label="Lazy Loading" variant="outlined" disabled />
            </Box>
            
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Coming Soon:</strong> Advanced performance optimization features 
                will be available in future updates, including GPU acceleration for AI tasks 
                and memory optimization for large projects.
              </Typography>
            </Alert>
          </Stack>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader 
          title="Security & Privacy" 
          subheader="Advanced security and privacy configuration"
          avatar={<SecurityIcon color="primary" />}
        />
        <CardContent>
          <Stack spacing={3}>
            <Typography variant="body1" gutterBottom>
              Security Features
            </Typography>
            
            <Alert severity="success">
              <Typography variant="body2">
                <strong>Local-First Security:</strong> PAAT operates entirely locally with no cloud dependencies.
                Your project data, AI conversations, and settings never leave your device.
              </Typography>
            </Alert>
            
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label="End-to-End Encryption" variant="outlined" color="success" />
              <Chip label="Local Data Storage" variant="outlined" color="success" />
              <Chip label="No Cloud Dependencies" variant="outlined" color="success" />
              <Chip label="Open Source AI Models" variant="outlined" color="success" />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Developer Tools */}
      <Card>
        <CardHeader 
          title="Developer Tools" 
          subheader="Advanced developer and troubleshooting options"
          avatar={<CodeIcon color="primary" />}
        />
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="body1" gutterBottom>
              Debugging & Troubleshooting
            </Typography>
            
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" disabled startIcon={<CodeIcon />}>
                Open DevTools (Development Only)
              </Button>
              <Button variant="outlined" disabled startIcon={<InfoIcon />}>
                Export Debug Information
              </Button>
            </Stack>
            
            <Alert severity="warning">
              <Typography variant="body2">
                <strong>Developer Mode Required:</strong> These tools are only available when 
                running in development mode. They provide advanced debugging capabilities 
                and system information export.
              </Typography>
            </Alert>
          </Stack>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card sx={{ bgcolor: 'background.default' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            About Advanced Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            These settings provide fine-grained control over PAAT's behavior and are intended 
            for advanced users and developers. Most users can safely use the default values.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Performance Impact:</strong> Some settings may significantly impact application 
            performance. Enable debug mode and performance metrics only when necessary for troubleshooting.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Privacy:</strong> PAAT is designed with privacy-first principles. All processing 
            happens locally, and no data is transmitted to external servers without your explicit consent.
          </Typography>
        </CardContent>
      </Card>

      {/* Reset Warning Dialog */}
      <Dialog open={resetWarningOpen} onClose={() => setResetWarningOpen(false)}>
        <DialogTitle>Reset Advanced Settings?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will reset all advanced settings to their default values. This action cannot be undone.
          </Alert>
          <Typography variant="body2">
            Are you sure you want to continue? Your other settings (General, Theme, AI Services, Projects) 
            will not be affected.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetWarningOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="warning"
            onClick={() => {
              // Reset only advanced settings
              updateSettings('development', {
                debugMode: false,
                logLevel: 'info',
                enableTelemetry: true,
                showPerformanceMetrics: false,
                enableHotReload: true,
              });
              updateSettings('ui', {
                sidebarWidth: 240,
                showStatusBar: true,
                showToolbar: true,
                density: 'comfortable',
                animationSpeed: 'normal',
              });
              setResetWarningOpen(false);
            }}
          >
            Reset Advanced Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default AdvancedSettings;
