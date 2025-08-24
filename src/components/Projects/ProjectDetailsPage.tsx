/**
 * PAAT - AI Personal Assistant Agent Tool
 * Project Details Page with Task Management
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  Avatar,
  Tab,
  Tabs,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Tooltip,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Add as AddIcon,
  Assignment as TaskIcon,
  Schedule as ScheduleIcon,
  TrendingUp as ProgressIcon,
  Computer as VamshIcon,
  Psychology as AIIcon,
  CheckCircle as CompletedIcon,
  RadioButtonUnchecked as PendingIcon,
  PlayCircle as InProgressIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandIcon,
  Code as CodeIcon,
  BugReport as BugIcon,
  Build as BuildIcon,
  Visibility as ReviewIcon,
  CloudUpload as DeployIcon,
  Analytics as AnalyticsIcon,
  Timeline as TimelineIcon,
  People as TeamIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

// Import services and store
import { databaseService } from '../../services/database';
import { vamshIntegrationService } from '../../services/VamshIntegrationService';
import { vamshMonitoringService } from '../../services/VamshMonitoringService';
import { useAppStore } from '../../stores/appStore';

interface Task {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  type: 'analysis' | 'development' | 'testing' | 'review' | 'deployment';
  priority: 'low' | 'medium' | 'high';
  estimated_hours: number;
  actual_hours?: number;
  assigned_to?: 'vamsh' | 'user';
  created_at: string;
  updated_at: string;
  progress?: number;
  dependencies?: string[];
  tags?: string[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  vamsh_status: 'pending' | 'in_progress' | 'completed' | 'error';
  completion_percentage: number;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  estimated_duration?: number;
  actual_duration?: number;
  tags?: string[];
  path?: string;
  technical_stack?: string[];
  frameworks?: string[];
  databases?: string[];
  tasks?: Task[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ProjectDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  
  // State
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [newTaskDialog, setNewTaskDialog] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    name: '',
    description: '',
    type: 'development' as Task['type'],
    priority: 'medium' as Task['priority'],
    estimated_hours: 8
  });

  // Store
  const { addNotification, setCurrentProject } = useAppStore();

  // Load project data
  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      
      // Mock project data
      const mockProject: Project = {
        id: projectId!,
        name: 'E-Commerce Platform',
        description: 'Full-stack e-commerce solution with React and Node.js, featuring user authentication, product catalog, shopping cart, payment integration, and admin dashboard. This project aims to create a modern, scalable online shopping platform with advanced features.',
        status: 'active',
        vamsh_status: 'in_progress',
        completion_percentage: 65,
        priority: 'high',
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        updated_at: new Date().toISOString(),
        estimated_duration: 120,
        actual_duration: 78,
        tags: ['React', 'Node.js', 'MongoDB', 'Stripe', 'Redux', 'Express'],
        path: '/projects/ecommerce-platform',
        technical_stack: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
        frameworks: ['Express.js', 'Redux Toolkit', 'Material-UI'],
        databases: ['MongoDB', 'Redis']
      };

      const mockTasks: Task[] = [
        {
          id: '1',
          name: 'User Authentication System',
          description: 'Implement complete user authentication with registration, login, password reset, and JWT tokens',
          status: 'completed',
          type: 'development',
          priority: 'high',
          estimated_hours: 16,
          actual_hours: 18,
          assigned_to: 'vamsh',
          created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
          updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          progress: 100,
          tags: ['Authentication', 'JWT', 'Security']
        },
        {
          id: '2',
          name: 'Product Catalog API',
          description: 'Create RESTful API endpoints for product management, categories, and inventory',
          status: 'in_progress',
          type: 'development',
          priority: 'high',
          estimated_hours: 20,
          actual_hours: 12,
          assigned_to: 'vamsh',
          created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString(),
          progress: 60,
          tags: ['API', 'Products', 'REST']
        },
        {
          id: '3',
          name: 'Shopping Cart Functionality',
          description: 'Frontend and backend implementation of shopping cart with session management',
          status: 'pending',
          type: 'development',
          priority: 'medium',
          estimated_hours: 12,
          assigned_to: 'vamsh',
          created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
          updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
          progress: 0,
          dependencies: ['2'],
          tags: ['Cart', 'Session', 'Frontend']
        },
        {
          id: '4',
          name: 'Payment Integration',
          description: 'Integrate Stripe payment gateway with order processing and webhook handling',
          status: 'pending',
          type: 'development',
          priority: 'high',
          estimated_hours: 24,
          assigned_to: 'user',
          created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
          updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
          progress: 0,
          dependencies: ['3'],
          tags: ['Payment', 'Stripe', 'Webhooks']
        },
        {
          id: '5',
          name: 'API Testing Suite',
          description: 'Comprehensive testing for all API endpoints with unit and integration tests',
          status: 'pending',
          type: 'testing',
          priority: 'medium',
          estimated_hours: 16,
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          progress: 0,
          tags: ['Testing', 'Jest', 'Integration']
        },
        {
          id: '6',
          name: 'Code Review & Optimization',
          description: 'Review all code for security, performance, and best practices compliance',
          status: 'pending',
          type: 'review',
          priority: 'low',
          estimated_hours: 8,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          progress: 0,
          tags: ['Review', 'Security', 'Performance']
        }
      ];

      setProject(mockProject);
      setTasks(mockTasks);
      
      // Update current project in store
      setCurrentProject({
        id: mockProject.id,
        name: mockProject.name,
        path: mockProject.path || '',
        description: mockProject.description,
        createdAt: new Date(mockProject.created_at),
        updatedAt: new Date(mockProject.updated_at)
      });

    } catch (error) {
      console.error('Failed to load project:', error);
      addNotification({
        type: 'error',
        title: 'Load Error',
        message: 'Failed to load project details.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle task drag and drop
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId as Task['status'];
    const updatedTasks = tasks.map(task =>
      task.id === draggableId ? { ...task, status: newStatus, updated_at: new Date().toISOString() } : task
    );

    setTasks(updatedTasks);
    
    addNotification({
      type: 'success',
      title: 'Task Updated',
      message: `Task moved to ${newStatus.replace('_', ' ')}`
    });
  };

  // Handle new task creation
  const handleCreateTask = () => {
    const newTask: Task = {
      id: Date.now().toString(),
      ...newTaskData,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      progress: 0
    };

    setTasks([...tasks, newTask]);
    setNewTaskDialog(false);
    setNewTaskData({
      name: '',
      description: '',
      type: 'development',
      priority: 'medium',
      estimated_hours: 8
    });

    addNotification({
      type: 'success',
      title: 'Task Created',
      message: `Task "${newTask.name}" has been created.`
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'in_progress':
        return 'primary';
      case 'completed':
        return 'success';
      case 'paused':
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  // Get task type icon
  const getTaskTypeIcon = (type: Task['type']) => {
    switch (type) {
      case 'analysis':
        return <AnalyticsIcon />;
      case 'development':
        return <CodeIcon />;
      case 'testing':
        return <BugIcon />;
      case 'review':
        return <ReviewIcon />;
      case 'deployment':
        return <DeployIcon />;
      default:
        return <TaskIcon />;
    }
  };

  // Get task status icon
  const getTaskStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return <PendingIcon color="warning" />;
      case 'in_progress':
        return <InProgressIcon color="primary" />;
      case 'completed':
        return <CompletedIcon color="success" />;
      default:
        return <ErrorIcon color="error" />;
    }
  };

  // Render task kanban board
  const renderTaskKanban = () => {
    const columns = [
      { id: 'pending', title: 'Pending', color: '#f57c00' },
      { id: 'in_progress', title: 'In Progress', color: '#1976d2' },
      { id: 'completed', title: 'Completed', color: '#388e3c' }
    ] as const;

    const getTasksByStatus = (status: Task['status']) =>
      tasks.filter(task => task.status === status);

    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <Grid container spacing={3} sx={{ height: 'calc(100vh - 300px)', overflow: 'hidden' }}>
          {columns.map(column => (
            <Grid item xs={12} md={4} key={column.id}>
              <Paper
                sx={{
                  height: '100%',
                  borderTop: `4px solid ${column.color}`,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {column.title}
                    <Badge
                      badgeContent={getTasksByStatus(column.id).length}
                      color="primary"
                      sx={{ ml: 2 }}
                    />
                  </Typography>
                </Box>
                
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{
                        flex: 1,
                        p: 2,
                        backgroundColor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
                        overflow: 'auto'
                      }}
                    >
                      {getTasksByStatus(column.id).map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              sx={{
                                mb: 2,
                                opacity: snapshot.isDragging ? 0.8 : 1,
                                transform: snapshot.isDragging ? 'rotate(5deg)' : 'none',
                                cursor: 'grab',
                                '&:hover': {
                                  boxShadow: 3
                                }
                              }}
                            >
                              <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                                    {task.name}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Tooltip title={`Type: ${task.type}`}>
                                      <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                                        {getTaskTypeIcon(task.type)}
                                      </Avatar>
                                    </Tooltip>
                                    {getTaskStatusIcon(task.status)}
                                  </Box>
                                </Box>
                                
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                  {task.description}
                                </Typography>
                                
                                {task.progress !== undefined && task.status === 'in_progress' && (
                                  <Box sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                      <Typography variant="caption" color="text.secondary">
                                        Progress
                                      </Typography>
                                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                        {task.progress}%
                                      </Typography>
                                    </Box>
                                    <LinearProgress
                                      variant="determinate"
                                      value={task.progress}
                                      sx={{ height: 4, borderRadius: 2 }}
                                    />
                                  </Box>
                                )}
                                
                                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                  <Chip
                                    label={task.priority}
                                    size="small"
                                    color={getPriorityColor(task.priority) as any}
                                    variant="outlined"
                                  />
                                  {task.assigned_to && (
                                    <Chip
                                      label={task.assigned_to === 'vamsh' ? 'Vamsh AI' : 'Manual'}
                                      size="small"
                                      color={task.assigned_to === 'vamsh' ? 'primary' : 'secondary'}
                                      variant="outlined"
                                    />
                                  )}
                                </Box>
                                
                                {task.tags && task.tags.length > 0 && (
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                                    {task.tags.map(tag => (
                                      <Chip
                                        key={tag}
                                        label={tag}
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontSize: '0.7rem' }}
                                      />
                                    ))}
                                  </Box>
                                )}
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {task.actual_hours ? `${task.actual_hours}h` : '0h'} / {task.estimated_hours}h
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(task.updated_at).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </DragDropContext>
    );
  };

  // Render project timeline
  const renderTimeline = () => {
    const timelineEvents = [
      {
        date: project?.created_at,
        title: 'Project Created',
        description: 'Project initialized and added to PAAT',
        type: 'created'
      },
      {
        date: new Date(Date.now() - 86400000 * 8).toISOString(),
        title: 'Authentication Completed',
        description: 'User authentication system fully implemented',
        type: 'milestone'
      },
      {
        date: new Date(Date.now() - 86400000 * 6).toISOString(),
        title: 'Product API Started',
        description: 'Began development of product catalog API',
        type: 'started'
      },
      {
        date: new Date().toISOString(),
        title: 'In Progress',
        description: 'Currently working on product catalog and shopping cart',
        type: 'current'
      }
    ];

    return (
      <Box>
        {timelineEvents.map((event, index) => (
          <Card key={index} sx={{ mb: 2, border: 1, borderColor: 'divider' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: event.type === 'current' ? 'primary.main' : 'grey.400', mr: 2, width: 32, height: 32 }}>
                  {event.type === 'created' && <AddIcon fontSize="small" />}
                  {event.type === 'milestone' && <CompletedIcon fontSize="small" />}
                  {event.type === 'started' && <InProgressIcon fontSize="small" />}
                  {event.type === 'current' && <TimelineIcon fontSize="small" />}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {event.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(event.date!).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {event.description}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading project...</Typography>
      </Box>
    );
  }

  if (!project) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Project not found
        </Typography>
        <Button onClick={() => navigate('/projects')} sx={{ mt: 2 }}>
          Back to Projects
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, backgroundColor: 'background.default', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={() => navigate('/projects')} sx={{ mr: 2 }}>
            <BackIcon />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {project.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {project.description}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<EditIcon />}>
              Edit
            </Button>
            {project.status === 'active' ? (
              <Button variant="contained" startIcon={<PauseIcon />} color="warning">
                Pause
              </Button>
            ) : (
              <Button variant="contained" startIcon={<StartIcon />} color="primary">
                Resume
              </Button>
            )}
          </Box>
        </Box>

        {/* Project Stats */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {project.completion_percentage}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 600, color: 'success.main' }}>
                {tasks.filter(t => t.status === 'completed').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tasks Done
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 600, color: 'info.main' }}>
                {project.actual_duration || 0}h
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Time Spent
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 600, color: 'warning.main' }}>
                {tasks.filter(t => t.status === 'in_progress').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In Progress
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <LinearProgress
            variant="determinate"
            value={project.completion_percentage}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          aria-label="project tabs"
        >
          <Tab label="Tasks" icon={<TaskIcon />} />
          <Tab label="Timeline" icon={<TimelineIcon />} />
          <Tab label="Analytics" icon={<AnalyticsIcon />} />
          <Tab label="Settings" icon={<SettingsIcon />} />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Task Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setNewTaskDialog(true)}
          >
            Add Task
          </Button>
        </Box>
        {renderTaskKanban()}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Project Timeline
        </Typography>
        {renderTimeline()}
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Project Analytics
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Task Distribution
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <PendingIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Pending Tasks"
                      secondary={`${tasks.filter(t => t.status === 'pending').length} tasks`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <InProgressIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="In Progress"
                      secondary={`${tasks.filter(t => t.status === 'in_progress').length} tasks`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CompletedIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Completed"
                      secondary={`${tasks.filter(t => t.status === 'completed').length} tasks`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Time Tracking
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Estimated: {project.estimated_duration}h
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Actual: {project.actual_duration}h
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Remaining: {(project.estimated_duration || 0) - (project.actual_duration || 0)}h
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={((project.actual_duration || 0) / (project.estimated_duration || 1)) * 100}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Project Settings
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Project Information
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Status"
                      secondary={
                        <Chip
                          label={project.status}
                          size="small"
                          color={getStatusColor(project.status) as any}
                        />
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Priority"
                      secondary={
                        <Chip
                          label={project.priority}
                          size="small"
                          color={getPriorityColor(project.priority) as any}
                        />
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Created"
                      secondary={new Date(project.created_at).toLocaleDateString()}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Last Updated"
                      secondary={new Date(project.updated_at).toLocaleDateString()}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Technical Stack
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {project.technical_stack?.map(tech => (
                    <Chip key={tech} label={tech} variant="outlined" />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* New Task Dialog */}
      <Dialog
        open={newTaskDialog}
        onClose={() => setNewTaskDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Task Name"
              value={newTaskData.name}
              onChange={(e) => setNewTaskData({ ...newTaskData, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={newTaskData.description}
              onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              select
              fullWidth
              label="Type"
              value={newTaskData.type}
              onChange={(e) => setNewTaskData({ ...newTaskData, type: e.target.value as Task['type'] })}
              sx={{ mb: 2 }}
            >
              <MenuItem value="analysis">Analysis</MenuItem>
              <MenuItem value="development">Development</MenuItem>
              <MenuItem value="testing">Testing</MenuItem>
              <MenuItem value="review">Review</MenuItem>
              <MenuItem value="deployment">Deployment</MenuItem>
            </TextField>
            <TextField
              select
              fullWidth
              label="Priority"
              value={newTaskData.priority}
              onChange={(e) => setNewTaskData({ ...newTaskData, priority: e.target.value as Task['priority'] })}
              sx={{ mb: 2 }}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </TextField>
            <TextField
              fullWidth
              type="number"
              label="Estimated Hours"
              value={newTaskData.estimated_hours}
              onChange={(e) => setNewTaskData({ ...newTaskData, estimated_hours: parseInt(e.target.value) })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewTaskDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateTask}
            variant="contained"
            disabled={!newTaskData.name.trim()}
          >
            Create Task
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectDetailsPage;
