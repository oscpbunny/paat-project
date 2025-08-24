/**
 * PAAT - AI Personal Assistant Agent Tool
 * Status Bar Component (Placeholder)
 */

import React from 'react';
import { Box, Typography, Chip } from '@mui/material';

const StatusBar: React.FC = () => {
  return (
    <Box
      sx={{
        height: 32,
        backgroundColor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Ready
        </Typography>
        <Chip 
          label="Vamsh: Offline" 
          size="small" 
          color="error" 
          variant="outlined"
          sx={{ height: 20, fontSize: 10 }}
        />
        <Chip 
          label="Ollama: Offline" 
          size="small" 
          color="error" 
          variant="outlined"
          sx={{ height: 20, fontSize: 10 }}
        />
      </Box>
      
      <Typography variant="caption" color="text.secondary">
        v1.0.0
      </Typography>
    </Box>
  );
};

export default StatusBar;
