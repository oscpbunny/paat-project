/**
 * PAAT - AI Personal Assistant Agent Tool
 * Global Application State Store (Zustand)
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Types
export interface Project {
  id: string;
  name: string;
  path: string;
  description?: string;
  language?: string;
  framework?: string;
  createdAt: Date;
  updatedAt: Date;
  vamshConnected?: boolean;
  ollamaModel?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
  estimatedTime?: number; // minutes
  actualTime?: number; // minutes
  assignedTo?: 'vamsh' | 'user';
  progress?: number; // 0-100
}

export interface VamshStatus {
  connected: boolean;
  version?: string;
  activeModel?: string;
  uptime?: number;
  tasksCompleted?: number;
  currentTask?: string;
  lastActivity?: Date;
}

export interface OllamaStatus {
  connected: boolean;
  models: string[];
  activeModel?: string;
  version?: string;
  systemInfo?: {
    memory: number;
    gpu: boolean;
  };
}

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  autoSaveInterval: number; // seconds
  notifications: {
    desktop: boolean;
    sound: boolean;
    taskCompletion: boolean;
    vamshUpdates: boolean;
  };
  vamsh: {
    host: string;
    port: number;
    timeout: number;
    autoReconnect: boolean;
  };
  ollama: {
    host: string;
    port: number;
    defaultModel: string;
    maxTokens: number;
    temperature: number;
  };
  git: {
    autoCommit: boolean;
    commitMessage: string;
    pushOnComplete: boolean;
  };
}

// Store interface
interface AppState {
  // UI State
  isLoading: boolean;
  sidebarCollapsed: boolean;
  currentView: 'dashboard' | 'projects' | 'tasks' | 'monitoring' | 'settings';
  
  // Projects
  projects: Project[];
  currentProject: Project | null;
  recentProjects: Project[];
  
  // Tasks
  tasks: Task[];
  activeTasks: Task[];
  
  // External Services
  vamshStatus: VamshStatus;
  ollamaStatus: OllamaStatus;
  
  // Notifications
  notifications: AppNotification[];
  unreadCount: number;
  
  // Settings
  settings: AppSettings;
  
  // Statistics
  stats: {
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    totalTime: number; // minutes
    successRate: number; // percentage
  };
}

// Store actions
interface AppActions {
  // UI Actions
  setLoading: (loading: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentView: (view: AppState['currentView']) => void;
  
  // Project Actions
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (project: Project | null) => void;
  addToRecentProjects: (project: Project) => void;
  
  // Task Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  
  // Service Status Actions
  updateVamshStatus: (status: Partial<VamshStatus>) => void;
  updateOllamaStatus: (status: Partial<OllamaStatus>) => void;
  
  // Notification Actions
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Settings Actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  
  // Statistics Actions
  updateStats: () => void;
}

// Default settings
const defaultSettings: AppSettings = {
  theme: 'dark',
  sidebarCollapsed: false,
  autoSaveInterval: 30,
  notifications: {
    desktop: true,
    sound: true,
    taskCompletion: true,
    vamshUpdates: true,
  },
  vamsh: {
    host: 'localhost',
    port: 1337,
    timeout: 30000,
    autoReconnect: true,
  },
  ollama: {
    host: 'localhost',
    port: 11434,
    defaultModel: 'qwen2.5:7b',
    maxTokens: 4096,
    temperature: 0.7,
  },
  git: {
    autoCommit: false,
    commitMessage: 'PAAT: Automated commit via Vamsh AI',
    pushOnComplete: false,
  },
};

// Generate unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Create the store
export const useAppStore = create<AppState & AppActions>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        isLoading: false,
        sidebarCollapsed: false,
        currentView: 'dashboard',
        projects: [],
        currentProject: null,
        recentProjects: [],
        tasks: [],
        activeTasks: [],
        vamshStatus: {
          connected: false,
        },
        ollamaStatus: {
          connected: false,
          models: [],
        },
        notifications: [],
        unreadCount: 0,
        settings: defaultSettings,
        stats: {
          totalProjects: 0,
          totalTasks: 0,
          completedTasks: 0,
          totalTime: 0,
          successRate: 0,
        },

        // UI Actions
        setLoading: (loading) => set({ isLoading: loading }),
        
        toggleSidebar: () => set((state) => ({ 
          sidebarCollapsed: !state.sidebarCollapsed 
        })),
        
        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
        
        setCurrentView: (view) => set({ currentView: view }),

        // Project Actions
        addProject: (projectData) => {
          const project: Project = {
            ...projectData,
            id: generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          set((state) => ({
            projects: [...state.projects, project],
          }));
          
          // Update stats
          get().updateStats();
        },

        updateProject: (id, updates) => {
          set((state) => ({
            projects: state.projects.map((project) =>
              project.id === id
                ? { ...project, ...updates, updatedAt: new Date() }
                : project
            ),
          }));

          // Update current project if it's the one being updated
          const current = get().currentProject;
          if (current && current.id === id) {
            set({ currentProject: { ...current, ...updates, updatedAt: new Date() } });
          }
        },

        deleteProject: (id) => {
          set((state) => ({
            projects: state.projects.filter((project) => project.id !== id),
            recentProjects: state.recentProjects.filter((project) => project.id !== id),
            tasks: state.tasks.filter((task) => task.projectId !== id),
          }));

          // Clear current project if it's the one being deleted
          const current = get().currentProject;
          if (current && current.id === id) {
            set({ currentProject: null });
          }

          get().updateStats();
        },

        setCurrentProject: (project) => {
          set({ currentProject: project });
          if (project) {
            get().addToRecentProjects(project);
          }
        },

        addToRecentProjects: (project) => {
          set((state) => {
            const filtered = state.recentProjects.filter((p) => p.id !== project.id);
            return {
              recentProjects: [project, ...filtered].slice(0, 5), // Keep only 5 recent
            };
          });
        },

        // Task Actions
        addTask: (taskData) => {
          const task: Task = {
            ...taskData,
            id: generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
            status: taskData.status || 'pending',
            priority: taskData.priority || 'medium',
            progress: taskData.progress || 0,
          };

          set((state) => ({
            tasks: [...state.tasks, task],
            activeTasks: task.status === 'in-progress' 
              ? [...state.activeTasks, task] 
              : state.activeTasks,
          }));

          get().updateStats();
        },

        updateTask: (id, updates) => {
          set((state) => {
            const updatedTasks = state.tasks.map((task) =>
              task.id === id
                ? { ...task, ...updates, updatedAt: new Date() }
                : task
            );

            const updatedActiveTasks = updatedTasks.filter(
              (task) => task.status === 'in-progress'
            );

            return {
              tasks: updatedTasks,
              activeTasks: updatedActiveTasks,
            };
          });

          get().updateStats();
        },

        deleteTask: (id) => {
          set((state) => ({
            tasks: state.tasks.filter((task) => task.id !== id),
            activeTasks: state.activeTasks.filter((task) => task.id !== id),
          }));

          get().updateStats();
        },

        completeTask: (id) => {
          get().updateTask(id, { 
            status: 'completed', 
            progress: 100,
            actualTime: get().tasks.find(t => t.id === id)?.actualTime 
          });

          // Add completion notification
          const task = get().tasks.find((t) => t.id === id);
          if (task) {
            get().addNotification({
              type: 'success',
              title: 'Task Completed',
              message: `"${task.title}" has been completed successfully!`,
            });
          }
        },

        // Service Status Actions
        updateVamshStatus: (status) => {
          set((state) => ({
            vamshStatus: { ...state.vamshStatus, ...status },
          }));
        },

        updateOllamaStatus: (status) => {
          set((state) => ({
            ollamaStatus: { ...state.ollamaStatus, ...status },
          }));
        },

        // Notification Actions
        addNotification: (notificationData) => {
          const notification: AppNotification = {
            ...notificationData,
            id: generateId(),
            timestamp: new Date(),
            read: false,
          };

          set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
          }));
        },

        markNotificationRead: (id) => {
          set((state) => ({
            notifications: state.notifications.map((notification) =>
              notification.id === id
                ? { ...notification, read: true }
                : notification
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          }));
        },

        clearNotification: (id) => {
          set((state) => {
            const notification = state.notifications.find((n) => n.id === id);
            return {
              notifications: state.notifications.filter((n) => n.id !== id),
              unreadCount: notification && !notification.read 
                ? Math.max(0, state.unreadCount - 1) 
                : state.unreadCount,
            };
          });
        },

        clearAllNotifications: () => {
          set({ notifications: [], unreadCount: 0 });
        },

        // Settings Actions
        updateSettings: (updates) => {
          set((state) => ({
            settings: { ...state.settings, ...updates },
          }));
        },

        resetSettings: () => {
          set({ settings: defaultSettings });
        },

        // Statistics Actions
        updateStats: () => {
          const { projects, tasks } = get();
          const completedTasks = tasks.filter((task) => task.status === 'completed');
          const totalTime = tasks.reduce((sum, task) => sum + (task.actualTime || 0), 0);
          const successRate = tasks.length > 0 
            ? (completedTasks.length / tasks.length) * 100 
            : 0;

          set({
            stats: {
              totalProjects: projects.length,
              totalTasks: tasks.length,
              completedTasks: completedTasks.length,
              totalTime,
              successRate: Math.round(successRate * 100) / 100,
            },
          });
        },
      }),
      {
        name: 'paat-app-store',
        partialize: (state) => ({
          // Persist only essential data
          projects: state.projects,
          recentProjects: state.recentProjects,
          settings: state.settings,
          currentProject: state.currentProject,
          sidebarCollapsed: state.sidebarCollapsed,
          currentView: state.currentView,
        }),
      }
    ),
    {
      name: 'PAAT App Store',
    }
  )
);
