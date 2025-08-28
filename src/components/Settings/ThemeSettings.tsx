import React, { useState, useEffect } from 'react';
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
  TextField,
  Button,
  Chip,
  Grid,
  Paper,
  Slider,
  Divider,
} from '@mui/material';
import {
  Palette as PaletteIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  BrightnessAuto as SystemIcon,
  FormatSize as FontIcon,
  Speed as SpeedIcon,
  ViewCompact as CompactIcon,
} from '@mui/icons-material';

import { useSettingsStore } from '../../stores/settingsStore';

// Predefined color palette
const predefinedColors = [
  { name: 'Blue', value: '#1976d2' },
  { name: 'Purple', value: '#7b1fa2' },
  { name: 'Pink', value: '#c2185b' },
  { name: 'Red', value: '#d32f2f' },
  { name: 'Orange', value: '#ed6c02' },
  { name: 'Green', value: '#2e7d32' },
  { name: 'Teal', value: '#0288d1' },
  { name: 'Indigo', value: '#3f51b5' },
];

const accentColors = [
  { name: 'Pink', value: '#f50057' },
  { name: 'Red', value: '#ff1744' },
  { name: 'Orange', value: '#ff9100' },
  { name: 'Yellow', value: '#ffc400' },
  { name: 'Green', value: '#00e676' },
  { name: 'Cyan', value: '#00e5ff' },
  { name: 'Blue', value: '#2979ff' },
  { name: 'Purple', value: '#d500f9' },
];

