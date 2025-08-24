/**
 * PAAT - AI Personal Assistant Agent Tool
 * Real-time Monitoring Dashboard
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Alert,
  Tooltip,
  Badge,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import {
  Computer as VamshIcon,
  Psychology as AIIcon,
  Visibility as MonitorIcon,
  Speed as PerformanceIcon,
  Storage as DatabaseIcon,
  NetworkCheck as NetworkIcon,
  Folder as FileIcon,
  Build as ProcessIcon,
  CheckCircle as HealthyIcon,
  CheckCircle,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Settings as SettingsIcon,
  Timeline as ActivityIcon,
  Memory as MemoryIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Schedule as ScheduleIcon,
  Code as CodeIcon,
  Analytics as MetricsIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Import store only (services imported on-demand to avoid issues)
import { useAppStore } from '../../stores/appStore';

interface SystemHealth {
  component: string;
  status: 'healthy' | 'warning' | 'error' | 'offline';
  lastCheck: string;
  responseTime?: number;
  message?: string;
  uptime?: number;
}

interface VamshStatus {
  connected: boolean;
  version?: string;
  activeModel?: string;
  uptime?: number;
  tasksCompleted?: number;
  currentTask?: string;
  lastActivity?: string;
  memoryUsage?: number;
  cpuUsage?: number;
}

interface FileChange {
  id: string;
  file: string;
  type: 'created' | 'modified' | 'deleted' | 'renamed';
  timestamp: string;
  size?: number;
  projectId?: string;
}

interface PerformanceMetrics {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  networkIO: number;
  diskIO: number;
  responseTime: number;
}

const MonitoringPage: React.FC = () => {
  // State
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([]);
  const [vamshStatus, setVamshStatus] = useState<VamshStatus>({
    connected: false
  });
  const [fileChanges, setFileChanges] = useState<FileChange[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Store
  const { addNotification } = useAppStore();

  // Load initial data
  useEffect(() => {
    loadMonitoringData();
    
    if (autoRefresh) {
      const interval = setInterval(loadMonitoringData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Real-time monitoring effect
  useEffect(() => {
    if (realTimeEnabled) {
      // Simulate real-time updates
      const interval = setInterval(() => {
        updatePerformanceMetrics();
        updateFileChanges();
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [realTimeEnabled]);

  // Load all monitoring data
  const loadMonitoringData = async () => {
    try {
      setLoading(true);
      
      await Promise.all([
        loadSystemHealth(),
        loadVamshStatus(),
        loadFileChanges(),
        loadPerformanceMetrics()
      ]);
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
      addNotification({
        type: 'error',
        title: 'Monitoring Error',
        message: 'Failed to load monitoring data'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load system health status
  const loadSystemHealth = async () => {
    try {
      const mockHealthData: SystemHealth[] = [
        {
          component: 'Vamsh AI Service',
          status: Math.random() > 0.3 ? 'healthy' : 'warning',
          lastCheck: new Date().toISOString(),
          responseTime: Math.floor(Math.random() * 500) + 100,
          uptime: Math.floor(Math.random() * 86400) + 3600
        },
        {
          component: 'Ollama AI Engine',
          status: Math.random() > 0.1 ? 'healthy' : 'offline',
          lastCheck: new Date().toISOString(),
          responseTime: Math.floor(Math.random() * 2000) + 500,
          uptime: Math.floor(Math.random() * 86400) + 7200
        },
        {
          component: 'SQLite Database',
          status: 'healthy',
          lastCheck: new Date().toISOString(),
          responseTime: Math.floor(Math.random() * 50) + 10,
          uptime: Math.floor(Math.random() * 86400) + 10800
        },
        {
          component: 'File Watcher',
          status: Math.random() > 0.2 ? 'healthy' : 'warning',
          lastCheck: new Date().toISOString(),
          responseTime: Math.floor(Math.random() * 100) + 20
        },
        {
          component: 'WebSocket Server',
          status: Math.random() > 0.15 ? 'healthy' : 'error',
          lastCheck: new Date().toISOString(),
          responseTime: Math.floor(Math.random() * 200) + 50
        }
      ];

      setSystemHealth(mockHealthData);
    } catch (error) {
      console.error('Failed to load system health:', error);
    }
  };

  // Load Vamsh status
  const loadVamshStatus = async () => {
    try {
      const connected = Math.random() > 0.2;
      
      const mockVamshStatus: VamshStatus = {
        connected,
        version: connected ? '2.1.5' : undefined,
        activeModel: connected ? 'qwen2.5:7b' : undefined,
        uptime: connected ? Math.floor(Math.random() * 86400) + 3600 : undefined,
        tasksCompleted: connected ? Math.floor(Math.random() * 50) + 10 : undefined,
        currentTask: connected && Math.random() > 0.5 ? 'Implementing user authentication' : undefined,
        lastActivity: connected ? new Date(Date.now() - Math.random() * 600000).toISOString() : undefined,
        memoryUsage: connected ? Math.floor(Math.random() * 40) + 30 : undefined,
        cpuUsage: connected ? Math.floor(Math.random() * 60) + 20 : undefined
      };

      setVamshStatus(mockVamshStatus);
    } catch (error) {
      console.error('Failed to load Vamsh status:', error);
      setVamshStatus({ connected: false });
    }
  };

  // Load recent file changes
  const loadFileChanges = async () => {
    try {
      const changeTypes: FileChange['type'][] = ['created', 'modified', 'deleted', 'renamed'];
      const fileExtensions = ['.ts', '.tsx', '.js', '.json', '.md', '.css', '.html'];
      
      const mockChanges: FileChange[] = Array.from({ length: 8 }, (_, i) => ({
        id: `change-${i}`,
        file: `src/components/Example${i}${fileExtensions[Math.floor(Math.random() * fileExtensions.length)]}`,
        type: changeTypes[Math.floor(Math.random() * changeTypes.length)],
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        size: Math.floor(Math.random() * 10000) + 1000,
        projectId: Math.random() > 0.3 ? '1' : undefined
      }));

      setFileChanges(mockChanges.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    } catch (error) {
      console.error('Failed to load file changes:', error);
    }
  };

  // Load performance metrics
  const loadPerformanceMetrics = async () => {
    try {
      const now = Date.now();
      const mockMetrics: PerformanceMetrics[] = Array.from({ length: 20 }, (_, i) => ({
        timestamp: new Date(now - (19 - i) * 60000).toLocaleTimeString(),
        cpuUsage: Math.floor(Math.random() * 60) + 20,
        memoryUsage: Math.floor(Math.random() * 40) + 40,
        networkIO: Math.floor(Math.random() * 100) + 50,
        diskIO: Math.floor(Math.random() * 80) + 20,
        responseTime: Math.floor(Math.random() * 1000) + 200
      }));

      setPerformanceMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
    }
  };

  // Update performance metrics in real-time
  const updatePerformanceMetrics = useCallback(() => {
    const newMetric: PerformanceMetrics = {
      timestamp: new Date().toLocaleTimeString(),
      cpuUsage: Math.floor(Math.random() * 60) + 20,
      memoryUsage: Math.floor(Math.random() * 40) + 40,
      networkIO: Math.floor(Math.random() * 100) + 50,
      diskIO: Math.floor(Math.random() * 80) + 20,
      responseTime: Math.floor(Math.random() * 1000) + 200
    };

    setPerformanceMetrics(prev => [...prev.slice(1), newMetric]);
  }, []);

  // Update file changes in real-time
  const updateFileChanges = useCallback(() => {
    if (Math.random() > 0.7) { // 30% chance of new file change
      const changeTypes: FileChange['type'][] = ['created', 'modified', 'deleted'];
      const fileExtensions = ['.ts', '.tsx', '.js', '.json', '.md'];
      
      const newChange: FileChange = {
        id: `change-${Date.now()}`,
        file: `src/components/Live${Date.now() % 1000}${fileExtensions[Math.floor(Math.random() * fileExtensions.length)]}`,
        type: changeTypes[Math.floor(Math.random() * changeTypes.length)],
        timestamp: new Date().toISOString(),
        size: Math.floor(Math.random() * 5000) + 500,
        projectId: Math.random() > 0.5 ? '1' : undefined
      };

      setFileChanges(prev => [newChange, ...prev.slice(0, 15)]);
    }
  }, []);

  // Get status color and icon
  const getStatusDisplay = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy':
        return { color: 'success', icon: <HealthyIcon /> };
      case 'warning':
        return { color: 'warning', icon: <WarningIcon /> };
      case 'error':
        return { color: 'error', icon: <ErrorIcon /> };
      case 'offline':
        return { color: 'error', icon: <ErrorIcon /> };
      default:
        return { color: 'default', icon: <WarningIcon /> };
    }
  };

  // Get file change icon
  const getFileChangeIcon = (type: FileChange['type']) => {
    switch (type) {
      case 'created':
        return <CodeIcon color="success" />;
      case 'modified':
        return <CodeIcon color="primary" />;
      case 'deleted':
        return <CodeIcon color="error" />;
      case 'renamed':
        return <CodeIcon color="warning" />;
      default:
        return <CodeIcon />;
    }
  };

  // Format uptime
  const formatUptime = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading monitoring data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, p: 3, backgroundColor: 'background.default', overflow: 'auto' }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>
              System Monitoring
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Real-time monitoring of Vamsh AI, system health, and file changes
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={realTimeEnabled}
                  onChange={(e) => setRealTimeEnabled(e.target.checked)}
                  color="primary"
                />
              }
              label="Real-time Updates"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  color="primary"
                />
              }
              label="Auto Refresh"
            />
            <IconButton onClick={loadMonitoringData} color="primary">
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {/* System Health Overview */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            System Health
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {systemHealth.map((health, index) => {
              const statusDisplay = getStatusDisplay(health.status);
              return (
                <Grid item xs={12} sm={6} md={4} key={health.component}>
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ bgcolor: `${statusDisplay.color}.main`, mr: 2 }}>
                            {statusDisplay.icon}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {health.component}
                            </Typography>
                            <Chip 
                              label={health.status.toUpperCase()} 
                              size="small" 
                              color={statusDisplay.color as any}
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        </Box>
                        
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Response Time: {health.responseTime || 0}ms
                          </Typography>
                          {health.uptime && (
                            <Typography variant="body2" color="text.secondary">
                              Uptime: {formatUptime(health.uptime)}
                            </Typography>
                          )}
                          <Typography variant="body2" color="text.secondary">
                            Last Check: {new Date(health.lastCheck).toLocaleTimeString()}
                          </Typography>
                        </Box>

                        {health.responseTime && (
                          <LinearProgress
                            variant="determinate"
                            value={Math.min((health.responseTime / 1000) * 100, 100)}
                            sx={{ height: 4, borderRadius: 2 }}
                            color={health.responseTime < 200 ? 'success' : health.responseTime < 500 ? 'warning' : 'error'}
                          />
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        </motion.div>

        {/* Vamsh AI Status */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Vamsh AI Status
          </Typography>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: vamshStatus.connected ? 'success.main' : 'error.main', 
                        width: 56, 
                        height: 56,
                        mr: 2 
                      }}
                    >
                      <VamshIcon sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {vamshStatus.connected ? 'Connected' : 'Disconnected'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {vamshStatus.version ? `Version: ${vamshStatus.version}` : 'Service unavailable'}
                      </Typography>
                    </Box>
                  </Box>

                  {vamshStatus.connected && (
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <AIIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Active Model"
                          secondary={vamshStatus.activeModel || 'None'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <ScheduleIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Uptime"
                          secondary={formatUptime(vamshStatus.uptime)}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircle />
                        </ListItemIcon>
                        <ListItemText
                          primary="Tasks Completed"
                          secondary={vamshStatus.tasksCompleted || 0}
                        />
                      </ListItem>
                      {vamshStatus.currentTask && (
                        <ListItem>
                          <ListItemIcon>
                            <ProcessIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Current Task"
                            secondary={vamshStatus.currentTask}
                          />
                        </ListItem>
                      )}
                    </List>
                  )}
                </Grid>

                <Grid item xs={12} md={6}>
                  {vamshStatus.connected && (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Resource Usage
                      </Typography>
                      
                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Memory Usage</Typography>
                          <Typography variant="body2">{vamshStatus.memoryUsage}%</Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={vamshStatus.memoryUsage || 0}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>

                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">CPU Usage</Typography>
                          <Typography variant="body2">{vamshStatus.cpuUsage}%</Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={vamshStatus.cpuUsage || 0}
                          sx={{ height: 8, borderRadius: 4 }}
                          color="secondary"
                        />
                      </Box>

                      {vamshStatus.lastActivity && (
                        <Typography variant="body2" color="text.secondary">
                          Last Activity: {new Date(vamshStatus.lastActivity).toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Performance Metrics
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} lg={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    System Performance (Last 20 minutes)
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={performanceMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <RechartsTooltip />
                      <Area 
                        type="monotone" 
                        dataKey="cpuUsage" 
                        stackId="1"
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.6}
                        name="CPU Usage (%)"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="memoryUsage" 
                        stackId="2"
                        stroke="#82ca9d" 
                        fill="#82ca9d" 
                        fillOpacity={0.6}
                        name="Memory Usage (%)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Network & Disk I/O
                  </Typography>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={performanceMetrics.slice(-5)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="networkIO" fill="#8884d8" name="Network I/O" />
                      <Bar dataKey="diskIO" fill="#82ca9d" name="Disk I/O" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </motion.div>

        {/* File Changes */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            File System Activity
          </Typography>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Recent File Changes</Typography>
                <Chip 
                  label={`${fileChanges.length} changes`} 
                  color="primary" 
                  variant="outlined"
                />
              </Box>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>File</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Project</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fileChanges.slice(0, 10).map((change) => (
                      <TableRow key={change.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getFileChangeIcon(change.type)}
                            <Typography variant="body2" sx={{ ml: 1, fontFamily: 'monospace' }}>
                              {change.file}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={change.type.toUpperCase()} 
                            size="small"
                            color={change.type === 'created' ? 'success' : 
                                   change.type === 'modified' ? 'primary' : 
                                   change.type === 'deleted' ? 'error' : 'warning'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatFileSize(change.size)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(change.timestamp).toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {change.projectId ? (
                            <Chip label="E-Commerce Platform" size="small" />
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Real-time Status Indicator */}
        <AnimatePresence>
          {realTimeEnabled && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={{
                position: 'fixed',
                bottom: 20,
                right: 20,
                zIndex: 1000
              }}
            >
              <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge variant="dot" color="success">
                  <ActivityIcon color="primary" />
                </Badge>
                <Typography variant="body2" color="text.secondary">
                  Real-time monitoring active
                </Typography>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Box>
  );
};

export default MonitoringPage;
