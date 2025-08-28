import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  LinearProgress,
  Grid,
} from '@mui/material';
import {
  Assignment,
  Schedule,
  Flag,
} from '@mui/icons-material';
import { ProjectWizardData } from '../ProjectWizard';

interface TaskBreakdownStepProps {
  data: ProjectWizardData;
  onUpdate: (updates: Partial<ProjectWizardData>) => void;
  isProcessing: boolean;
  processingMessage: string;
}

const TaskBreakdownStep: React.FC<TaskBreakdownStepProps> = ({
  data,
  onUpdate,
  isProcessing,
  processingMessage,
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'planning': return 'info';
      case 'development': return 'primary';
      case 'testing': return 'secondary';
      case 'deployment': return 'success';
      default: return 'default';
    }
  };

  if (isProcessing) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" py={6}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Generating Project Tasks
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {processingMessage || 'AI is creating a comprehensive task breakdown...'}
        </Typography>
        <Box width="100%" maxWidth={400}>
          <LinearProgress />
        </Box>
        <Alert severity="info" sx={{ mt: 3, maxWidth: 600 }}>
          Our AI is analyzing your project requirements and generating specific tasks 
          with priorities, estimates, and dependencies to guide your development process.
        </Alert>
      </Box>
    );
  }

  if (!data.tasks || data.tasks.length === 0) {
    return (
      <Box textAlign="center" py={6}>
        <Assignment sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Ready to Generate Tasks
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Click "Generate Tasks" to create a detailed breakdown of your project.
        </Typography>
      </Box>
    );
  }

  const totalEstimatedHours = data.tasks.reduce((sum, task) => sum + task.estimatedHours, 0);
  const tasksByPhase = data.tasks.reduce((acc, task) => {
    if (!acc[task.phase]) acc[task.phase] = [];
    acc[task.phase].push(task);
    return acc;
  }, {} as Record<string, typeof data.tasks>);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Task Breakdown
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        AI has generated {data.tasks.length} tasks for your project totaling {totalEstimatedHours} hours.
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">
                {data.tasks.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Tasks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">
                {totalEstimatedHours}h
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Estimated Hours
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">
                {Object.keys(tasksByPhase).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Phases
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="error">
                {data.tasks.filter(t => t.priority === 'high').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                High Priority
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Task List by Phase */}
      {Object.entries(tasksByPhase).map(([phase, tasks]) => (
        <Box key={phase} sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <Chip 
              label={phase.toUpperCase()} 
              color={getPhaseColor(phase) as any} 
              sx={{ mr: 2 }} 
            />
            <Typography variant="subtitle1">
              {tasks.length} tasks • {tasks.reduce((sum, task) => sum + task.estimatedHours, 0)} hours
            </Typography>
          </Box>
          
          <List>
            {tasks.map((task, index) => (
              <ListItem key={task.id} divider={index < tasks.length - 1}>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle2">{task.title}</Typography>
                      <Chip 
                        label={task.priority} 
                        size="small" 
                        color={getPriorityColor(task.priority) as any}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {task.description}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Schedule fontSize="small" />
                          <Typography variant="caption">
                            {task.estimatedHours}h estimated
                          </Typography>
                        </Box>
                        {task.dependencies.length > 0 && (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Flag fontSize="small" />
                            <Typography variant="caption">
                              {task.dependencies.length} dependencies
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      ))}

      <Alert severity="success">
        <Typography variant="subtitle2" gutterBottom>
          Task Breakdown Complete
        </Typography>
        <Typography variant="body2">
          Your project has been broken down into {data.tasks.length} manageable tasks 
          across {Object.keys(tasksByPhase).length} development phases. 
          You can customize these tasks after project creation.
        </Typography>
      </Alert>
    </Box>
  );
};

export default TaskBreakdownStep;
