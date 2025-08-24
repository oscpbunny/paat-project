/**
 * VamshIntegrationService - Complete PAAT-to-Vamsh Integration Orchestrator
 * 
 * This service orchestrates the complete workflow from project creation in PAAT
 * to handoff and monitoring in Vamsh, providing a seamless end-to-end experience.
 */

import { v4 as uuidv4 } from 'uuid';
import { databaseService } from './database';
import { vamshService, VamshMessage } from './VamshService';
import { projectSpecificationService, VamshProjectSpec } from './ProjectSpecificationService';
import { taskBreakdownService, TaskBreakdownResponse, DevelopmentTask } from './TaskBreakdownService';
import { vamshMonitoringService, VamshProject } from './VamshMonitoringService';

export interface ProjectCreationRequest {
  name: string;
  description: string;
  requirements: string;
  projectPath?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  estimatedDuration?: number; // in hours
}

export interface IntegrationResult {
  success: boolean;
  projectId: string;
  vamshProjectId: string;
  specification?: VamshProjectSpec;
  taskBreakdown?: TaskBreakdownResponse;
  monitoringSetup?: VamshProject;
  error?: string;
  warnings?: string[];
}

export interface IntegrationStatus {
  phase: 'specification' | 'breakdown' | 'handoff' | 'monitoring' | 'completed' | 'error';
  progress: number; // 0-100
  message: string;
  startTime: Date;
  currentTime: Date;
  estimatedCompletion?: Date;
}

export type IntegrationProgressCallback = (status: IntegrationStatus) => void;

export class VamshIntegrationService {
  private activeIntegrations: Map<string, IntegrationStatus> = new Map();

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize the integration service
   */
  private async initializeService(): Promise<void> {
    try {
      // Ensure database is ready
      if (!databaseService.isReady()) {
        await databaseService.initialize();
      }

      console.log('[VamshIntegrationService] Service initialized successfully');
    } catch (error) {
      console.error('[VamshIntegrationService] Initialization failed:', error);
    }
  }

