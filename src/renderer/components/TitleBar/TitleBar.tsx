/**
 * PAAT - AI Personal Assistant Agent Tool
 * Custom Title Bar Component (Placeholder)
 */

import React from 'react';
import { Box, Typography } from '@mui/material';

interface TitleBarProps {
  title: string;
  subtitle?: string;
  isMaximized?: boolean;
  version?: string;
}

const TitleBar: React.FC<TitleBarProps> = ({ 
  title, 
  subtitle, 
  isMaximized = false,
  version = '1.0.0'
}) => {
  return (
    <Box
      sx={{
        height: 40,
        backgroundColor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        WebkitAppRegion: 'drag',
        userSelect: 'none',
        zIndex: 1000,
      }}
    >
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {title} v{version}
      </Typography>
    </Box>
  );
};

export default TitleBar;
