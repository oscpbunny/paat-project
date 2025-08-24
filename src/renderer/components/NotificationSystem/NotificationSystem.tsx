/**
 * PAAT - AI Personal Assistant Agent Tool
 * Notification System Component (Placeholder)
 */

import React from 'react';
import { Box } from '@mui/material';

const NotificationSystem: React.FC = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        pointerEvents: 'none',
      }}
    >
      {/* Notifications will be rendered here */}
    </Box>
  );
};

export default NotificationSystem;
