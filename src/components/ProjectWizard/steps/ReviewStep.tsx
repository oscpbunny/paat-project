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
  ListItemText,
  Divider,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  Schedule,
  Assessment,
  Assignment,
  Build,
} from '@mui/icons-material';
import { ProjectWizardData } from '../ProjectWizard';

interface ReviewStepProps {
  data: ProjectWizardData;
  onUpdate: (updates: Partial<ProjectWizardData>) => void;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ data, onUpdate }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'success';
      case 'moderate': return 'warning';
      case 'complex': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review & Create Project
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review your project details before creation. You can modify anything after the project is created.
      </Typography>

      <Grid container spacing={3}>
        {/* Project Overview */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">Project Overview</Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Typography variant="subtitle1" gutterBottom>
                    {data.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {data.description}
                  </Typography>
                  
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip 
                      label={data.type.replace('-', ' ')} 
                      color="primary" 
                      variant="outlined"
                    />
                    <Chip 
                      label={data.priority} 
                      color={getPriorityColor(data.priority) as any}
                      size="small"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Technologies
                  </Typography>
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    {data.technologies.map((tech) => (
                      <Chip 
                        key={tech} 
                        label={tech} 
                        size="small" 
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* AI Analysis Summary */}
        {data.aiAnalysis && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Assessment sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">AI Analysis</Typography>
                </Box>
                
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      label={data.aiAnalysis.complexity}
                      color={getComplexityColor(data.aiAnalysis.complexity) as any}
                      size="small"
                    />
                    <Typography variant="body2">complexity</Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={1}>
                    <Schedule fontSize="small" />
                    <Typography variant="body2">
                      {data.aiAnalysis.estimatedDuration} hours
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  {data.aiAnalysis.recommendedApproach}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Task Summary */}
        {data.tasks && data.tasks.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Assignment sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Generated Tasks</Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="h4" color="primary">
                      {data.tasks.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Tasks
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h4" color="primary">
                      {data.tasks.reduce((sum, task) => sum + task.estimatedHours, 0)}h
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Hours
                    </Typography>
                  </Grid>
                </Grid>
                
                <Box mt={2}>
                  <Typography variant="body2" color="text.secondary">
                    Priority breakdown:
                  </Typography>
                  <Box display="flex" gap={1} mt={1}>
                    {['high', 'medium', 'low'].map(priority => {
                      const count = data.tasks!.filter(t => t.priority === priority).length;
                      return count > 0 ? (
                        <Chip 
                          key={priority}
                          label={`${count} ${priority}`}
                          color={getPriorityColor(priority) as any}
                          size="small"
                          variant="outlined"
                        />
                      ) : null;
                    })}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Requirements & Constraints */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Requirements & Constraints
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Requirements ({data.requirements.length})
                  </Typography>
                  {data.requirements.length > 0 ? (
                    <List dense>
                      {data.requirements.slice(0, 5).map((req, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemText primary={req} />
                        </ListItem>
                      ))}
                      {data.requirements.length > 5 && (
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText 
                            primary={`... and ${data.requirements.length - 5} more`}
                            sx={{ fontStyle: 'italic', color: 'text.secondary' }}
                          />
                        </ListItem>
                      )}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No specific requirements listed
                    </Typography>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Constraints ({data.constraints.length})
                  </Typography>
                  {data.constraints.length > 0 ? (
                    <List dense>
                      {data.constraints.slice(0, 5).map((constraint, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemText primary={constraint} />
                        </ListItem>
                      ))}
                      {data.constraints.length > 5 && (
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText 
                            primary={`... and ${data.constraints.length - 5} more`}
                            sx={{ fontStyle: 'italic', color: 'text.secondary' }}
                          />
                        </ListItem>
                      )}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No constraints specified
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Ready to Create */}
        <Grid item xs={12}>
          <Alert severity="success" icon={<Build />}>
            <Typography variant="subtitle2" gutterBottom>
              Ready to Create Project
            </Typography>
            <Typography variant="body2">
              Your project "<strong>{data.name}</strong>" is ready to be created with:
            </Typography>
            <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
              <li>AI-analyzed complexity and timeline estimation</li>
              <li>{data.tasks?.length || 0} automatically generated tasks</li>
              <li>{data.technologies.length} selected technologies</li>
              <li>{data.requirements.length} requirements and {data.constraints.length} constraints</li>
            </Box>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Click "Create Project" to start your development journey with AI assistance!
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReviewStep;
