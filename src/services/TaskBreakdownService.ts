/**
 * TaskBreakdownService - Intelligent task breakdown using local AI models
 * 
 * This service takes project specifications and breaks them down into
 * specific, actionable development tasks that can be executed by Vamsh AI.
 */

import { ollamaService } from './ollama';
import { VamshProjectSpec } from './ProjectSpecificationService';

export interface TaskBreakdownRequest {
  projectName: string;
  specification: VamshProjectSpec;
  phase?: string;
  complexity: 'simple' | 'medium' | 'complex';
  timeline?: string;
}

export interface DevelopmentTask {
  id: string;
  name: string;
  description: string;
  type: 'setup' | 'development' | 'testing' | 'documentation' | 'deployment';
  priority: 'high' | 'medium' | 'low';
  estimatedHours: number;
  dependencies: string[];
  deliverables: string[];
  acceptanceCriteria: string[];
  techStack: string[];
  vamshInstructions: string[];
  files: string[];
  tests: string[];
}

export interface TaskBreakdownResponse {
  projectId: string;
  totalEstimatedHours: number;
  phases: Array<{
    name: string;
    description: string;
    estimatedHours: number;
    tasks: DevelopmentTask[];
    milestones: string[];
  }>;
  criticalPath: string[];
  recommendations: string[];
  risks: Array<{
    description: string;
    impact: 'high' | 'medium' | 'low';
    mitigation: string;
  }>;
}

export class TaskBreakdownService {
  private readonly SYSTEM_PROMPT = `You are a senior technical project manager and software architect specializing in breaking down complex projects into specific, actionable development tasks.

Your expertise includes:
- Creating detailed task breakdowns with realistic time estimates
- Identifying task dependencies and critical paths
- Designing optimal development workflows
- Risk assessment and mitigation planning
- Technical requirement analysis
- Resource allocation and planning

You must generate JSON responses that match the TaskBreakdownResponse interface exactly.`;