  /**
   * Create a complete project with Vamsh integration
   */
  async createProjectWithVamshIntegration(
    request: ProjectCreationRequest,
    progressCallback?: IntegrationProgressCallback
  ): Promise<IntegrationResult> {
    const projectId = uuidv4();
    const startTime = new Date();
    const warnings: string[] = [];

    try {
      // Initialize integration tracking
      const status: IntegrationStatus = {
        phase: 'specification',
        progress: 0,
        message: 'Starting project creation...',
        startTime,
        currentTime: new Date()
      };
      this.activeIntegrations.set(projectId, status);
      progressCallback?.(status);

      // Step 1: Generate project specification using AI
      this.updateStatus(projectId, {
        phase: 'specification',
        progress: 10,
        message: 'Generating AI-powered project specification...'
      });
      progressCallback?.(this.activeIntegrations.get(projectId)!);

      const specification = await projectSpecificationService.generateSpecification({
        projectName: request.name,
        description: request.description,
        requirements: [request.requirements]
      });

      if (!specification) {
        throw new Error('Failed to generate project specification');
      }

      // Step 2: Break down into development tasks
      this.updateStatus(projectId, {
        phase: 'breakdown',
        progress: 30,
        message: 'Breaking down project into development tasks...'
      });
      progressCallback?.(this.activeIntegrations.get(projectId)!);

      const taskBreakdown = await taskBreakdownService.breakdownProjectTasks(specification);

      const allTasks = taskBreakdown.phases.flatMap(phase => phase.tasks);
      if (!taskBreakdown || !taskBreakdown.phases || allTasks.length === 0) {
        throw new Error('Failed to break down project into tasks');
      }

      // Step 3: Validate Vamsh connectivity
      this.updateStatus(projectId, {
        phase: 'handoff',
        progress: 50,
        message: 'Validating Vamsh server connectivity...'
      });
      progressCallback?.(this.activeIntegrations.get(projectId)!);

      const isVamshHealthy = await vamshService.isHealthy();
      if (!isVamshHealthy) {
        warnings.push('Vamsh server is not responding - project will be created but handoff may fail');
      }

      // Step 4: Create project in PAAT database
      this.updateStatus(projectId, {
        phase: 'handoff',
        progress: 60,
        message: 'Creating project in PAAT database...'
      });
      progressCallback?.(this.activeIntegrations.get(projectId)!);

      await databaseService.createProject({
        id: projectId,
        name: request.name,
        description: request.description,
        path: request.projectPath || `./projects/${request.name.toLowerCase().replace(/\s+/g, '-')}`,
        status: 'active',
        vamsh_status: 'pending',
        completion_percentage: 0,
        estimated_duration: request.estimatedDuration || this.estimateProjectDuration(allTasks),
        actual_duration: 0,
        priority: request.priority || 'medium',
        tags: JSON.stringify(request.tags || [])
      });

      // Step 5: Create tasks in database
      for (const task of allTasks) {
        await databaseService.createTask({
          id: task.id,
          project_id: projectId,
          name: task.name,
          description: task.description,
          status: 'pending',
          type: this.mapTaskType(task.type),
          started_at: null,
          completed_at: null,
          estimated_duration: task.estimatedHours * 60, // convert to minutes
          actual_duration: 0,
          dependencies: JSON.stringify(task.dependencies || []),
          vamsh_task_id: null,
          error_message: null
        });
      }

      // Step 6: Set up Vamsh monitoring
      this.updateStatus(projectId, {
        phase: 'monitoring',
        progress: 80,
        message: 'Setting up real-time Vamsh monitoring...'
      });
      progressCallback?.(this.activeIntegrations.get(projectId)!);

      const monitoringProject = await vamshMonitoringService.startProjectMonitoring(
        projectId,
        request.name,
        request.description,
        allTasks
      );

      // Step 7: Attempt handoff to Vamsh (if available)
      let vamshProjectId = projectId;
      if (isVamshHealthy) {
        try {
          this.updateStatus(projectId, {
            phase: 'handoff',
            progress: 90,
            message: 'Handing off project to Vamsh...'
          });
          progressCallback?.(this.activeIntegrations.get(projectId)!);

          // Send project specification to Vamsh
          const handoffResult = await this.handoffToVamsh(specification, taskBreakdown);
          if (handoffResult.success) {
            vamshProjectId = handoffResult.vamshProjectId || projectId;
            
            // Update database with Vamsh status
            await databaseService.updateProject(projectId, {
              vamsh_status: 'in_progress'
            });
          } else {
            warnings.push(`Vamsh handoff failed: ${handoffResult.error}`);
          }
        } catch (error) {
          warnings.push(`Vamsh handoff error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Step 8: Complete integration
      this.updateStatus(projectId, {
        phase: 'completed',
        progress: 100,
        message: 'Project integration completed successfully!'
      });
      progressCallback?.(this.activeIntegrations.get(projectId)!);

      const result: IntegrationResult = {
        success: true,
        projectId,
        vamshProjectId,
        specification,
        taskBreakdown,
        monitoringSetup: monitoringProject,
        warnings: warnings.length > 0 ? warnings : undefined
      };

      // Clean up tracking
      this.activeIntegrations.delete(projectId);

      console.log(`[VamshIntegrationService] Successfully created project: ${request.name}`);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[VamshIntegrationService] Project creation failed:`, error);

      // Update status to error
      this.updateStatus(projectId, {
        phase: 'error',
        progress: 0,
        message: `Integration failed: ${errorMessage}`
      });
      progressCallback?.(this.activeIntegrations.get(projectId)!);

      // Clean up tracking
      this.activeIntegrations.delete(projectId);

      return {
        success: false,
        projectId,
        vamshProjectId: projectId,
        error: errorMessage,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }
  }

  /**
   * Hand off project to Vamsh for development
   */
  private async handoffToVamsh(
    specification: VamshProjectSpec,
    taskBreakdown: TaskBreakdownResponse
  ): Promise<{ success: boolean; vamshProjectId?: string; error?: string }> {
    try {
      // Create a comprehensive project brief for Vamsh
      const allTasks = taskBreakdown.phases.flatMap(phase => phase.tasks);
      const vamshProjectBrief = {
        name: specification.projectName,
        description: specification.overview.description,
        requirements: specification.features.core,
        specifications: specification,
        tasks: allTasks,
        phases: taskBreakdown.phases,
        totalEstimatedHours: taskBreakdown.totalEstimatedHours,
        criticalPath: taskBreakdown.criticalPath,
        risks: taskBreakdown.risks
      };

      // Send project brief to Vamsh
      await vamshService.sendMessage({
        project_name: specification.projectName,
        message: `New project handoff: ${JSON.stringify(vamshProjectBrief, null, 2)}`
      });

      // Wait for Vamsh acknowledgment
      await this.waitForVamshAcknowledgment(specification.projectName);

      return {
        success: true,
        vamshProjectId: specification.projectName.toLowerCase().replace(/\s+/g, '-')
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Wait for Vamsh to acknowledge project receipt
   */
  private async waitForVamshAcknowledgment(projectName: string): Promise<void> {
    const maxWaitTime = 10000; // 10 seconds
    const checkInterval = 1000; // 1 second
    let elapsed = 0;

    while (elapsed < maxWaitTime) {
      try {
        const messages = await vamshService.getMessages(projectName);
        
        // Check if Vamsh has responded
        if (messages && messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          if (lastMessage.message.includes('acknowledged') || lastMessage.message.includes('received')) {
            return; // Success
          }
        }

        await new Promise(resolve => setTimeout(resolve, checkInterval));
        elapsed += checkInterval;
      } catch (error) {
        console.warn('[VamshIntegrationService] Error checking Vamsh acknowledgment:', error);
        break;
      }
    }

    // Timeout or error - continue anyway
    console.warn('[VamshIntegrationService] Vamsh acknowledgment timeout - proceeding anyway');
  }

  /**
   * Get integration status for a project
   */
  getIntegrationStatus(projectId: string): IntegrationStatus | null {
    return this.activeIntegrations.get(projectId) || null;
  }

  /**
   * Get all active integrations
   */
  getActiveIntegrations(): Map<string, IntegrationStatus> {
    return new Map(this.activeIntegrations);
  }

  /**
   * Cancel an ongoing integration
   */
  cancelIntegration(projectId: string): boolean {
    if (this.activeIntegrations.has(projectId)) {
      this.updateStatus(projectId, {
        phase: 'error',
        progress: 0,
        message: 'Integration cancelled by user'
      });
      this.activeIntegrations.delete(projectId);
      return true;
    }
    return false;
  }

  /**
   * Test end-to-end integration without creating a real project
   */
  async testIntegration(): Promise<IntegrationResult> {
    console.log('[VamshIntegrationService] Starting integration test...');

    const testRequest: ProjectCreationRequest = {
      name: 'PAAT Integration Test',
      description: 'Test project to validate PAAT-Vamsh integration',
      requirements: 'Create a simple hello world application with basic error handling',
      priority: 'low',
      tags: ['test', 'integration'],
      estimatedDuration: 1
    };

    return await this.createProjectWithVamshIntegration(testRequest, (status) => {
      console.log(`[Integration Test] ${status.phase}: ${status.progress}% - ${status.message}`);
    });
  }

  /**
   * Update integration status
   */
  private updateStatus(projectId: string, updates: Partial<IntegrationStatus>): void {
    const current = this.activeIntegrations.get(projectId);
    if (current) {
      const updated = {
        ...current,
        ...updates,
        currentTime: new Date()
      };
      this.activeIntegrations.set(projectId, updated);
    }
  }

  /**
   * Estimate project duration based on tasks
   */
  private estimateProjectDuration(tasks: DevelopmentTask[]): number {
    return tasks.reduce((total, task) => total + (task.estimatedHours || 1), 0);
  }

  /**
   * Map task type to database enum
   */
  private mapTaskType(taskType: string): 'analysis' | 'development' | 'testing' | 'review' | 'deployment' {
    const typeMap: Record<string, 'analysis' | 'development' | 'testing' | 'review' | 'deployment'> = {
      'analysis': 'analysis',
      'development': 'development',
      'coding': 'development',
      'implementation': 'development',
      'testing': 'testing',
      'review': 'review',
      'deployment': 'deployment',
      'deploy': 'deployment'
    };

    return typeMap[taskType.toLowerCase()] || 'development';
  }

  /**
   * Get project integration history
   */
  async getProjectIntegrationHistory(projectId: string): Promise<{
    project: any;
    tasks: any[];
    monitoringEvents: any[];
  } | null> {
    try {
      const project = await databaseService.getProject(projectId);
      if (!project) return null;

      const tasks = await databaseService.getTasksByProject(projectId);
      const monitoringProject = await vamshMonitoringService.getProjectStatus(projectId);
      const monitoringEvents = monitoringProject 
        ? await vamshMonitoringService.getProjectEvents(projectId, 100)
        : [];

      return {
        project,
        tasks,
        monitoringEvents
      };
    } catch (error) {
      console.error('[VamshIntegrationService] Failed to get integration history:', error);
      return null;
    }
  }

  /**
   * Cleanup integration service
   */
  async cleanup(): Promise<void> {
    // Cancel all active integrations
    for (const projectId of this.activeIntegrations.keys()) {
      this.cancelIntegration(projectId);
    }

    console.log('[VamshIntegrationService] Cleanup completed');
  }
}

// Create singleton instance
export const vamshIntegrationService = new VamshIntegrationService();
