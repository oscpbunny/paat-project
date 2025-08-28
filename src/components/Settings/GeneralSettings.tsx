import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Stack,
} from '@mui/material';
import {
  Language as LanguageIcon,
  Notifications as NotificationsIcon,
  Launch as LaunchIcon,
  MinimizeOutlined as MinimizeIcon,
} from '@mui/icons-material';

import { useSettingsStore } from '../../stores/settingsStore';

const GeneralSettings: React.FC = () => {
  const { settings, updateSettings } = useSettingsStore();

  const handleLanguageChange = (language: string) => {
    updateSettings('app.language', language);
  };

  const handleAutoStartChange = (autoStart: boolean) => {
    updateSettings('app.autoStart', autoStart);
  };

  const handleMinimizeToTrayChange = (minimizeToTray: boolean) => {
    updateSettings('app.minimizeToTray', minimizeToTray);
  };

  const handleNotificationsChange = (notifications: boolean) => {
    updateSettings('app.notifications', notifications);
  };

  return (
    <Stack spacing={3}>
      {/* Language Settings */}
      <Card>
        <CardHeader 
          title="Language" 
          subheader="Application display language"
          avatar={<LanguageIcon color="primary" />}
        />
        <CardContent>
          <FormControl fullWidth>
            <InputLabel>Display Language</InputLabel>
            <Select
              value={settings.app?.language || 'en'}
              onChange={(e) => handleLanguageChange(e.target.value)}
              label="Display Language"
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="es">Español</MenuItem>
              <MenuItem value="fr">Français</MenuItem>
              <MenuItem value="de">Deutsch</MenuItem>
              <MenuItem value="zh">中文</MenuItem>
              <MenuItem value="ja">日本語</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Startup Settings */}
      <Card>
        <CardHeader 
          title="Startup" 
          subheader="Application launch behavior"
          avatar={<LaunchIcon color="primary" />}
        />
        <CardContent>
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.app?.autoStart || false}
                  onChange={(e) => handleAutoStartChange(e.target.checked)}
                />
              }
              label="Start automatically when system starts"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Launch PAAT automatically when your computer starts up
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Window Settings */}
      <Card>
        <CardHeader 
          title="Window Behavior" 
          subheader="How the application window behaves"
          avatar={<MinimizeIcon color="primary" />}
        />
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.app?.minimizeToTray || false}
                    onChange={(e) => handleMinimizeToTrayChange(e.target.checked)}
                  />
                }
                label="Minimize to system tray"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Keep PAAT running in the system tray when minimized
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader 
          title="Notifications" 
          subheader="System notifications and alerts"
          avatar={<NotificationsIcon color="primary" />}
        />
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.app?.notifications || false}
                    onChange={(e) => handleNotificationsChange(e.target.checked)}
                  />
                }
                label="Enable desktop notifications"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Receive desktop notifications for project updates and system events
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="body2" color="text.secondary">
              <strong>Note:</strong> Notification preferences may require application restart to take effect.
              Some notification features depend on your operating system settings.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card sx={{ bgcolor: 'background.default' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            About General Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            These settings control the basic behavior of PAAT. Changes to language settings 
            will take effect immediately, while startup settings may require a restart of the application.
            All settings are automatically saved and synchronized across sessions.
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default GeneralSettings;