  /**
   * Generate detailed task breakdown from project specification
   */
  async generateTaskBreakdown(request: TaskBreakdownRequest): Promise<TaskBreakdownResponse> {
    try {
      const prompt = this.buildTaskBreakdownPrompt(request);
      
      // Use Qwen2.5:7b for complex task analysis
      const response = await ollamaService.generate({
        model: 'qwen2.5:7b',
        prompt,
        system: this.SYSTEM_PROMPT,
        format: 'json',
        options: {
          temperature: 0.2, // Lower temperature for more consistent task breakdowns
        },
      });

      const breakdown = this.parseAndValidateBreakdown(response.response, request);
      
      console.log(`[TaskBreakdownService] Generated breakdown for: ${request.projectName}`);
      return breakdown;

    } catch (error) {
      console.error('[TaskBreakdownService] Task breakdown generation failed:', error);
      throw new Error(`Failed to generate task breakdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate task breakdown directly from project specification
   */
  async breakdownProjectTasks(specification: VamshProjectSpec): Promise<TaskBreakdownResponse> {
    const request: TaskBreakdownRequest = {
      projectName: specification.projectName,
      specification,
      complexity: specification.overview.complexity as 'simple' | 'medium' | 'complex',
      timeline: specification.development.phases[0]?.estimatedTime
    };

    return this.generateTaskBreakdown(request);
  }

  /**
   * Generate phase-specific task breakdown
   */
  async generatePhaseBreakdown(
    request: TaskBreakdownRequest,
    phaseName: string
  ): Promise<DevelopmentTask[]> {
    try {
      const prompt = this.buildPhasePrompt(request, phaseName);
      
      const response = await ollamaService.generate({
        model: 'qwen2.5:7b',
        prompt,
        format: 'json',
        options: {
          temperature: 0.2,
        },
      });

      const tasksData = JSON.parse(response.response);
      return this.validateTasks(Array.isArray(tasksData.tasks) ? tasksData.tasks : []);

    } catch (error) {
      console.warn('[TaskBreakdownService] Phase breakdown failed, using fallback');
      return this.generateFallbackPhaseTasks(phaseName, request.specification);
    }
  }

  /**
   * Analyze task complexity and provide estimates
   */
  async analyzeTaskComplexity(taskDescription: string, techStack: string[]): Promise<{
    complexity: 'simple' | 'medium' | 'complex';
    estimatedHours: number;
    risks: string[];
    recommendations: string[];
  }> {
    try {
      const prompt = `Analyze this development task and provide complexity assessment:

Task: ${taskDescription}
Technology Stack: ${techStack.join(', ')}

Provide JSON response with:
- complexity: "simple", "medium", or "complex"
- estimatedHours: number (realistic estimate)
- risks: array of potential risks
- recommendations: array of implementation suggestions`;

      const response = await ollamaService.generate({
        model: 'gemma2:2b', // Use faster model for quick analysis
        prompt,
        format: 'json',
        options: {
          temperature: 0.1,
        },
      });

      const analysis = JSON.parse(response.response);
      return {
        complexity: analysis.complexity || 'medium',
        estimatedHours: analysis.estimatedHours || 4,
        risks: Array.isArray(analysis.risks) ? analysis.risks : [],
        recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
      };

    } catch (error) {
      console.warn('[TaskBreakdownService] Task complexity analysis failed');
      return {
        complexity: 'medium',
        estimatedHours: 4,
        risks: ['Complexity assessment needed'],
        recommendations: ['Break down into smaller subtasks if needed'],
      };
    }
  }

  /**
   * Build detailed task breakdown prompt
   */
  private buildTaskBreakdownPrompt(request: TaskBreakdownRequest): string {
    const spec = request.specification;
    
    return `Analyze this project specification and generate a detailed task breakdown:

PROJECT: ${request.projectName}
COMPLEXITY: ${request.complexity}
TIMELINE: ${request.timeline || 'Not specified'}

SPECIFICATION OVERVIEW:
- Description: ${spec.overview.description}
- Objectives: ${spec.overview.objectives.join(', ')}
- Complexity: ${spec.overview.complexity}

TECHNICAL DETAILS:
- Architecture: ${spec.technical.architecture}
- Tech Stack: ${spec.technical.techStack.join(', ')}
- Frameworks: ${spec.technical.frameworks.join(', ')}

CORE FEATURES:
${spec.features.core.map((feature, idx) => `${idx + 1}. ${feature}`).join('\n')}

DEVELOPMENT PHASES:
${spec.development.phases.map((phase, idx) => 
  `${idx + 1}. ${phase.name}: ${phase.description} (${phase.estimatedTime})`
).join('\n')}

REQUIREMENTS:
- Break down each development phase into specific, actionable tasks
- Provide realistic time estimates in hours
- Identify task dependencies and sequencing
- Include setup, development, testing, and documentation tasks
- Create detailed Vamsh instructions for each task
- Specify required files and test coverage
- Identify risks and mitigation strategies

Generate a comprehensive TaskBreakdownResponse JSON object that includes:

1. **Phases**: Each with detailed tasks, estimates, and milestones
2. **Tasks**: Specific, actionable items with:
   - Clear descriptions and deliverables
   - Realistic hour estimates
   - Dependencies and sequencing
   - Acceptance criteria
   - Vamsh-specific instructions
   - Required files and tests
3. **Critical Path**: Sequence of critical tasks
4. **Risk Analysis**: Potential issues and mitigations

Focus on creating tasks that are:
- Specific and measurable
- Achievable in 1-8 hour blocks
- Properly sequenced with clear dependencies
- Include proper testing and documentation
- Have clear success criteria

Generate the complete task breakdown now:`;
  }

  /**
   * Build phase-specific prompt
   */
  private buildPhasePrompt(request: TaskBreakdownRequest, phaseName: string): string {
    const phase = request.specification.development.phases.find(p => p.name === phaseName);
    
    return `Generate detailed tasks for the "${phaseName}" phase:

PHASE DETAILS:
- Name: ${phase?.name || phaseName}
- Description: ${phase?.description || 'Phase development tasks'}
- Deliverables: ${phase?.deliverables.join(', ') || 'Not specified'}
- Estimated Time: ${phase?.estimatedTime || 'Not specified'}

PROJECT CONTEXT:
- Tech Stack: ${request.specification.technical.techStack.join(', ')}
- Architecture: ${request.specification.technical.architecture}
- Core Features: ${request.specification.features.core.join(', ')}

Generate JSON with "tasks" array containing specific development tasks for this phase.
Each task should have: id, name, description, type, priority, estimatedHours, dependencies, deliverables, acceptanceCriteria, vamshInstructions, files, tests.`;
  }

  /**
   * Parse and validate task breakdown response
   */
  private parseAndValidateBreakdown(response: string, request: TaskBreakdownRequest): TaskBreakdownResponse {
    try {
      const parsed = JSON.parse(response);
      
      // Validate and build proper breakdown structure
      return {
        projectId: request.projectName.toLowerCase().replace(/\s+/g, '-'),
        totalEstimatedHours: parsed.totalEstimatedHours || this.calculateTotalHours(parsed.phases || []),
        phases: this.validatePhases(parsed.phases || []),
        criticalPath: Array.isArray(parsed.criticalPath) ? parsed.criticalPath : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [
          'Start with setup and configuration tasks',
          'Implement core features before optional ones',
          'Test incrementally throughout development',
          'Document as you go',
        ],
        risks: this.validateRisks(parsed.risks || []),
      };

    } catch (parseError) {
      console.warn('[TaskBreakdownService] JSON parsing failed, generating fallback breakdown');
      return this.generateFallbackBreakdown(request);
    }
  }

  /**
   * Validate and normalize phases
   */
  private validatePhases(phases: any[]): TaskBreakdownResponse['phases'] {
    if (!Array.isArray(phases)) return [];
    
    return phases.map((phase, idx) => ({
      name: phase.name || `Phase ${idx + 1}`,
      description: phase.description || 'Development phase',
      estimatedHours: phase.estimatedHours || 8,
      tasks: this.validateTasks(phase.tasks || []),
      milestones: Array.isArray(phase.milestones) ? phase.milestones : [`${phase.name || 'Phase'} complete`],
    }));
  }

  /**
   * Validate and normalize tasks
   */
  private validateTasks(tasks: any[]): DevelopmentTask[] {
    if (!Array.isArray(tasks)) return [];
    
    return tasks.map((task, idx) => ({
      id: task.id || `task-${idx + 1}`,
      name: task.name || `Task ${idx + 1}`,
      description: task.description || 'Development task',
      type: this.validateTaskType(task.type),
      priority: this.validatePriority(task.priority),
      estimatedHours: typeof task.estimatedHours === 'number' ? task.estimatedHours : 4,
      dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
      deliverables: Array.isArray(task.deliverables) ? task.deliverables : [task.name || 'Task completion'],
      acceptanceCriteria: Array.isArray(task.acceptanceCriteria) ? task.acceptanceCriteria : ['Task functions as specified'],
      techStack: Array.isArray(task.techStack) ? task.techStack : [],
      vamshInstructions: Array.isArray(task.vamshInstructions) ? task.vamshInstructions : [
        `Implement ${task.name || 'this task'} according to specifications`,
      ],
      files: Array.isArray(task.files) ? task.files : [],
      tests: Array.isArray(task.tests) ? task.tests : [],
    }));
  }

  /**
   * Validate task type
   */
  private validateTaskType(type: any): DevelopmentTask['type'] {
    const validTypes = ['setup', 'development', 'testing', 'documentation', 'deployment'];
    return validTypes.includes(type) ? type : 'development';
  }

  /**
   * Validate priority
   */
  private validatePriority(priority: any): DevelopmentTask['priority'] {
    const validPriorities = ['high', 'medium', 'low'];
    return validPriorities.includes(priority) ? priority : 'medium';
  }

  /**
   * Validate risks array
   */
  private validateRisks(risks: any[]): TaskBreakdownResponse['risks'] {
    if (!Array.isArray(risks)) return [];
    
    return risks.map(risk => ({
      description: risk.description || 'Potential project risk',
      impact: ['high', 'medium', 'low'].includes(risk.impact) ? risk.impact : 'medium',
      mitigation: risk.mitigation || 'Monitor and address as needed',
    }));
  }

  /**
   * Calculate total hours from phases
   */
  private calculateTotalHours(phases: any[]): number {
    if (!Array.isArray(phases)) return 0;
    
    return phases.reduce((total, phase) => {
      if (Array.isArray(phase.tasks)) {
        return total + phase.tasks.reduce((phaseTotal: number, task: any) => {
          return phaseTotal + (typeof task.estimatedHours === 'number' ? task.estimatedHours : 4);
        }, 0);
      }
      return total + (typeof phase.estimatedHours === 'number' ? phase.estimatedHours : 8);
    }, 0);
  }

  /**
   * Generate fallback breakdown when AI fails
   */
  private generateFallbackBreakdown(request: TaskBreakdownRequest): TaskBreakdownResponse {
    const spec = request.specification;
    
    const setupPhase = {
      name: 'Setup & Configuration',
      description: 'Initial project setup and environment configuration',
      estimatedHours: 8,
      tasks: [
        {
          id: 'setup-1',
          name: 'Project Initialization',
          description: 'Initialize project structure and basic configuration',
          type: 'setup' as const,
          priority: 'high' as const,
          estimatedHours: 2,
          dependencies: [],
          deliverables: ['Project directory structure', 'Basic configuration files'],
          acceptanceCriteria: ['Project can be built successfully', 'All directories are properly structured'],
          techStack: spec.technical.techStack,
          vamshInstructions: ['Create project directory', 'Initialize version control', 'Set up basic configuration'],
          files: ['package.json', 'README.md', '.gitignore'],
          tests: [],
        },
        {
          id: 'setup-2',
          name: 'Dependency Installation',
          description: 'Install and configure required dependencies',
          type: 'setup' as const,
          priority: 'high' as const,
          estimatedHours: 2,
          dependencies: ['setup-1'],
          deliverables: ['Installed dependencies', 'Working development environment'],
          acceptanceCriteria: ['All dependencies install without errors', 'Development server starts successfully'],
          techStack: spec.technical.techStack,
          vamshInstructions: ['Install project dependencies', 'Configure development environment', 'Verify setup'],
          files: ['package-lock.json', 'node_modules'],
          tests: [],
        },
      ],
      milestones: ['Development environment ready'],
    };

    const developmentPhase = {
      name: 'Core Development',
      description: 'Implementation of main features and functionality',
      estimatedHours: spec.features.core.length * 4,
      tasks: spec.features.core.map((feature, idx) => ({
        id: `dev-${idx + 1}`,
        name: `Implement ${feature}`,
        description: `Develop the ${feature} functionality`,
        type: 'development' as const,
        priority: idx < 3 ? 'high' as const : 'medium' as const,
        estimatedHours: 4,
        dependencies: idx === 0 ? ['setup-2'] : [`dev-${idx}`],
        deliverables: [`Working ${feature}`, 'Unit tests for feature'],
        acceptanceCriteria: [`${feature} works as specified`, 'Tests pass'],
        techStack: spec.technical.techStack,
        vamshInstructions: [
          `Implement ${feature} according to specifications`,
          'Write comprehensive tests',
          'Document the implementation',
        ],
        files: [],
        tests: [`${feature.toLowerCase().replace(/\s+/g, '-')}.test.js`],
      })),
      milestones: ['Core features implemented'],
    };

    return {
      projectId: request.projectName.toLowerCase().replace(/\s+/g, '-'),
      totalEstimatedHours: setupPhase.estimatedHours + developmentPhase.estimatedHours,
      phases: [setupPhase, developmentPhase],
      criticalPath: ['setup-1', 'setup-2', 'dev-1'],
      recommendations: [
        'Follow the task sequence to avoid dependency issues',
        'Test each feature thoroughly before moving to the next',
        'Keep documentation up to date throughout development',
        'Review code quality regularly',
      ],
      risks: [
        {
          description: 'Dependencies may have version conflicts',
          impact: 'medium',
          mitigation: 'Use exact version specifications and test thoroughly',
        },
        {
          description: 'Feature complexity may be underestimated',
          impact: 'high',
          mitigation: 'Break down complex features into smaller tasks',
        },
      ],
    };
  }

  /**
   * Generate fallback tasks for a specific phase
   */
  private generateFallbackPhaseTasks(phaseName: string, spec: VamshProjectSpec): DevelopmentTask[] {
    const baseTask = {
      type: 'development' as const,
      priority: 'medium' as const,
      estimatedHours: 4,
      dependencies: [],
      techStack: spec.technical.techStack,
      files: [],
      tests: [],
    };

    switch (phaseName.toLowerCase()) {
      case 'setup':
      case 'planning':
        return [
          {
            ...baseTask,
            id: 'setup-init',
            name: 'Initialize Project',
            description: 'Set up project structure and configuration',
            type: 'setup',
            priority: 'high',
            deliverables: ['Project structure', 'Configuration files'],
            acceptanceCriteria: ['Project builds successfully'],
            vamshInstructions: ['Create project directory', 'Initialize configuration'],
          },
        ];

      case 'development':
      case 'implementation':
        return spec.features.core.slice(0, 3).map((feature, idx) => ({
          ...baseTask,
          id: `impl-${idx + 1}`,
          name: `Implement ${feature}`,
          description: `Develop ${feature} functionality`,
          deliverables: [`Working ${feature}`],
          acceptanceCriteria: [`${feature} functions correctly`],
          vamshInstructions: [`Implement ${feature} according to requirements`],
        }));

      default:
        return [
          {
            ...baseTask,
            id: 'generic-task',
            name: `${phaseName} Task`,
            description: `Complete ${phaseName} requirements`,
            deliverables: [`${phaseName} completion`],
            acceptanceCriteria: [`${phaseName} meets requirements`],
            vamshInstructions: [`Complete ${phaseName} according to specifications`],
          },
        ];
    }
  }
}

export const taskBreakdownService = new TaskBreakdownService();
export default taskBreakdownService;
