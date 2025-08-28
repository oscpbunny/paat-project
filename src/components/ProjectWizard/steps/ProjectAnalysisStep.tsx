import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Psychology,
  Schedule,
  Warning,
  Lightbulb,
  Assessment,
  TrendingUp,
} from '@mui/icons-material';
import { ProjectWizardData } from '../ProjectWizard';

interface ProjectAnalysisStepProps {
  data: ProjectWizardData;
  isProcessing: boolean;
  processingMessage: string;
}

const ProjectAnalysisStep: React.FC<ProjectAnalysisStepProps> = ({
  data,
  isProcessing,
  processingMessage,
}) => {
  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'success';
      case 'moderate': return 'warning';
      case 'complex': return 'error';
      default: return 'default';
    }
  };

  if (isProcessing) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" py={6}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Analyzing Your Project
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {processingMessage || 'Please wait while AI analyzes your requirements...'}
        </Typography>
        <Box width="100%" maxWidth={400}>
          <LinearProgress />
        </Box>
        <Alert severity="info" sx={{ mt: 3, maxWidth: 600 }}>
          Our AI is examining your project requirements, technologies, and constraints to provide 
          intelligent insights about complexity, timeline, and implementation approach.
        </Alert>
      </Box>
    );
  }

  if (!data.aiAnalysis) {
    return (
      <Box textAlign="center" py={6}>
        <Psychology sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Ready for AI Analysis
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Click "Analyze with AI" to let our AI examine your project and provide insights.
        </Typography>
      </Box>
    );
  }

  const { aiAnalysis } = data;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        AI Project Analysis
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Based on your project details, our AI has analyzed the requirements and provided insights.
      </Typography>

      <Grid container spacing={3}>
        {/* Complexity Assessment */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Assessment sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Complexity Assessment</Typography>
              </Box>
              
              <Box display="flex" alignItems="center" mb={2}>
                <Chip
                  label={aiAnalysis.complexity.toUpperCase()}
                  color={getComplexityColor(aiAnalysis.complexity) as any}
                  sx={{ mr: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Project Complexity Level
                </Typography>
              </Box>

              <Typography variant="body2">
                This project is classified as <strong>{aiAnalysis.complexity}</strong> based on 
                the technologies, requirements, and scope outlined.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Timeline Estimate */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Schedule sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Timeline Estimate</Typography>
              </Box>
              
              <Box display="flex" alignItems="baseline" mb={2}>
                <Typography variant="h4" color="primary">
                  {aiAnalysis.estimatedDuration}
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ ml: 1 }}>
                  hours
                </Typography>
              </Box>

              <Typography variant="body2">
                Estimated development time based on project scope and complexity. 
                This includes planning, development, testing, and deployment phases.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Recommended Approach */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Recommended Approach</Typography>
              </Box>
              
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                {aiAnalysis.recommendedApproach}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Potential Risks */}
        {aiAnalysis.risks && aiAnalysis.risks.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Warning sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="h6">Potential Risks</Typography>
                </Box>
                
                <List dense>
                  {aiAnalysis.risks.map((risk, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Warning fontSize="small" color="warning" />
                      </ListItemIcon>
                      <ListItemText primary={risk} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Implementation Suggestions */}
        {aiAnalysis.suggestions && aiAnalysis.suggestions.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Lightbulb sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="h6">Implementation Suggestions</Typography>
                </Box>
                
                <List dense>
                  {aiAnalysis.suggestions.map((suggestion, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Lightbulb fontSize="small" color="success" />
                      </ListItemIcon>
                      <ListItemText primary={suggestion} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Project Overview */}
        <Grid item xs={12}>
          <Alert severity="success">
            <Typography variant="subtitle2" gutterBottom>
              Analysis Complete
            </Typography>
            <Typography variant="body2">
              The AI analysis suggests this is a <strong>{aiAnalysis.complexity}</strong> project 
              requiring approximately <strong>{aiAnalysis.estimatedDuration} hours</strong> of development. 
              In the next step, we'll generate a detailed task breakdown to help you get started.
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectAnalysisStep;
