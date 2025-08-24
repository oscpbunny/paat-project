import { TaskBreakdownService } from '../TaskBreakdownService';
import { VamshProjectSpec } from '../ProjectSpecificationService';

// Mock ollama service
jest.mock('../ollama', () => ({
  ollamaService: {
    generate: jest.fn(),
  },
}));

const mockOllamaService = require('../ollama').ollamaService;

describe('TaskBreakdownService', () => {
  let service: TaskBreakdownService;
  
  const mockProjectSpec: VamshProjectSpec = {
    projectName: 'Test Project',
    overview: {
      description: 'A test project for unit testing',
      objectives: ['Implement core functionality', 'Add comprehensive tests'],
      complexity: 'medium',
      estimatedTimeline: '2-3 weeks'
    },
    technical: {
      architecture: 'Client-server architecture',
      techStack: ['React', 'TypeScript', 'Node.js'],
      frameworks: ['Express', 'Jest'],
      databases: ['SQLite'],
      apis: ['REST API']
    },
    features: {
      core: ['User authentication', 'Data management', 'Real-time updates'],
      optional: ['Analytics dashboard', 'Export functionality'],
      future: ['Mobile app', 'Advanced reporting']
    },
    development: {
      phases: [
        {
          name: 'Setup',
          description: 'Initial project setup and configuration',
          deliverables: ['Project structure', 'Basic configuration'],
          estimatedTime: '3-5 days',
          dependencies: []
        },
        {
          name: 'Core Development',
          description: 'Implementation of main features',
          deliverables: ['Core features', 'Unit tests'],
          estimatedTime: '1-2 weeks',
          dependencies: ['Setup']
        }
      ],
      timeline: '2-3 weeks total',
      milestones: ['Setup complete', 'Core features ready', 'Testing complete']
    }
  };

  beforeEach(() => {
    service = new TaskBreakdownService();
    jest.clearAllMocks();
  });

  describe('generateTaskBreakdown', () => {
    it('should generate task breakdown successfully', async () => {
      const mockResponse = {
        response: JSON.stringify({
          projectId: 'test-project',
          totalEstimatedHours: 80,
          phases: [
            {
              name: 'Setup',
              description: 'Initial setup phase',
              estimatedHours: 16,
              tasks: [
                {
                  id: 'setup-1',
                  name: 'Initialize Project',
                  description: 'Set up project structure',
                  type: 'setup',
                  priority: 'high',
                  estimatedHours: 8,
                  dependencies: [],
                  deliverables: ['Project structure'],
                  acceptanceCriteria: ['Project builds successfully'],
                  techStack: ['React', 'TypeScript'],
                  vamshInstructions: ['Create project structure'],
                  files: ['package.json'],
                  tests: []
                }
              ],
              milestones: ['Setup complete']
            }
          ],
          criticalPath: ['setup-1'],
          recommendations: ['Follow setup sequence'],
          risks: [
            {
              description: 'Setup complexity',
              impact: 'medium',
              mitigation: 'Use templates'
            }
          ]
        })
      };

      mockOllamaService.generate.mockResolvedValue(mockResponse);

      const request = {
        projectName: 'Test Project',
        specification: mockProjectSpec,
        complexity: 'medium' as const,
        timeline: '2-3 weeks'
      };

      const result = await service.generateTaskBreakdown(request);

      expect(result.projectId).toBe('test-project');
      expect(result.totalEstimatedHours).toBe(80);
      expect(result.phases).toHaveLength(1);
      expect(result.phases[0].tasks).toHaveLength(1);
      expect(result.criticalPath).toEqual(['setup-1']);
      expect(mockOllamaService.generate).toHaveBeenCalledWith({
        model: 'qwen2.5:7b',
        prompt: expect.stringContaining('Test Project'),
        system: expect.stringContaining('technical project manager'),
        format: 'json',
        options: {
          temperature: 0.2,
        },
      });
    });

    it('should handle AI response parsing failure', async () => {
      const mockResponse = {
        response: 'invalid json response'
      };

      mockOllamaService.generate.mockResolvedValue(mockResponse);

      const request = {
        projectName: 'Test Project',
        specification: mockProjectSpec,
        complexity: 'medium' as const
      };

      const result = await service.generateTaskBreakdown(request);

      // Should return fallback breakdown
      expect(result.projectId).toBe('test-project');
      expect(result.phases).toHaveLength(2); // Setup + Development phases
      expect(result.recommendations).toContain('Follow the task sequence to avoid dependency issues');
    });

    it('should handle AI service failure', async () => {
      mockOllamaService.generate.mockRejectedValue(new Error('AI service unavailable'));

      const request = {
        projectName: 'Test Project',
        specification: mockProjectSpec,
        complexity: 'medium' as const
      };

      await expect(service.generateTaskBreakdown(request))
        .rejects.toThrow('Failed to generate task breakdown: AI service unavailable');
    });
  });

  describe('breakdownProjectTasks', () => {
    it('should create proper request and call generateTaskBreakdown', async () => {
      const mockResponse = {
        response: JSON.stringify({
          projectId: 'test-project',
          totalEstimatedHours: 40,
          phases: [],
          criticalPath: [],
          recommendations: [],
          risks: []
        })
      };

      mockOllamaService.generate.mockResolvedValue(mockResponse);

      const result = await service.breakdownProjectTasks(mockProjectSpec);

      expect(result.projectId).toBe('test-project');
      expect(mockOllamaService.generate).toHaveBeenCalledWith({
        model: 'qwen2.5:7b',
        prompt: expect.stringContaining('Test Project'),
        system: expect.any(String),
        format: 'json',
        options: {
          temperature: 0.2,
        },
      });
    });
  });

  describe('generatePhaseBreakdown', () => {
    it('should generate phase-specific tasks', async () => {
      const mockResponse = {
        response: JSON.stringify({
          tasks: [
            {
              id: 'phase-task-1',
              name: 'Phase Specific Task',
              description: 'Task for specific phase',
              type: 'development',
              priority: 'medium',
              estimatedHours: 4,
              dependencies: [],
              deliverables: ['Feature implementation'],
              acceptanceCriteria: ['Feature works correctly'],
              vamshInstructions: ['Implement feature'],
              files: [],
              tests: []
            }
          ]
        })
      };

      mockOllamaService.generate.mockResolvedValue(mockResponse);

      const request = {
        projectName: 'Test Project',
        specification: mockProjectSpec,
        complexity: 'medium' as const
      };

      const result = await service.generatePhaseBreakdown(request, 'Core Development');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Phase Specific Task');
      expect(result[0].type).toBe('development');
    });

    it('should handle phase breakdown failure with fallback', async () => {
      mockOllamaService.generate.mockRejectedValue(new Error('Phase breakdown failed'));

      const request = {
        projectName: 'Test Project',
        specification: mockProjectSpec,
        complexity: 'medium' as const
      };

      const result = await service.generatePhaseBreakdown(request, 'development');

      // Should return fallback tasks
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].name).toContain('Implement');
    });
  });

  describe('analyzeTaskComplexity', () => {
    it('should analyze task complexity successfully', async () => {
      const mockResponse = {
        response: JSON.stringify({
          complexity: 'complex',
          estimatedHours: 8,
          risks: ['High technical complexity'],
          recommendations: ['Break into smaller tasks']
        })
      };

      mockOllamaService.generate.mockResolvedValue(mockResponse);

      const result = await service.analyzeTaskComplexity(
        'Implement complex authentication system',
        ['React', 'Node.js', 'JWT']
      );

      expect(result.complexity).toBe('complex');
      expect(result.estimatedHours).toBe(8);
      expect(result.risks).toContain('High technical complexity');
      expect(result.recommendations).toContain('Break into smaller tasks');
    });

    it('should provide fallback on analysis failure', async () => {
      mockOllamaService.generate.mockRejectedValue(new Error('Analysis failed'));

      const result = await service.analyzeTaskComplexity(
        'Simple task',
        ['HTML', 'CSS']
      );

      expect(result.complexity).toBe('medium');
      expect(result.estimatedHours).toBe(4);
      expect(result.risks).toContain('Complexity assessment needed');
    });
  });

  describe('Validation Methods', () => {
    describe('validatePhases', () => {
      it('should validate and normalize phases correctly', () => {
        const service = new TaskBreakdownService();
        const invalidPhases = [
          { name: 'Valid Phase', tasks: [] },
          { description: 'Missing name', tasks: [] },
          {} // Empty phase
        ];

        const result = service['validatePhases'](invalidPhases);

        expect(result).toHaveLength(3);
        expect(result[0].name).toBe('Valid Phase');
        expect(result[1].name).toBe('Phase 2');
        expect(result[2].name).toBe('Phase 3');
        expect(result[0].estimatedHours).toBe(8); // Default value
      });
    });

    describe('validateTasks', () => {
      it('should validate and normalize tasks correctly', () => {
        const service = new TaskBreakdownService();
        const invalidTasks = [
          { name: 'Valid Task', type: 'development' },
          { description: 'Missing name' },
          {} // Empty task
        ];

        const result = service['validateTasks'](invalidTasks);

        expect(result).toHaveLength(3);
        expect(result[0].name).toBe('Valid Task');
        expect(result[1].name).toBe('Task 2');
        expect(result[2].name).toBe('Task 3');
        expect(result[0].type).toBe('development');
        expect(result[1].type).toBe('development'); // Default
      });
    });

    describe('validateTaskType', () => {
      it('should validate task types correctly', () => {
        const service = new TaskBreakdownService();

        expect(service['validateTaskType']('setup')).toBe('setup');
        expect(service['validateTaskType']('development')).toBe('development');
        expect(service['validateTaskType']('testing')).toBe('testing');
        expect(service['validateTaskType']('invalid')).toBe('development'); // Default
      });
    });

    describe('validatePriority', () => {
      it('should validate priorities correctly', () => {
        const service = new TaskBreakdownService();

        expect(service['validatePriority']('high')).toBe('high');
        expect(service['validatePriority']('medium')).toBe('medium');
        expect(service['validatePriority']('low')).toBe('low');
        expect(service['validatePriority']('invalid')).toBe('medium'); // Default
      });
    });
  });

  describe('Fallback Generation', () => {
    it('should generate appropriate fallback breakdown', () => {
      const service = new TaskBreakdownService();
      const request = {
        projectName: 'Fallback Test',
        specification: mockProjectSpec,
        complexity: 'medium' as const
      };

      const result = service['generateFallbackBreakdown'](request);

      expect(result.projectId).toBe('fallback-test');
      expect(result.phases).toHaveLength(2); // Setup + Development
      expect(result.phases[0].name).toBe('Setup & Configuration');
      expect(result.phases[1].name).toBe('Core Development');
      expect(result.recommendations).toContain('Follow the task sequence to avoid dependency issues');
    });

    it('should generate fallback phase tasks for different phases', () => {
      const service = new TaskBreakdownService();

      const setupTasks = service['generateFallbackPhaseTasks']('setup', mockProjectSpec);
      expect(setupTasks[0].type).toBe('setup');
      expect(setupTasks[0].priority).toBe('high');

      const devTasks = service['generateFallbackPhaseTasks']('development', mockProjectSpec);
      expect(devTasks.length).toBe(3); // Based on core features
      expect(devTasks[0].name).toContain('User authentication');

      const genericTasks = service['generateFallbackPhaseTasks']('unknown', mockProjectSpec);
      expect(genericTasks[0].name).toBe('unknown Task');
    });
  });
});
