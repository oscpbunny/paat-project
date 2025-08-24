/**
 * VamshMonitoringService - Real-time monitoring of Vamsh development progress
 * 
 * This service provides comprehensive monitoring of Vamsh AI development projects
 * including real-time status tracking, progress monitoring, and completion detection.
 */

import { vamshService, VamshMessage, VamshAgentState } from './VamshService';
import { databaseService } from './database';
import { TaskBreakdownResponse, DevelopmentTask } from './TaskBreakdownService';

export interface VamshProject {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'paused' | 'completed' | 'failed' | 'cancelled';
  vamshStatus: VamshAgentState | null;
  progress: {
    currentPhase: string;
    currentTask: string;
    completedTasks: number;
    totalTasks: number;
    percentage: number;
    startTime: Date;
    lastUpdate: Date;
    estimatedCompletion?: Date;
  };
  tasks: DevelopmentTask[];
  messages: VamshMessage[];
  metrics: {
    totalTimeSpent: number; // minutes
    tasksCompleted: number;
    tasksRemaining: number;
    averageTaskTime: number; // minutes
    efficiency: number; // percentage
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectMonitoringConfig {
  pollInterval: number; // milliseconds
  enableRealTimeUpdates: boolean;
  autoStartMonitoring: boolean;
  notificationThresholds: {
    errorCount: number;
    stuckThreshold: number; // minutes without progress
    warningThreshold: number; // minutes without progress
  };
}

export interface MonitoringEvent {
  type: 'status_change' | 'progress_update' | 'task_completed' | 'phase_completed' | 'error' | 'warning' | 'project_completed';
  projectId: string;
  timestamp: Date;
  data: any;
  message: string;
}

export type MonitoringEventHandler = (event: MonitoringEvent) => void;

export class VamshMonitoringService {
  private readonly db: typeof databaseService;
  private readonly monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly eventHandlers: MonitoringEventHandler[] = [];
  private readonly webSocketConnections: Map<string, WebSocket> = new Map();
  
  private config: ProjectMonitoringConfig = {
    pollInterval: 5000, // 5 seconds
    enableRealTimeUpdates: true,
    autoStartMonitoring: true,
    notificationThresholds: {
      errorCount: 3,
      stuckThreshold: 30, // 30 minutes
      warningThreshold: 15, // 15 minutes
    },
  };

  constructor(database: typeof databaseService) {
    this.db = database;
    this.initializeMonitoring();
  }

  /**
   * Initialize monitoring service
   */
  private async initializeMonitoring(): Promise<void> {
    try {
      // Create monitoring tables if they don't exist
      await this.createMonitoringTables();
      
      // Resume monitoring for active projects
      if (this.config.autoStartMonitoring) {
        await this.resumeActiveProjectMonitoring();
      }

      console.log('[VamshMonitoringService] Initialized successfully');
    } catch (error) {
      console.error('[VamshMonitoringService] Initialization failed:', error);
    }
  }

  /**
   * Create necessary database tables for monitoring
   */
  private async createMonitoringTables(): Promise<void> {
    const createProjectsTable = `
      CREATE TABLE IF NOT EXISTS vamsh_projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        vamsh_status TEXT,
        current_phase TEXT,
        current_task TEXT,
        completed_tasks INTEGER DEFAULT 0,
        total_tasks INTEGER DEFAULT 0,
        progress_percentage REAL DEFAULT 0,
        start_time DATETIME,
        last_update DATETIME DEFAULT CURRENT_TIMESTAMP,
        estimated_completion DATETIME,
        total_time_spent INTEGER DEFAULT 0,
        tasks_completed INTEGER DEFAULT 0,
        tasks_remaining INTEGER DEFAULT 0,
        average_task_time REAL DEFAULT 0,
        efficiency REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createMonitoringEventsTable = `
      CREATE TABLE IF NOT EXISTS monitoring_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        data TEXT,
        message TEXT,
        FOREIGN KEY (project_id) REFERENCES vamsh_projects (id)
      )
    `;

    await this.db.executeSQL(createProjectsTable);
    await this.db.executeSQL(createMonitoringEventsTable);
  }

  /**
   * Start monitoring a Vamsh project
   */
  async startProjectMonitoring(
    projectId: string,
    projectName: string,
    description: string,
    tasks: DevelopmentTask[]
  ): Promise<VamshProject> {
    try {
      // Check if Vamsh is healthy
      const isHealthy = await vamshService.isHealthy();
      if (!isHealthy) {
        throw new Error('Vamsh server is not healthy');
      }

      // Create project record
      const project: VamshProject = {
        id: projectId,
        name: projectName,
        description,
        status: 'pending',
        vamshStatus: null,
        progress: {
          currentPhase: 'Initialization',
          currentTask: 'Starting project',
          completedTasks: 0,
          totalTasks: tasks.length,
          percentage: 0,
          startTime: new Date(),
          lastUpdate: new Date(),
        },
        tasks,
        messages: [],
        metrics: {
          totalTimeSpent: 0,
          tasksCompleted: 0,
          tasksRemaining: tasks.length,
          averageTaskTime: 0,
          efficiency: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store in database
      await this.saveProject(project);

      // Start monitoring
      await this.startMonitoringProject(projectId);

      // Emit event
      this.emitEvent({
        type: 'status_change',
        projectId,
        timestamp: new Date(),
        data: { status: 'pending' },
        message: `Started monitoring project: ${projectName}`,
      });

      console.log(`[VamshMonitoringService] Started monitoring project: ${projectName}`);
      return project;

    } catch (error) {
      console.error(`[VamshMonitoringService] Failed to start monitoring project ${projectName}:`, error);
      throw error;
    }
  }

  /**
   * Stop monitoring a project
   */
  async stopProjectMonitoring(projectId: string): Promise<void> {
    // Clear monitoring interval
    const interval = this.monitoringIntervals.get(projectId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(projectId);
    }

    // Close WebSocket connection
    const ws = this.webSocketConnections.get(projectId);
    if (ws) {
      ws.close();
      this.webSocketConnections.delete(projectId);
    }

    // Update project status
    await this.updateProjectStatus(projectId, 'cancelled');

    this.emitEvent({
      type: 'status_change',
      projectId,
      timestamp: new Date(),
      data: { status: 'cancelled' },
      message: 'Project monitoring stopped',
    });

    console.log(`[VamshMonitoringService] Stopped monitoring project: ${projectId}`);
  }

  /**
   * Get current project status
   */
  async getProjectStatus(projectId: string): Promise<VamshProject | null> {
    try {
      const result = await this.db.queryFirstSQL(
        'SELECT * FROM vamsh_projects WHERE id = ?',
        [projectId]
      );

      if (!result) {
        return null;
      }

      return this.hydrateProject(result);
    } catch (error) {
      console.error(`[VamshMonitoringService] Failed to get project status for ${projectId}:`, error);
      return null;
    }
  }

  /**
   * Get all monitored projects
   */
  async getAllProjects(): Promise<VamshProject[]> {
    try {
      const results = await this.db.querySQL('SELECT * FROM vamsh_projects ORDER BY created_at DESC');
      return results.map(result => this.hydrateProject(result));
    } catch (error) {
      console.error('[VamshMonitoringService] Failed to get all projects:', error);
      return [];
    }
  }

  /**
   * Get active projects
   */
  async getActiveProjects(): Promise<VamshProject[]> {
    try {
      const results = await this.db.querySQL(
        'SELECT * FROM vamsh_projects WHERE status IN (?, ?) ORDER BY last_update DESC',
        ['pending', 'active']
      );
      return results.map(result => this.hydrateProject(result));
    } catch (error) {
      console.error('[VamshMonitoringService] Failed to get active projects:', error);
      return [];
    }
  }

  /**
   * Update project progress
   */
  async updateProjectProgress(
    projectId: string,
    currentPhase: string,
    currentTask: string,
    completedTasks: number
  ): Promise<void> {
    const project = await this.getProjectStatus(projectId);
    if (!project) return;

    const percentage = (completedTasks / project.progress.totalTasks) * 100;
    const now = new Date();

    project.progress = {
      ...project.progress,
      currentPhase,
      currentTask,
      completedTasks,
      percentage,
      lastUpdate: now,
    };

    // Update metrics
    project.metrics.tasksCompleted = completedTasks;
    project.metrics.tasksRemaining = project.progress.totalTasks - completedTasks;
    
    if (completedTasks > 0) {
      const timeSpent = (now.getTime() - project.progress.startTime.getTime()) / 60000; // minutes
      project.metrics.totalTimeSpent = timeSpent;
      project.metrics.averageTaskTime = timeSpent / completedTasks;
      project.metrics.efficiency = (completedTasks / project.progress.totalTasks) * 100;
    }

    await this.saveProject(project);

    this.emitEvent({
      type: 'progress_update',
      projectId,
      timestamp: now,
      data: { 
        phase: currentPhase, 
        task: currentTask, 
        completed: completedTasks, 
        percentage 
      },
      message: `Progress: ${percentage.toFixed(1)}% - ${currentTask}`,
    });
  }

  /**
   * Handle task completion
   */
  async onTaskCompleted(projectId: string, taskId: string, taskName: string): Promise<void> {
    const project = await this.getProjectStatus(projectId);
    if (!project) return;

    const completedTasks = project.progress.completedTasks + 1;
    
    await this.updateProjectProgress(
      projectId,
      project.progress.currentPhase,
      `Completed: ${taskName}`,
      completedTasks
    );

    this.emitEvent({
      type: 'task_completed',
      projectId,
      timestamp: new Date(),
      data: { taskId, taskName, completedTasks },
      message: `Task completed: ${taskName}`,
    });

    // Check if project is complete
    if (completedTasks >= project.progress.totalTasks) {
      await this.onProjectCompleted(projectId);
    }
  }

  /**
   * Handle project completion
   */
  async onProjectCompleted(projectId: string): Promise<void> {
    const project = await this.getProjectStatus(projectId);
    if (!project) return;

    project.status = 'completed';
    project.progress.percentage = 100;
    project.progress.estimatedCompletion = new Date();

    await this.saveProject(project);
    await this.stopProjectMonitoring(projectId);

    this.emitEvent({
      type: 'project_completed',
      projectId,
      timestamp: new Date(),
      data: { totalTime: project.metrics.totalTimeSpent },
      message: `Project completed successfully: ${project.name}`,
    });
  }

  /**
   * Start monitoring a specific project
   */
  private async startMonitoringProject(projectId: string): Promise<void> {
    // Set up WebSocket connection if enabled
    if (this.config.enableRealTimeUpdates) {
      try {
        const ws = vamshService.createWebSocketConnection();
        this.webSocketConnections.set(projectId, ws);

        ws.onmessage = (event) => {
          this.handleWebSocketMessage(projectId, event.data);
        };

        ws.onerror = (error) => {
          console.error(`[VamshMonitoringService] WebSocket error for project ${projectId}:`, error);
        };
      } catch (error) {
        console.warn(`[VamshMonitoringService] Failed to establish WebSocket for project ${projectId}:`, error);
      }
    }

    // Set up polling interval
    const interval = setInterval(async () => {
      await this.pollProjectStatus(projectId);
    }, this.config.pollInterval);

    this.monitoringIntervals.set(projectId, interval);
  }

  /**
   * Poll project status from Vamsh
   */
  private async pollProjectStatus(projectId: string): Promise<void> {
    try {
      const project = await this.getProjectStatus(projectId);
      if (!project || !['pending', 'active'].includes(project.status)) {
        return;
      }

      // Get current Vamsh status
      const [isActive, messages, vamshStatus] = await Promise.all([
        vamshService.isAgentActive(project.name),
        vamshService.getMessages(project.name),
        vamshService.getAgentState(project.name).catch(() => null),
      ]);

      // Update project status
      const newStatus = isActive ? 'active' : (project.status === 'active' ? 'completed' : 'pending');
      
      if (newStatus !== project.status) {
        await this.updateProjectStatus(projectId, newStatus);
      }

      // Update Vamsh status
      project.vamshStatus = vamshStatus;
      project.messages = messages;
      
      // Check for progress updates
      if (vamshStatus && vamshStatus.completion_percentage !== project.progress.percentage) {
        const estimatedTasks = Math.floor((vamshStatus.completion_percentage / 100) * project.progress.totalTasks);
        await this.updateProjectProgress(
          projectId,
          vamshStatus.current_step || project.progress.currentPhase,
          vamshStatus.current_step || project.progress.currentTask,
          estimatedTasks
        );
      }

      // Check for stuck projects
      await this.checkProjectHealth(projectId, project);

    } catch (error) {
      console.error(`[VamshMonitoringService] Error polling status for project ${projectId}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emitEvent({
        type: 'error',
        projectId,
        timestamp: new Date(),
        data: { error: errorMessage },
        message: `Error monitoring project: ${errorMessage}`,
      });
    }
  }

