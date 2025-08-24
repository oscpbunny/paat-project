import { VamshIntegrationService } from '../VamshIntegrationService';
import { ProjectCreationRequest } from '../VamshIntegrationService';

// Mock the dependencies
jest.mock('../VamshService', () => ({
  vamshService: {
    sendMessage: jest.fn(),
    isHealthy: jest.fn(),
    getStatus: jest.fn(),
  },
}));

jest.mock('../database', () => ({
  databaseService: {
    createProject: jest.fn(),
    updateProject: jest.fn(),
    createTask: jest.fn(),
    getProject: jest.fn(),
    isReady: jest.fn().mockReturnValue(true),
    initialize: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../ProjectSpecificationService', () => ({
  projectSpecificationService: {
    generateSpecification: jest.fn(),
  },
}));

jest.mock('../TaskBreakdownService', () => ({
  taskBreakdownService: {
    breakdownProjectTasks: jest.fn(),
  },
}));

jest.mock('../VamshMonitoringService', () => ({
  vamshMonitoringService: {
    startProjectMonitoring: jest.fn(),
  },
}));

const mockVamshService = require('../VamshService').vamshService;
const mockDatabaseService = require('../database').databaseService;
const mockProjectSpecificationService = require('../ProjectSpecificationService').projectSpecificationService;
const mockTaskBreakdownService = require('../TaskBreakdownService').taskBreakdownService;
const mockVamshMonitoringService = require('../VamshMonitoringService').vamshMonitoringService;

describe('VamshIntegrationService', () => {
  let service: VamshIntegrationService;

  beforeEach(() => {
    service = new VamshIntegrationService();
    jest.clearAllMocks();
  });

  describe('createProjectWithVamshIntegration', () => {
    it('should create project with full Vamsh integration successfully', async () => {
      const request: ProjectCreationRequest = {
        name: 'Test Project',
        requirements: 'Create a simple web application with React',
        complexity: 'medium',
        priority: 'high',
        tags: ['web', 'react'],
        timeline: '2 weeks'
      };

      // Mock successful responses
      const mockSpec = {
        projectName: 'Test Project',
        overview: {
          description: 'Test project description',
          objectives: ['Build web app'],
          complexity: 'medium',
          estimatedTimeline: '2 weeks'
        },
        technical: {
          architecture: 'Client-server',
          techStack: ['React', 'Node.js'],
          frameworks: ['Express'],
          databases: ['PostgreSQL'],
          apis: ['REST']
        },
        features: {
          core: ['User authentication'],
          optional: ['Admin panel'],
          future: ['Mobile app']
        },
        development: {
          phases: [{
            name: 'Setup',
            description: 'Initial setup',
            deliverables: ['Project structure'],
            estimatedTime: '1 week',
            dependencies: []
          }],
          timeline: '2 weeks',
          milestones: ['Setup complete']
        }
      };

      const mockTaskBreakdown = {
        projectId: 'test-project',
        totalEstimatedHours: 40,
        phases: [{
          name: 'Setup',
          description: 'Setup phase',
          estimatedHours: 16,
          tasks: [{
            id: 'task-1',
            name: 'Initialize Project',
            description: 'Setup project structure',
            type: 'setup',
            priority: 'high',
            estimatedHours: 8,
            dependencies: [],
            deliverables: ['Project structure'],
            acceptanceCriteria: ['Project builds'],
            techStack: ['React'],
            vamshInstructions: ['Create React app'],
            files: ['package.json'],
            tests: []
          }],
          milestones: ['Setup complete']
        }],
        criticalPath: ['task-1'],
        recommendations: ['Follow setup sequence'],
        risks: [{
          description: 'Setup complexity',
          impact: 'medium' as const,
          mitigation: 'Use templates'
        }]
      };

      const mockProject = {
        id: 'project-123',
        name: 'Test Project',
        description: 'Test project description',
        status: 'active',
        vamsh_status: 'pending'
      };

      mockProjectSpecificationService.generateSpecification.mockResolvedValue(mockSpec);
      mockTaskBreakdownService.breakdownProjectTasks.mockResolvedValue(mockTaskBreakdown);
      mockDatabaseService.createProject.mockResolvedValue(mockProject);
      mockDatabaseService.createTask.mockResolvedValue({ id: 'task-1' });
      mockVamshService.sendMessage.mockResolvedValue({ 
        success: true, 
        message: 'Project created successfully',
        projectId: 'vamsh-project-123'
      });
      mockVamshMonitoringService.startProjectMonitoring.mockResolvedValue(undefined);

      const result = await service.createProjectWithVamshIntegration(request);

      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
      expect(result.project?.id).toBe('project-123');
      expect(result.vamshProjectId).toBe('vamsh-project-123');
      expect(result.tasksCreated).toBeGreaterThan(0);

      // Verify service calls
      expect(mockProjectSpecificationService.generateSpecification).toHaveBeenCalledWith(request);
      expect(mockTaskBreakdownService.breakdownProjectTasks).toHaveBeenCalledWith(mockSpec);
      expect(mockDatabaseService.createProject).toHaveBeenCalled();
      expect(mockVamshService.sendMessage).toHaveBeenCalled();
    });

    it('should handle project creation failure gracefully', async () => {
      const request: ProjectCreationRequest = {
        name: 'Failing Project',
        requirements: 'This will fail',
        complexity: 'high'
      };

      mockProjectSpecificationService.generateSpecification.mockRejectedValue(
        new Error('Specification generation failed')
      );

      const result = await service.createProjectWithVamshIntegration(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Specification generation failed');
      expect(result.phase).toBe('specification');
    });

    it('should handle task breakdown failure with fallback', async () => {
      const request: ProjectCreationRequest = {
        name: 'Test Project',
        requirements: 'Test requirements',
        complexity: 'medium'
      };

      const mockSpec = {
        projectName: 'Test Project',
        overview: { description: 'Test', objectives: [], complexity: 'medium', estimatedTimeline: '1 week' },
        technical: { architecture: 'Simple', techStack: [], frameworks: [], databases: [], apis: [] },
        features: { core: [], optional: [], future: [] },
        development: { phases: [], timeline: '1 week', milestones: [] }
      };

      mockProjectSpecificationService.generateSpecification.mockResolvedValue(mockSpec);
      mockTaskBreakdownService.breakdownProjectTasks.mockRejectedValue(
        new Error('Task breakdown failed')
      );
      mockDatabaseService.createProject.mockResolvedValue({ 
        id: 'project-123', 
        name: 'Test Project', 
        status: 'active' 
      });

      const result = await service.createProjectWithVamshIntegration(request);

      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
      expect(result.warnings).toContain('Task breakdown failed - created project without detailed tasks');
    });

    it('should handle Vamsh communication failure', async () => {
      const request: ProjectCreationRequest = {
        name: 'Test Project',
        requirements: 'Test requirements',
        complexity: 'medium'
      };

      const mockSpec = {
        projectName: 'Test Project',
        overview: { description: 'Test', objectives: [], complexity: 'medium', estimatedTimeline: '1 week' },
        technical: { architecture: 'Simple', techStack: [], frameworks: [], databases: [], apis: [] },
        features: { core: [], optional: [], future: [] },
        development: { phases: [], timeline: '1 week', milestones: [] }
      };

      const mockTaskBreakdown = {
        projectId: 'test-project',
        totalEstimatedHours: 8,
        phases: [],
        criticalPath: [],
        recommendations: [],
        risks: []
      };

      mockProjectSpecificationService.generateSpecification.mockResolvedValue(mockSpec);
      mockTaskBreakdownService.breakdownProjectTasks.mockResolvedValue(mockTaskBreakdown);
      mockDatabaseService.createProject.mockResolvedValue({ 
        id: 'project-123', 
        name: 'Test Project', 
        status: 'active' 
      });
      mockVamshService.sendMessage.mockRejectedValue(new Error('Vamsh communication failed'));

      const result = await service.createProjectWithVamshIntegration(request);

      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
      expect(result.warnings).toContain('Vamsh communication failed - project created locally only');
    });
  });

  describe('Progress Callback', () => {
    it('should call progress callback during integration process', async () => {
      const request: ProjectCreationRequest = {
        name: 'Test Project',
        requirements: 'Test requirements',
        complexity: 'low'
      };

      const progressCallback = jest.fn();
      
      const mockSpec = {
        projectName: 'Test Project',
        overview: { description: 'Test', objectives: [], complexity: 'low', estimatedTimeline: '1 week' },
        technical: { architecture: 'Simple', techStack: [], frameworks: [], databases: [], apis: [] },
        features: { core: [], optional: [], future: [] },
        development: { phases: [], timeline: '1 week', milestones: [] }
      };

      mockProjectSpecificationService.generateSpecification.mockResolvedValue(mockSpec);
      mockTaskBreakdownService.breakdownProjectTasks.mockResolvedValue({
        projectId: 'test-project',
        totalEstimatedHours: 8,
        phases: [],
        criticalPath: [],
        recommendations: [],
        risks: []
      });
      mockDatabaseService.createProject.mockResolvedValue({ 
        id: 'project-123', 
        name: 'Test Project', 
        status: 'active' 
      });
      mockVamshService.sendMessage.mockResolvedValue({ success: true });

      await service.createProjectWithVamshIntegration(request, progressCallback);

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'specification',
          progress: expect.any(Number),
          message: expect.any(String)
        })
      );

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'task-breakdown',
          progress: expect.any(Number)
        })
      );

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'database-creation',
          progress: expect.any(Number)
        })
      );
    });
  });

  describe('Error Recovery', () => {
    it('should attempt recovery from transient failures', async () => {
      const request: ProjectCreationRequest = {
        name: 'Recovery Test Project',
        requirements: 'Test error recovery',
        complexity: 'medium'
      };

      const mockSpec = {
        projectName: 'Recovery Test Project',
        overview: { description: 'Recovery test', objectives: [], complexity: 'medium', estimatedTimeline: '1 week' },
        technical: { architecture: 'Simple', techStack: [], frameworks: [], databases: [], apis: [] },
        features: { core: [], optional: [], future: [] },
        development: { phases: [], timeline: '1 week', milestones: [] }
      };

      mockProjectSpecificationService.generateSpecification.mockResolvedValue(mockSpec);
      mockTaskBreakdownService.breakdownProjectTasks.mockResolvedValue({
        projectId: 'test-project',
        totalEstimatedHours: 16,
        phases: [],
        criticalPath: [],
        recommendations: [],
        risks: []
      });

      // Simulate transient database failure then success
      mockDatabaseService.createProject
        .mockRejectedValueOnce(new Error('Database temporarily unavailable'))
        .mockResolvedValue({ id: 'project-123', name: 'Recovery Test Project', status: 'active' });

      const result = await service.createProjectWithVamshIntegration(request);

      expect(result.success).toBe(true);
      expect(result.project).toBeDefined();
      expect(mockDatabaseService.createProject).toHaveBeenCalledTimes(2);
    });
  });

  describe('Service Health Checks', () => {
    it('should validate service health before integration', async () => {
      const request: ProjectCreationRequest = {
        name: 'Health Check Project',
        requirements: 'Test health checks',
        complexity: 'low'
      };

      mockVamshService.isHealthy.mockResolvedValue(false);
      
      const result = await service.createProjectWithVamshIntegration(request);

      expect(result.success).toBe(true); // Should still succeed with warning
      expect(result.warnings).toContain('Vamsh service is not healthy - project will be created locally');
    });
  });
});
