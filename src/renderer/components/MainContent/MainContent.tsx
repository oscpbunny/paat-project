/**
 * PAAT - AI Personal Assistant Agent Tool
 * Main Content Area Component (Placeholder)
 */

import React from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import { motion } from 'framer-motion';

const MainContent: React.FC = () => {
  return (
    <Box
      sx={{
        flex: 1,
        p: 3,
        backgroundColor: 'background.default',
        overflow: 'auto',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
          Welcome to PAAT
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
          AI Personal Assistant Agent Tool - Your local AI-powered project management solution
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Projects
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage your development projects with AI assistance
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Vamsh AI
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Connect to Vamsh for autonomous development tasks
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Ollama
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Local AI models for intelligent project analysis
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </Box>
  );
};

export default MainContent;
