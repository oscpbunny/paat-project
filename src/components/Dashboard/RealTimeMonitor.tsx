import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Divider,
  Badge,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import webSocketService from '../../services/WebSocketService';
import {
  useRealTimeStore,
  useConnectionStatus,
  useActivityLogs,
  useServiceStatuses,
  useProjectUpdates,
  useRealTimeEnabled,
} from '../../stores/realTimeStore';

interface RealTimeMonitorProps {
  height?: number;
  showControls?: boolean;
}

const RealTimeMonitor: React.FC<RealTimeMonitorProps> = ({
  height = 400,
  showControls = true,
}) => {
  const { isConnected, status } = useConnectionStatus();
  const activityLogs = useActivityLogs(10);
  const serviceStatuses = useServiceStatuses();
  const projectUpdates = useProjectUpdates();
  const isRealTimeEnabled = useRealTimeEnabled();
  
  const {
    setConnectionStatus,
    toggleRealTime,
    clearActivityLogs,
    addActivityLog,
  } = useRealTimeStore();

  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const initializeConnection = async () => {
      setIsInitializing(true);
      
      // Set up event listeners
      webSocketService.on('connected', () => {
        setConnectionStatus('connected');
        addActivityLog({
          type: 'system',
          title: 'Real-time Connected',
          message: 'Successfully connected to real-time monitoring',
          severity: 'success',
        });
      });

      webSocketService.on('disconnected', () => {
        setConnectionStatus('disconnected');
        addActivityLog({
          type: 'system',
          title: 'Real-time Disconnected',
          message: 'Lost connection to real-time monitoring',
          severity: 'warning',
        });
      });

      webSocketService.on('projectUpdate', (update) => {
        useRealTimeStore.getState().updateProject(update);
      });

      webSocketService.on('serviceStatus', (status) => {
        useRealTimeStore.getState().updateServiceStatus(status);
      });

      webSocketService.on('activityLog', (log) => {
        addActivityLog(log);
      });

      webSocketService.on('error', (error) => {
        addActivityLog({
          type: 'error',
          title: 'Connection Error',
          message: error.message || 'Unknown connection error',
          severity: 'error',
        });
      });

      // Attempt connection
      try {
        setConnectionStatus('connecting');
        await webSocketService.connect();
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setConnectionStatus('disconnected');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeConnection();

    return () => {
      webSocketService.disconnect();
      webSocketService.removeAllListeners();
    };
  }, [isRealTimeEnabled, setConnectionStatus, addActivityLog]);

  const handleToggleRealTime = () => {
    if (isRealTimeEnabled) {
      webSocketService.disconnect();
      setConnectionStatus('disconnected');
    }
    toggleRealTime();
  };

  const handleRefresh = () => {
    if (isConnected) {
      webSocketService.requestServiceStatus();
      addActivityLog({
        type: 'system',
        title: 'Status Refreshed',
        message: 'Requested fresh service status update',
        severity: 'info',
      });
    }
  };

  const getStatusIcon = (severity: string) => {
    switch (severity) {
      case 'success': return <CheckCircleIcon color="success" fontSize="small" />;
      case 'error': return <ErrorIcon color="error" fontSize="small" />;
      case 'warning': return <WarningIcon color="warning" fontSize="small" />;
      default: return <InfoIcon color="info" fontSize="small" />;
    }
  };

  const getConnectionColor = () => {
    switch (status) {
      case 'connected': return 'success';
      case 'connecting': return 'warning';
      default: return 'error';
    }
  };

  const getConnectionIcon = () => {
    if (isInitializing || status === 'connecting') {
      return <CircularProgress size={20} />;
    }
    return isConnected ? <WifiIcon /> : <WifiOffIcon />;
  };

  const activeProjects = Object.values(projectUpdates).filter(
    (update) => update.status === 'running'
  );

  return (
    <Card sx={{ height, display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            {getConnectionIcon()}
            <Typography variant="h6">Real-time Monitor</Typography>
            <Chip
              label={status}
              color={getConnectionColor() as any}
              size="small"
              variant="outlined"
            />
          </Box>
          
          {showControls && (
            <Box display="flex" alignItems="center" gap={1}>
              <Tooltip title="Refresh status">
                <IconButton 
                  onClick={handleRefresh} 
                  disabled={!isConnected}
                  size="small"
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Clear logs">
                <IconButton 
                  onClick={clearActivityLogs}
                  size="small"
                >
                  <ClearIcon />
                </IconButton>
              </Tooltip>
              <FormControlLabel
                control={
                  <Switch
                    checked={isRealTimeEnabled}
                    onChange={handleToggleRealTime}
                    size="small"
                  />
                }
                label="Live"
                sx={{ ml: 1 }}
              />
            </Box>
          )}
        </Box>

        {/* Active Projects Section */}
        {activeProjects.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              Active Projects ({activeProjects.length})
            </Typography>
            {activeProjects.map((project) => (
              <Box key={project.projectId} mb={1}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="body2" noWrap>
                    {project.projectId}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {Math.round(project.progress)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={project.progress} 
                  sx={{ height: 4, borderRadius: 2 }}
                />
                {project.currentTask && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    {project.currentTask}
                  </Typography>
                )}
              </Box>
            ))}
            <Divider sx={{ my: 1 }} />
          </Box>
        )}

        {/* Service Status Section */}
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Service Status
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {Object.entries(serviceStatuses).map(([service, status]) => (
              <Chip
                key={service}
                label={service.toUpperCase()}
                color={
                  status.status === 'connected' ? 'success' :
                  status.status === 'error' ? 'error' : 'warning'
                }
                size="small"
                variant="outlined"
              />
            ))}
            {Object.keys(serviceStatuses).length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No service status available
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>

      {/* Activity Feed */}
      <CardContent sx={{ pt: 0, flexGrow: 1, overflow: 'hidden' }}>
        <Typography variant="subtitle2" gutterBottom>
          Activity Feed
          <Badge badgeContent={activityLogs.length} color="primary" sx={{ ml: 1 }}>
            <Box />
          </Badge>
        </Typography>
        
        <Box sx={{ height: '100%', overflow: 'auto' }}>
          <AnimatePresence>
            <List dense>
              {activityLogs.length === 0 ? (
                <ListItem>
                  <ListItemText 
                    primary="No recent activity"
                    secondary={isConnected ? "Monitoring for updates..." : "Connect to see live updates"}
                  />
                </ListItem>
              ) : (
                activityLogs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <ListItem disablePadding>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {getStatusIcon(log.severity)}
                      </ListItemIcon>
                      <ListItemText
                        primary={log.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {log.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDistanceToNow(log.timestamp)} ago
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  </motion.div>
                ))
              )}
            </List>
          </AnimatePresence>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RealTimeMonitor;