  /**
   * Handle WebSocket messages
   */
  private handleWebSocketMessage(projectId: string, data: string): void {
    try {
      const message = JSON.parse(data);
      
      // Handle different message types
      switch (message.type) {
        case 'user-message':
          this.handleUserMessage(projectId, message);
          break;
        case 'progress-update':
          this.handleProgressUpdate(projectId, message);
          break;
        case 'task-completed':
          this.onTaskCompleted(projectId, message.taskId, message.taskName);
          break;
        default:
          console.log(`[VamshMonitoringService] Unhandled WebSocket message type: ${message.type}`);
      }
    } catch (error) {
      console.warn('[VamshMonitoringService] Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle user messages from Vamsh
   */
  private handleUserMessage(projectId: string, message: any): void {
    this.emitEvent({
      type: 'status_change',
      projectId,
      timestamp: new Date(),
      data: message,
      message: message.content || 'Message received from Vamsh',
    });
  }

  /**
   * Handle progress updates from WebSocket
   */
  private handleProgressUpdate(projectId: string, message: any): void {
    if (message.phase && message.task && typeof message.completed === 'number') {
      this.updateProjectProgress(
        projectId,
        message.phase,
        message.task,
        message.completed
      );
    }
  }

  /**
   * Check project health and detect issues
   */
  private async checkProjectHealth(projectId: string, project: VamshProject): Promise<void> {
    const now = new Date();
    const timeSinceUpdate = (now.getTime() - project.progress.lastUpdate.getTime()) / 60000; // minutes

    // Check if project is stuck
    if (timeSinceUpdate > this.config.notificationThresholds.stuckThreshold) {
      this.emitEvent({
        type: 'error',
        projectId,
        timestamp: now,
        data: { timeSinceUpdate },
        message: `Project appears stuck - no progress for ${Math.floor(timeSinceUpdate)} minutes`,
      });
    } else if (timeSinceUpdate > this.config.notificationThresholds.warningThreshold) {
      this.emitEvent({
        type: 'warning',
        projectId,
        timestamp: now,
        data: { timeSinceUpdate },
        message: `No progress for ${Math.floor(timeSinceUpdate)} minutes`,
      });
    }
  }

  /**
   * Resume monitoring for active projects
   */
  private async resumeActiveProjectMonitoring(): Promise<void> {
    const activeProjects = await this.getActiveProjects();
    
    for (const project of activeProjects) {
      await this.startMonitoringProject(project.id);
      console.log(`[VamshMonitoringService] Resumed monitoring for project: ${project.name}`);
    }
  }

  /**
   * Update project status in database
   */
  private async updateProjectStatus(projectId: string, status: VamshProject['status']): Promise<void> {
    await this.db.executeSQL(
      'UPDATE vamsh_projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, projectId]
    );

    this.emitEvent({
      type: 'status_change',
      projectId,
      timestamp: new Date(),
      data: { status },
      message: `Project status changed to: ${status}`,
    });
  }

  /**
   * Save project to database
   */
  private async saveProject(project: VamshProject): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO vamsh_projects (
        id, name, description, status, vamsh_status, current_phase, current_task,
        completed_tasks, total_tasks, progress_percentage, start_time, last_update,
        estimated_completion, total_time_spent, tasks_completed, tasks_remaining,
        average_task_time, efficiency, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.executeSQL(sql, [
      project.id,
      project.name,
      project.description,
      project.status,
      JSON.stringify(project.vamshStatus),
      project.progress.currentPhase,
      project.progress.currentTask,
      project.progress.completedTasks,
      project.progress.totalTasks,
      project.progress.percentage,
      project.progress.startTime.toISOString(),
      project.progress.lastUpdate.toISOString(),
      project.progress.estimatedCompletion?.toISOString(),
      project.metrics.totalTimeSpent,
      project.metrics.tasksCompleted,
      project.metrics.tasksRemaining,
      project.metrics.averageTaskTime,
      project.metrics.efficiency,
      project.createdAt.toISOString(),
      project.updatedAt.toISOString(),
    ]);
  }

  /**
   * Hydrate project from database row
   */
  private hydrateProject(row: any): VamshProject {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status,
      vamshStatus: row.vamsh_status ? JSON.parse(row.vamsh_status) : null,
      progress: {
        currentPhase: row.current_phase,
        currentTask: row.current_task,
        completedTasks: row.completed_tasks,
        totalTasks: row.total_tasks,
        percentage: row.progress_percentage,
        startTime: new Date(row.start_time),
        lastUpdate: new Date(row.last_update),
        estimatedCompletion: row.estimated_completion ? new Date(row.estimated_completion) : undefined,
      },
      tasks: [], // Tasks would need to be loaded separately
      messages: [], // Messages would need to be loaded separately
      metrics: {
        totalTimeSpent: row.total_time_spent,
        tasksCompleted: row.tasks_completed,
        tasksRemaining: row.tasks_remaining,
        averageTaskTime: row.average_task_time,
        efficiency: row.efficiency,
      },
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Emit monitoring event
   */
  private emitEvent(event: MonitoringEvent): void {
    // Store event in database
    this.db.executeSQL(
      'INSERT INTO monitoring_events (project_id, event_type, timestamp, data, message) VALUES (?, ?, ?, ?, ?)',
      [event.projectId, event.type, event.timestamp.toISOString(), JSON.stringify(event.data), event.message]
    ).catch(error => {
      console.error('[VamshMonitoringService] Failed to store monitoring event:', error);
    });

    // Notify event handlers
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('[VamshMonitoringService] Event handler error:', error);
      }
    });
  }

  /**
   * Add event handler
   */
  addEventHandler(handler: MonitoringEventHandler): void {
    this.eventHandlers.push(handler);
  }

  /**
   * Remove event handler
   */
  removeEventHandler(handler: MonitoringEventHandler): void {
    const index = this.eventHandlers.indexOf(handler);
    if (index > -1) {
      this.eventHandlers.splice(index, 1);
    }
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<ProjectMonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get monitoring configuration
   */
  getConfig(): ProjectMonitoringConfig {
    return { ...this.config };
  }

  /**
   * Get monitoring events for a project
   */
  async getProjectEvents(projectId: string, limit = 50): Promise<MonitoringEvent[]> {
    try {
      const results = await this.db.querySQL(
        'SELECT * FROM monitoring_events WHERE project_id = ? ORDER BY timestamp DESC LIMIT ?',
        [projectId, limit]
      );

      return results.map((row: any) => ({
        type: row.event_type as MonitoringEvent['type'],
        projectId: row.project_id,
        timestamp: new Date(row.timestamp),
        data: row.data ? JSON.parse(row.data) : null,
        message: row.message,
      }));
    } catch (error) {
      console.error(`[VamshMonitoringService] Failed to get events for project ${projectId}:`, error);
      return [];
    }
  }

  /**
   * Clean up monitoring service
   */
  async cleanup(): Promise<void> {
    // Stop all monitoring intervals
    for (const [projectId, interval] of this.monitoringIntervals) {
      clearInterval(interval);
    }
    this.monitoringIntervals.clear();

    // Close all WebSocket connections
    for (const [projectId, ws] of this.webSocketConnections) {
      ws.close();
    }
    this.webSocketConnections.clear();

    console.log('[VamshMonitoringService] Cleanup completed');
  }
}

// Create singleton instance
let monitoringServiceInstance: VamshMonitoringService | null = null;

export const createVamshMonitoringService = (database: typeof databaseService): VamshMonitoringService => {
  if (!monitoringServiceInstance) {
    monitoringServiceInstance = new VamshMonitoringService(database);
  }
  return monitoringServiceInstance;
};

// Create default instance using the singleton databaseService
export const vamshMonitoringService = createVamshMonitoringService(databaseService);
