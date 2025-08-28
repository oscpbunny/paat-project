import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { ProjectUpdate, ServiceStatus } from '../services/WebSocketService';

export interface ActivityLog {
  id: string;
  timestamp: number;
  type: 'project' | 'service' | 'system' | 'error';
  title: string;
  message: string;
  projectId?: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  metadata?: Record<string, any>;
}

export interface RealTimeState {
  // Connection status
  isConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  lastConnectionAttempt: number | null;
  
  // Project updates
  projectUpdates: Record<string, ProjectUpdate>;
  
  // Service status
  serviceStatuses: Record<string, ServiceStatus>;
  
  // Activity logs
  activityLogs: ActivityLog[];
  maxActivityLogs: number;
  
  // UI state
  isRealTimeEnabled: boolean;
  notificationSettings: {
    projectUpdates: boolean;
    serviceAlerts: boolean;
    errorNotifications: boolean;
  };
  
  // Actions
  setConnectionStatus: (status: 'connected' | 'connecting' | 'disconnected') => void;
  updateProject: (update: ProjectUpdate) => void;
  updateServiceStatus: (status: ServiceStatus) => void;
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  clearActivityLogs: () => void;
  toggleRealTime: () => void;
  updateNotificationSettings: (settings: Partial<RealTimeState['notificationSettings']>) => void;
  getProjectStatus: (projectId: string) => ProjectUpdate | null;
  getServiceStatus: (service: string) => ServiceStatus | null;
  getRecentActivity: (limit?: number) => ActivityLog[];
}

export const useRealTimeStore = create<RealTimeState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isConnected: false,
    connectionStatus: 'disconnected',
    lastConnectionAttempt: null,
    
    projectUpdates: {},
    serviceStatuses: {},
    activityLogs: [],
    maxActivityLogs: 500,
    
    isRealTimeEnabled: true,
    notificationSettings: {
      projectUpdates: true,
      serviceAlerts: true,
      errorNotifications: true,
    },
    
    // Actions
    setConnectionStatus: (status) =>
      set((state) => ({
        connectionStatus: status,
        isConnected: status === 'connected',
        lastConnectionAttempt: status === 'connecting' ? Date.now() : state.lastConnectionAttempt,
      })),
    
    updateProject: (update) =>
      set((state) => {
        const previousUpdate = state.projectUpdates[update.projectId];
        const hasChanged = !previousUpdate || 
          previousUpdate.status !== update.status || 
          previousUpdate.progress !== update.progress;
        
        if (hasChanged && state.notificationSettings.projectUpdates) {
          // Add activity log for significant project changes
          const newLog: Omit<ActivityLog, 'id' | 'timestamp'> = {
            type: 'project',
            title: `Project ${update.status}`,
            message: update.currentTask || `Project ${update.projectId} is ${update.status}`,
            projectId: update.projectId,
            severity: update.status === 'failed' ? 'error' : 
                     update.status === 'completed' ? 'success' : 'info',
            metadata: { progress: update.progress, ...update.metadata },
          };
          
          get().addActivityLog(newLog);
        }
        
        return {
          projectUpdates: {
            ...state.projectUpdates,
            [update.projectId]: update,
          },
        };
      }),
    
    updateServiceStatus: (status) =>
      set((state) => {
        const previousStatus = state.serviceStatuses[status.service];
        const hasChanged = !previousStatus || previousStatus.status !== status.status;
        
        if (hasChanged && state.notificationSettings.serviceAlerts) {
          // Add activity log for service status changes
          const newLog: Omit<ActivityLog, 'id' | 'timestamp'> = {
            type: 'service',
            title: `${status.service.toUpperCase()} ${status.status}`,
            message: status.error || `${status.service} service is ${status.status}`,
            severity: status.status === 'error' ? 'error' : 
                     status.status === 'connected' ? 'success' : 'warning',
            metadata: { service: status.service },
          };
          
          get().addActivityLog(newLog);
        }
        
        return {
          serviceStatuses: {
            ...state.serviceStatuses,
            [status.service]: status,
          },
        };
      }),
    
    addActivityLog: (log) =>
      set((state) => {
        const newLog: ActivityLog = {
          ...log,
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        };
        
        const updatedLogs = [newLog, ...state.activityLogs];
        
        // Keep only the most recent logs
        if (updatedLogs.length > state.maxActivityLogs) {
          updatedLogs.splice(state.maxActivityLogs);
        }
        
        return { activityLogs: updatedLogs };
      }),
    
    clearActivityLogs: () =>
      set(() => ({ activityLogs: [] })),
    
    toggleRealTime: () =>
      set((state) => ({ isRealTimeEnabled: !state.isRealTimeEnabled })),
    
    updateNotificationSettings: (settings) =>
      set((state) => ({
        notificationSettings: { ...state.notificationSettings, ...settings },
      })),
    
    // Selectors
    getProjectStatus: (projectId) => {
      const state = get();
      return state.projectUpdates[projectId] || null;
    },
    
    getServiceStatus: (service) => {
      const state = get();
      return state.serviceStatuses[service] || null;
    },
    
    getRecentActivity: (limit = 50) => {
      const state = get();
      return state.activityLogs.slice(0, limit);
    },
  }))
);

// Helper selectors
export const useConnectionStatus = () => 
  useRealTimeStore((state) => ({
    isConnected: state.isConnected,
    status: state.connectionStatus,
    lastAttempt: state.lastConnectionAttempt,
  }));

export const useProjectUpdates = () => 
  useRealTimeStore((state) => state.projectUpdates);

export const useServiceStatuses = () => 
  useRealTimeStore((state) => state.serviceStatuses);

export const useActivityLogs = (limit?: number) => 
  useRealTimeStore((state) => state.getRecentActivity(limit));

export const useRealTimeEnabled = () => 
  useRealTimeStore((state) => state.isRealTimeEnabled);

export default useRealTimeStore;
