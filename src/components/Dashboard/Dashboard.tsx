/**
 * PAAT - AI Personal Assistant Agent Tool
 * Comprehensive Project Dashboard Component
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
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Alert,
  Skeleton
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as ProjectIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Computer as VamshIcon,
  Psychology as AIIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Import services
import { databaseService } from '../../services/database';
import { vamshService } from '../../services/VamshService';
import { vamshMonitoringService } from '../../services/VamshMonitoringService';
import { useAppStore } from '../../stores/appStore';
import { webSocketService } from '../../services/WebSocketService';
import { useRealTimeStore, useConnectionStatus } from '../../stores/realTimeStore';
import { vamshHealthMonitor } from '../../services/VamshHealthMonitorService';

// Import new real-time components
import RealTimeMonitor from './RealTimeMonitor';
import ProjectWizard, { ProjectWizardData } from '../ProjectWizard/ProjectWizard';

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
}

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  vamshHealthy: boolean;
  ollamaHealthy: boolean;
}

interface RecentActivity {
  id: string;
  type: 'project_created' | 'project_completed' | 'vamsh_started' | 'error_occurred';
  message: string;
  timestamp: string;
  projectName?: string;
}

const Dashboard: React.FC = () => {
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    vamshHealthy: false,
    ollamaHealthy: false
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  // Store
  const { setCurrentProject, setLoading: setAppLoading } = useAppStore();

  // Chart data
  const [projectProgressData, setProjectProgressData] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);

  // Effects
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Load all dashboard data
  const loadDashboardData = async () => {
    if (!loading) setRefreshing(true);
    
    try {
      await Promise.all([
        loadProjects(),
        loadStats(),
        loadRecentActivity(),
        loadChartData()
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load projects from database
  const loadProjects = async () => {
    try {
      // For now, use mock data until database service is browser-compatible
      const mockProjects: Project[] = [
        {
          id: '1',
          name: 'E-Commerce Platform',
          description: 'Full-stack e-commerce solution with React and Node.js',
          status: 'active',
          vamsh_status: 'in_progress',
          completion_percentage: 65,
          priority: 'high',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          estimated_duration: 120,
          actual_duration: 78
        },
        {
          id: '2',
          name: 'Task Management App',
          description: 'Collaborative task management with real-time updates',
          status: 'completed',
          vamsh_status: 'completed',
          completion_percentage: 100,
          priority: 'medium',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString(),
          estimated_duration: 80,
          actual_duration: 85
        },
        {
          id: '3',
          name: 'AI Chat Interface',
          description: 'Modern chat interface with AI-powered responses',
          status: 'active',
          vamsh_status: 'pending',
          completion_percentage: 25,
          priority: 'low',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date(Date.now() - 7200000).toISOString(),
          estimated_duration: 60,
          actual_duration: 15
        }
      ];
      
      setProjects(mockProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  // Load dashboard statistics
  const loadStats = async () => {
    try {
      // Use mock data for browser compatibility
      const mockStats: DashboardStats = {
        totalProjects: 3,
        activeProjects: 2,
        completedProjects: 1,
        totalTasks: 15,
        completedTasks: 8,
        vamshHealthy: false, // Will be checked via health monitor
        ollamaHealthy: true
      };
      
      // Get real-time Vamsh health status from health monitor
      try {
        const vamshHealthy = vamshHealthMonitor.isHealthy();
        const vamshSummary = vamshHealthMonitor.getHealthSummary();
        mockStats.vamshHealthy = vamshHealthy;
        console.log('Vamsh health status:', vamshSummary);
      } catch (error) {
        console.warn('Failed to get Vamsh health status:', error);
        mockStats.vamshHealthy = false;
      }
      
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Set default stats even if there's an error
      setStats({
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        vamshHealthy: false,
        ollamaHealthy: true
      });
    }
  };

  // Load recent activity
  const loadRecentActivity = async () => {
    try {
      // Use mock data for browser compatibility
      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'project_created',
          message: 'E-Commerce Platform',
          timestamp: new Date().toISOString(),
          projectName: 'E-Commerce Platform'
        },
        {
          id: '2',
          type: 'project_completed',
          message: 'Task Management App',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          projectName: 'Task Management App'
        },
        {
          id: '3',
          type: 'project_created',
          message: 'AI Chat Interface',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          projectName: 'AI Chat Interface'
        }
      ];
      
      setRecentActivity(mockActivity);
    } catch (error) {
      console.error('Failed to load recent activity:', error);
    }
  };

  // Load chart data
  const loadChartData = async () => {
    try {
      // Generate sample progress data
      const progressData = projects.slice(0, 4).map(project => ({
        name: project.name.substring(0, 10) + '...',
        progress: project.completion_percentage,
        estimated: project.estimated_duration || 100,
        actual: project.actual_duration || 0
      }));

      setProjectProgressData(progressData);

      // Generate sample activity data for the last 7 days
      const activityData = Array.from({ length: 7 }, (_, i) => ({
        day: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en', { weekday: 'short' }),
        projects: Math.floor(Math.random() * 5) + 1,
        tasks: Math.floor(Math.random() * 20) + 5
      }));

      setActivityData(activityData);
    } catch (error) {
      console.error('Failed to load chart data:', error);
    }
  };

  // Handle project creation
  const handleCreateProject = () => {
    setWizardOpen(true);
  };

  // Handle wizard completion
  const handleWizardComplete = (data: ProjectWizardData) => {
    console.log('Project created:', data);
    // Here you would normally save to database and refresh the data
    // For now, just reload dashboard data
    loadDashboardData();
  };

  // Handle project selection
  const handleSelectProject = (project: Project) => {
    setCurrentProject({
      id: project.id,
      name: project.name,
      path: '', // Default empty path for mock data
      description: project.description,
      createdAt: new Date(project.created_at),
      updatedAt: new Date(project.updated_at)
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
        return 'warning';
      case 'cancelled':
      case 'error':
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24
      }
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Box sx={{ flex: 1, p: 3, backgroundColor: 'background.default', overflow: 'auto' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Dashboard
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
                AI-powered project management and monitoring
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton 
                onClick={loadDashboardData} 
                disabled={refreshing}
                color="primary"
              >
                <RefreshIcon />
              </IconButton>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateProject}
                sx={{ ml: 1 }}
              >
                New Project
              </Button>
            </Box>
          </Box>
        </motion.div>

        {/* System Status Alert */}
        <motion.div variants={itemVariants}>
          {(!stats.vamshHealthy || !stats.ollamaHealthy) && (
            <Alert 
              severity="warning" 
              sx={{ mb: 3 }}
              action={
                <Button color="inherit" size="small">
                  Check Status
                </Button>
              }
            >
              {!stats.vamshHealthy && 'Vamsh AI is offline. '}
              {!stats.ollamaHealthy && 'Ollama is not responding. '}
              Some features may be limited.
            </Alert>
          )}
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants}>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <ProjectIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        {loading ? <Skeleton width={40} /> : stats.totalProjects}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Projects
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {stats.activeProjects} active, {stats.completedProjects} completed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                      <CheckIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        {loading ? <Skeleton width={40} /> : stats.completedTasks}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Completed Tasks
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {stats.totalTasks} total tasks
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: stats.vamshHealthy ? 'success.main' : 'error.main', mr: 2 }}>
                      <VamshIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Vamsh AI
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {loading ? <Skeleton width={60} /> : (stats.vamshHealthy ? 'Online' : 'Offline')}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip 
                    label={stats.vamshHealthy ? 'Healthy' : 'Disconnected'} 
                    size="small"
                    color={stats.vamshHealthy ? 'success' : 'error'}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                      <AIIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Ollama
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {loading ? <Skeleton width={60} /> : 'Ready'}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip 
                    label="4 Models" 
                    size="small"
                    color="secondary"
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </motion.div>

        {/* Main Content Grid */}
        <Grid container spacing={3}>
          {/* Recent Projects */}
          <Grid item xs={12} lg={8}>
            <motion.div variants={itemVariants}>
              <Card sx={{ height: 400 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Recent Projects
                  </Typography>
                  {loading ? (
                    <Box>
                      {[1, 2, 3].map((i) => (
                        <Box key={i} sx={{ mb: 2 }}>
                          <Skeleton variant="rectangular" height={60} />
                        </Box>
                      ))}
                    </Box>
                  ) : projects.length > 0 ? (
                    <Box sx={{ height: 320, overflow: 'auto' }}>
                      {projects.map((project, index) => (
                        <motion.div
                          key={project.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Paper 
                            sx={{ 
                              p: 2, 
                              mb: 2, 
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'action.hover' }
                            }}
                            onClick={() => handleSelectProject(project)}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  {project.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  {project.description}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                  <Chip 
                                    label={project.status} 
                                    size="small" 
                                    color={getStatusColor(project.status) as any}
                                  />
                                  <Chip 
                                    label={project.priority} 
                                    size="small" 
                                    variant="outlined"
                                    color={getPriorityColor(project.priority) as any}
                                  />
                                </Box>
                              </Box>
                              <Box sx={{ ml: 2, minWidth: 120 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                  {project.completion_percentage}% complete
                                </Typography>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={project.completion_percentage} 
                                  sx={{ height: 6, borderRadius: 3 }}
                                />
                              </Box>
                            </Box>
                          </Paper>
                        </motion.div>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <FolderIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">
                        No projects yet. Create your first project to get started.
                      </Typography>
                      <Button 
                        variant="contained" 
                        startIcon={<AddIcon />}
                        onClick={handleCreateProject}
                        sx={{ mt: 2 }}
                      >
                        Create Project
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Real-time Monitor */}
          <Grid item xs={12} lg={4}>
            <motion.div variants={itemVariants}>
              <RealTimeMonitor height={400} />
            </motion.div>
          </Grid>

          {/* Project Progress Chart */}
          <Grid item xs={12} lg={6}>
            <motion.div variants={itemVariants}>
              <Card sx={{ height: 300 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Project Progress
                  </Typography>
                  {loading ? (
                    <Skeleton variant="rectangular" height={200} />
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={projectProgressData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="progress" 
                          stroke="#8884d8" 
                          fill="#8884d8" 
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Activity Chart */}
          <Grid item xs={12} lg={6}>
            <motion.div variants={itemVariants}>
              <Card sx={{ height: 300 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Weekly Activity
                  </Typography>
                  {loading ? (
                    <Skeleton variant="rectangular" height={200} />
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="projects" stroke="#8884d8" strokeWidth={2} />
                        <Line type="monotone" dataKey="tasks" stroke="#82ca9d" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>

      {/* Project Creation Wizard */}
      <ProjectWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onComplete={handleWizardComplete}
      />
    </Box>
  );
};

export default Dashboard;