const ThemeSettings: React.FC = () => {
  const { settings, updateSettings } = useSettingsStore();
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  // Detect system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateSettings('app.theme', theme);
  };

  const handlePrimaryColorChange = (color: string) => {
    updateSettings('app.primaryColor', color);
  };

  const handleAccentColorChange = (color: string) => {
    updateSettings('app.accentColor', color);
  };

  const handleFontFamilyChange = (fontFamily: 'Roboto' | 'Inter' | 'Poppins') => {
    updateSettings('app.fontFamily', fontFamily);
  };

  const handleFontSizeChange = (fontSize: 'small' | 'medium' | 'large') => {
    updateSettings('app.fontSize', fontSize);
  };

  const handleCompactModeChange = (compactMode: boolean) => {
    updateSettings('app.compactMode', compactMode);
  };

  const handleAnimationsChange = (animations: boolean) => {
    updateSettings('app.animations', animations);
  };

  const ColorPalette: React.FC<{
    colors: Array<{ name: string; value: string }>;
    selectedColor: string;
    onColorSelect: (color: string) => void;
    label: string;
  }> = ({ colors, selectedColor, onColorSelect, label }) => (
    <Box>
      <Typography variant="body2" sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Grid container spacing={1}>
        {colors.map((color) => (
          <Grid item key={color.value}>
            <Paper
              sx={{
                width: 40,
                height: 40,
                bgcolor: color.value,
                cursor: 'pointer',
                border: selectedColor === color.value ? '3px solid' : '1px solid',
                borderColor: selectedColor === color.value ? 'text.primary' : 'divider',
                borderRadius: 1,
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'scale(1.1)',
                  elevation: 4,
                },
              }}
              onClick={() => onColorSelect(color.value)}
              title={color.name}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <Stack spacing={3}>
      {/* Theme Mode */}
      <Card>
        <CardHeader 
          title="Theme Mode" 
          subheader="Choose your preferred color scheme"
          avatar={<PaletteIcon color="primary" />}
        />
        <CardContent>
          <FormControl fullWidth>
            <InputLabel>Theme</InputLabel>
            <Select
              value={settings.app?.theme || 'system'}
              onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark' | 'system')}
              label="Theme"
            >
              <MenuItem value="light">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LightIcon fontSize="small" />
                  Light
                </Box>
              </MenuItem>
              <MenuItem value="dark">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DarkIcon fontSize="small" />
                  Dark
                </Box>
              </MenuItem>
              <MenuItem value="system">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SystemIcon fontSize="small" />
                  System ({systemTheme})
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            System theme automatically switches based on your operating system settings
          </Typography>
        </CardContent>
      </Card>

      {/* Color Customization */}
      <Card>
        <CardHeader 
          title="Colors" 
          subheader="Customize your application colors"
        />
        <CardContent>
          <Stack spacing={3}>
            <ColorPalette
              colors={predefinedColors}
              selectedColor={settings.app?.primaryColor || '#1976d2'}
              onColorSelect={handlePrimaryColorChange}
              label="Primary Color"
            />

            <Divider />

            <ColorPalette
              colors={accentColors}
              selectedColor={settings.app?.accentColor || '#f50057'}
              onColorSelect={handleAccentColorChange}
              label="Accent Color"
            />

            <Divider />

            <Stack direction="row" spacing={2}>
              <TextField
                size="small"
                label="Custom Primary"
                value={settings.app?.primaryColor || '#1976d2'}
                onChange={(e) => handlePrimaryColorChange(e.target.value)}
                inputProps={{ maxLength: 7 }}
                sx={{ width: 120 }}
              />
              <TextField
                size="small"
                label="Custom Accent"
                value={settings.app?.accentColor || '#f50057'}
                onChange={(e) => handleAccentColorChange(e.target.value)}
                inputProps={{ maxLength: 7 }}
                sx={{ width: 120 }}
              />
            </Stack>

            <Typography variant="body2" color="text.secondary">
              Use hex color codes (e.g., #1976d2) for custom colors
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader 
          title="Typography" 
          subheader="Font family and size preferences"
          avatar={<FontIcon color="primary" />}
        />
        <CardContent>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Font Family</InputLabel>
              <Select
                value={settings.app?.fontFamily || 'Roboto'}
                onChange={(e) => handleFontFamilyChange(e.target.value as 'Roboto' | 'Inter' | 'Poppins')}
                label="Font Family"
              >
                <MenuItem value="Roboto" sx={{ fontFamily: 'Roboto' }}>
                  Roboto (Default)
                </MenuItem>
                <MenuItem value="Inter" sx={{ fontFamily: 'Inter' }}>
                  Inter (Modern)
                </MenuItem>
                <MenuItem value="Poppins" sx={{ fontFamily: 'Poppins' }}>
                  Poppins (Rounded)
                </MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography gutterBottom>Font Size</Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                {['small', 'medium', 'large'].map((size) => (
                  <Chip
                    key={size}
                    label={size.charAt(0).toUpperCase() + size.slice(1)}
                    variant={settings.app?.fontSize === size ? 'filled' : 'outlined'}
                    onClick={() => handleFontSizeChange(size as 'small' | 'medium' | 'large')}
                    sx={{ 
                      fontSize: size === 'small' ? '0.75rem' : size === 'large' ? '0.95rem' : '0.85rem',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* UI Density and Animations */}
      <Card>
        <CardHeader 
          title="Interface Options" 
          subheader="Customize interface density and animations"
          avatar={<CompactIcon color="primary" />}
        />
        <CardContent>
          <Stack spacing={3}>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.app?.compactMode || false}
                    onChange={(e) => handleCompactModeChange(e.target.checked)}
                  />
                }
                label="Compact mode"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Reduce spacing and padding for a more compact interface
              </Typography>
            </Box>

            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.app?.animations !== false}
                    onChange={(e) => handleAnimationsChange(e.target.checked)}
                  />
                }
                label="Enable animations"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Show smooth transitions and animations throughout the interface
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card sx={{ bgcolor: 'background.default' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Theme Preview
          </Typography>
          <Box 
            sx={{ 
              p: 2, 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="h6" sx={{ color: settings.app?.primaryColor || 'primary.main' }}>
              Primary Color Text
            </Typography>
            <Typography variant="body1" gutterBottom>
              Regular text with {settings.app?.fontFamily || 'Roboto'} font
            </Typography>
            <Button 
              variant="contained" 
              size="small"
              sx={{ 
                bgcolor: settings.app?.primaryColor || 'primary.main',
                mr: 1,
              }}
            >
              Primary Button
            </Button>
            <Button 
              variant="contained" 
              size="small"
              sx={{ bgcolor: settings.app?.accentColor || 'secondary.main' }}
            >
              Accent Button
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This preview shows how your color choices will appear in the application
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default ThemeSettings;
