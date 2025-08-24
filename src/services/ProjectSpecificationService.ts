/**
 * ProjectSpecificationService - AI-powered project specification generator
 * 
 * Uses Ollama models to analyze user requirements and generate detailed
 * project specifications in a format that Vamsh AI can understand and execute.
 */

import { ollamaService } from './ollama';

export interface UserRequirements {
  projectName: string;
  description: string;
  requirements: string[];
  targetPlatform?: 'web' | 'desktop' | 'mobile' | 'api' | 'cli';
  techStack?: string[];
  complexity?: 'simple' | 'medium' | 'complex';
  timeline?: string;
  additionalNotes?: string;
}

export interface VamshProjectSpec {
  projectName: string;
  overview: {
    description: string;
    objectives: string[];
    scope: string;
    complexity: string;
  };
  technical: {
    architecture: string;
    techStack: string[];
    frameworks: string[];
    databases?: string[];
    apis?: string[];
  };
  features: {
    core: string[];
    optional: string[];
    prioritized: Array<{
      feature: string;
      priority: 'high' | 'medium' | 'low';
      description: string;
    }>;
  };
  development: {
    phases: Array<{
      name: string;
      description: string;
      deliverables: string[];
      estimatedTime: string;
    }>;
    milestones: string[];
    risks: string[];
  };
  implementation: {
    fileStructure: string[];
    keyComponents: string[];
    dependencies: string[];
    configurationFiles: string[];
  };
  testing: {
    strategy: string;
    types: string[];
    tools: string[];
    coverage: string;
  };
  deployment: {
    environment: string;
    strategy: string;
    requirements: string[];
    steps: string[];
  };
  vamshInstructions: {
    startupMessage: string;
    workingDirectory: string;
    specialInstructions: string[];
    successCriteria: string[];
  };
}

export class ProjectSpecificationService {
  private readonly SYSTEM_PROMPT = `You are a senior software architect and project manager. Your role is to analyze user requirements and generate comprehensive, detailed project specifications that an AI software engineer can understand and implement.

Key responsibilities:
1. Analyze user requirements thoroughly
2. Suggest appropriate technology stacks and architectures
3. Break down complex projects into manageable phases
4. Identify potential risks and challenges
5. Create detailed implementation guides
6. Generate clear, actionable specifications

Focus on:
- Technical accuracy and best practices
- Practical implementation approaches
- Clear project structure and organization
- Realistic timelines and complexity assessment
- Comprehensive feature breakdown
- Testing and deployment strategies

You must respond ONLY with valid JSON that matches the VamshProjectSpec interface format.`;

  /**
   * Generate a comprehensive project specification using AI analysis
   */
  async generateSpecification(requirements: UserRequirements): Promise<VamshProjectSpec> {
    try {
      const prompt = this.buildAnalysisPrompt(requirements);
      
      // Use Qwen2.5:7b for complex analysis and specification generation
      const response = await ollamaService.generate({
        model: 'qwen2.5:7b', // Most capable model for complex analysis
        prompt,
        system: this.SYSTEM_PROMPT,
        format: 'json', // Request JSON format
        options: {
          temperature: 0.3, // Lower temperature for more consistent, structured output
        },
      });

      const specification = this.parseAndValidateSpecification(response.response, requirements);
      
      console.log(`[ProjectSpecService] Generated specification for: ${requirements.projectName}`);
      return specification;

    } catch (error) {
      console.error('[ProjectSpecService] Specification generation failed:', error);
      throw new Error(`Failed to generate project specification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build detailed analysis prompt for the AI model
   */
  private buildAnalysisPrompt(requirements: UserRequirements): string {
    return `Analyze the following project requirements and generate a comprehensive project specification:

PROJECT DETAILS:
- Name: ${requirements.projectName}
- Description: ${requirements.description}
- Target Platform: ${requirements.targetPlatform || 'Not specified'}
- Complexity: ${requirements.complexity || 'Not specified'}
- Timeline: ${requirements.timeline || 'Not specified'}

REQUIREMENTS:
${requirements.requirements.map((req, idx) => `${idx + 1}. ${req}`).join('\n')}

PREFERRED TECH STACK:
${requirements.techStack ? requirements.techStack.join(', ') : 'Not specified - please suggest appropriate technologies'}

ADDITIONAL NOTES:
${requirements.additionalNotes || 'None'}

TASK: Generate a complete VamshProjectSpec JSON object that includes:

1. **Overview**: Clear description, objectives, scope, and complexity assessment
2. **Technical Architecture**: Recommended tech stack, frameworks, architecture pattern
3. **Features**: Core features, optional features, and prioritized feature list
4. **Development Plan**: Phases, milestones, timeline, risks
5. **Implementation**: File structure, key components, dependencies, config files
6. **Testing Strategy**: Testing approach, tools, coverage requirements
7. **Deployment**: Environment setup, deployment strategy, requirements
8. **Vamsh Instructions**: Specific instructions for the AI developer

Requirements for the specification:
- Be specific and actionable
- Include realistic time estimates
- Suggest modern, appropriate technologies
- Consider scalability and maintainability
- Include proper error handling and security considerations
- Provide clear success criteria
- Format all responses as valid JSON matching the VamshProjectSpec interface

Generate the complete specification now:`;
  }

  /**
   * Parse and validate the AI-generated specification
   */
  private parseAndValidateSpecification(response: string, requirements: UserRequirements): VamshProjectSpec {
    try {
      // Try to parse JSON response
      const parsed = JSON.parse(response);
      
      // Validate basic structure
      if (!parsed.projectName || !parsed.overview || !parsed.technical) {
        throw new Error('Invalid specification structure');
      }

      // Ensure required fields are present and valid
      const specification: VamshProjectSpec = {
        projectName: parsed.projectName || requirements.projectName,
        overview: {
          description: parsed.overview?.description || requirements.description,
          objectives: Array.isArray(parsed.overview?.objectives) ? parsed.overview.objectives : [requirements.description],
          scope: parsed.overview?.scope || 'To be defined during development',
          complexity: parsed.overview?.complexity || requirements.complexity || 'medium',
        },
        technical: {
          architecture: parsed.technical?.architecture || 'To be determined',
          techStack: Array.isArray(parsed.technical?.techStack) ? parsed.technical.techStack : requirements.techStack || [],
          frameworks: Array.isArray(parsed.technical?.frameworks) ? parsed.technical.frameworks : [],
          databases: Array.isArray(parsed.technical?.databases) ? parsed.technical.databases : undefined,
          apis: Array.isArray(parsed.technical?.apis) ? parsed.technical.apis : undefined,
        },
        features: {
          core: Array.isArray(parsed.features?.core) ? parsed.features.core : requirements.requirements,
          optional: Array.isArray(parsed.features?.optional) ? parsed.features.optional : [],
          prioritized: Array.isArray(parsed.features?.prioritized) ? parsed.features.prioritized : 
            requirements.requirements.map((req, idx) => ({
              feature: req,
              priority: idx < 3 ? 'high' as const : 'medium' as const,
              description: req,
            })),
        },
        development: {
          phases: Array.isArray(parsed.development?.phases) ? parsed.development.phases : [
            {
              name: 'Planning & Setup',
              description: 'Initial project setup and planning',
              deliverables: ['Project structure', 'Dependencies setup', 'Initial configuration'],
              estimatedTime: '1-2 days',
            },
            {
              name: 'Core Development',
              description: 'Implementation of core features',
              deliverables: requirements.requirements,
              estimatedTime: requirements.complexity === 'simple' ? '3-5 days' : requirements.complexity === 'complex' ? '2-3 weeks' : '1-2 weeks',
            },
            {
              name: 'Testing & Refinement',
              description: 'Testing and bug fixes',
              deliverables: ['Unit tests', 'Integration tests', 'Bug fixes'],
              estimatedTime: '2-3 days',
            },
          ],
          milestones: Array.isArray(parsed.development?.milestones) ? parsed.development.milestones : [
            'Project setup complete',
            'Core features implemented',
            'Testing completed',
            'Deployment ready',
          ],
          risks: Array.isArray(parsed.development?.risks) ? parsed.development.risks : [
            'Technical complexity underestimated',
            'Dependencies compatibility issues',
            'Performance requirements not met',
          ],
        },
        implementation: {
          fileStructure: Array.isArray(parsed.implementation?.fileStructure) ? parsed.implementation.fileStructure : [],
          keyComponents: Array.isArray(parsed.implementation?.keyComponents) ? parsed.implementation.keyComponents : [],
          dependencies: Array.isArray(parsed.implementation?.dependencies) ? parsed.implementation.dependencies : [],
          configurationFiles: Array.isArray(parsed.implementation?.configurationFiles) ? parsed.implementation.configurationFiles : [],
        },
        testing: {
          strategy: parsed.testing?.strategy || 'Unit and integration testing',
          types: Array.isArray(parsed.testing?.types) ? parsed.testing.types : ['unit', 'integration'],
          tools: Array.isArray(parsed.testing?.tools) ? parsed.testing.tools : [],
          coverage: parsed.testing?.coverage || '80%+',
        },
        deployment: {
          environment: parsed.deployment?.environment || 'local development',
          strategy: parsed.deployment?.strategy || 'manual deployment',
          requirements: Array.isArray(parsed.deployment?.requirements) ? parsed.deployment.requirements : [],
          steps: Array.isArray(parsed.deployment?.steps) ? parsed.deployment.steps : [],
        },
        vamshInstructions: {
          startupMessage: parsed.vamshInstructions?.startupMessage || this.generateDefaultStartupMessage(requirements),
          workingDirectory: parsed.vamshInstructions?.workingDirectory || `./projects/${requirements.projectName.toLowerCase().replace(/\s+/g, '-')}`,
          specialInstructions: Array.isArray(parsed.vamshInstructions?.specialInstructions) ? 
            parsed.vamshInstructions.specialInstructions : [
            'Follow best practices for the chosen technology stack',
            'Include proper error handling and logging',
            'Write clean, maintainable code with comments',
            'Implement proper testing',
            'Create documentation for setup and usage',
          ],
          successCriteria: Array.isArray(parsed.vamshInstructions?.successCriteria) ? 
            parsed.vamshInstructions.successCriteria : [
            'All core features implemented and working',
            'Code follows best practices and is well-documented',
            'Tests pass and coverage meets requirements',
            'Application runs without errors',
            'Deployment documentation is complete',
          ],
        },
      };

      return specification;

    } catch (parseError) {
      console.warn('[ProjectSpecService] JSON parsing failed, using fallback specification');
      return this.generateFallbackSpecification(requirements);
    }
  }

  /**
   * Generate a fallback specification when AI parsing fails
   */
  private generateFallbackSpecification(requirements: UserRequirements): VamshProjectSpec {
    return {
      projectName: requirements.projectName,
      overview: {
        description: requirements.description,
        objectives: [requirements.description, ...requirements.requirements.slice(0, 3)],
        scope: 'Full implementation of specified requirements',
        complexity: requirements.complexity || 'medium',
      },
      technical: {
        architecture: requirements.targetPlatform === 'web' ? 'Client-server web application' :
                     requirements.targetPlatform === 'desktop' ? 'Desktop application' :
                     requirements.targetPlatform === 'mobile' ? 'Mobile application' :
                     requirements.targetPlatform === 'api' ? 'REST API service' :
                     requirements.targetPlatform === 'cli' ? 'Command line interface' :
                     'Standard application architecture',
        techStack: requirements.techStack || this.suggestDefaultTechStack(requirements.targetPlatform),
        frameworks: [],
        databases: undefined,
        apis: undefined,
      },
      features: {
        core: requirements.requirements,
        optional: [],
        prioritized: requirements.requirements.map((req, idx) => ({
          feature: req,
          priority: idx < 3 ? 'high' as const : 'medium' as const,
          description: req,
        })),
      },
      development: {
        phases: [
          {
            name: 'Setup & Planning',
            description: 'Initial project setup and configuration',
            deliverables: ['Project structure', 'Dependencies', 'Basic configuration'],
            estimatedTime: '1-2 days',
          },
          {
            name: 'Core Implementation',
            description: 'Implementation of main features',
            deliverables: requirements.requirements,
            estimatedTime: this.estimateComplexityTime(requirements.complexity),
          },
          {
            name: 'Testing & Polish',
            description: 'Testing, debugging, and final touches',
            deliverables: ['Tests', 'Documentation', 'Bug fixes'],
            estimatedTime: '2-3 days',
          },
        ],
        milestones: [
          'Project initialized',
          'Core features complete',
          'Testing finished',
          'Ready for deployment',
        ],
        risks: [
          'Complexity may be higher than estimated',
          'External dependencies might cause issues',
          'Performance optimization may be needed',
        ],
      },
      implementation: {
        fileStructure: [],
        keyComponents: [],
        dependencies: [],
        configurationFiles: [],
      },
      testing: {
        strategy: 'Comprehensive testing approach',
        types: ['unit', 'integration'],
        tools: [],
        coverage: '80%+',
      },
      deployment: {
        environment: 'Development environment',
        strategy: 'Manual deployment',
        requirements: [],
        steps: [],
      },
      vamshInstructions: {
        startupMessage: this.generateDefaultStartupMessage(requirements),
        workingDirectory: `./projects/${requirements.projectName.toLowerCase().replace(/\s+/g, '-')}`,
        specialInstructions: [
          'Follow best practices for code quality',
          'Include comprehensive error handling',
          'Write maintainable, well-documented code',
          'Implement appropriate testing',
          'Provide clear setup instructions',
        ],
        successCriteria: [
          'All requirements implemented successfully',
          'Code is clean and well-documented',
          'Application works without errors',
          'Tests pass and coverage is adequate',
          'Documentation is complete and clear',
        ],
      },
    };
  }

  /**
   * Suggest default tech stack based on platform
   */
  private suggestDefaultTechStack(platform?: string): string[] {
    switch (platform) {
      case 'web':
        return ['JavaScript', 'React', 'Node.js', 'Express', 'CSS'];
      case 'desktop':
        return ['JavaScript', 'Electron', 'React', 'Node.js'];
      case 'mobile':
        return ['React Native', 'JavaScript', 'Node.js'];
      case 'api':
        return ['Node.js', 'Express', 'JavaScript', 'MongoDB'];
      case 'cli':
        return ['Node.js', 'JavaScript', 'Commander.js'];
      default:
        return ['JavaScript', 'Node.js'];
    }
  }

  /**
   * Estimate time based on complexity
   */
  private estimateComplexityTime(complexity?: string): string {
    switch (complexity) {
      case 'simple':
        return '3-5 days';
      case 'complex':
        return '2-3 weeks';
      default:
        return '1-2 weeks';
    }
  }

  /**
   * Generate default startup message for Vamsh
   */
  private generateDefaultStartupMessage(requirements: UserRequirements): string {
    return `Create a ${requirements.targetPlatform || 'software'} project called "${requirements.projectName}".

Description: ${requirements.description}

Key Requirements:
${requirements.requirements.map((req, idx) => `${idx + 1}. ${req}`).join('\n')}

${requirements.techStack ? `Preferred Technologies: ${requirements.techStack.join(', ')}` : ''}

${requirements.additionalNotes ? `Additional Notes: ${requirements.additionalNotes}` : ''}

Please implement this project step by step, following best practices and keeping me updated on your progress. Focus on code quality, proper testing, and comprehensive documentation.`;
  }

  /**
   * Generate a quick project analysis using faster model
   */
  async analyzeProjectComplexity(requirements: UserRequirements): Promise<{
    complexity: 'simple' | 'medium' | 'complex';
    estimatedTime: string;
    keyTechnologies: string[];
    risks: string[];
  }> {
    try {
      const prompt = `Analyze this project and provide a quick assessment:

Project: ${requirements.projectName}
Description: ${requirements.description}
Requirements: ${requirements.requirements.join(', ')}
Platform: ${requirements.targetPlatform || 'unspecified'}

Provide analysis as JSON with: complexity (simple/medium/complex), estimatedTime, keyTechnologies (array), risks (array).`;

      // Use lighter model for quick analysis
      const response = await ollamaService.generate({
        model: 'gemma2:2b', // Fast model for quick analysis
        prompt,
        format: 'json',
        options: {
          temperature: 0.2,
        },
      });

      const analysis = JSON.parse(response.response);
      return {
        complexity: analysis.complexity || 'medium',
        estimatedTime: analysis.estimatedTime || '1-2 weeks',
        keyTechnologies: Array.isArray(analysis.keyTechnologies) ? analysis.keyTechnologies : [],
        risks: Array.isArray(analysis.risks) ? analysis.risks : [],
      };

    } catch (error) {
      console.warn('[ProjectSpecService] Quick analysis failed:', error);
      return {
        complexity: 'medium',
        estimatedTime: '1-2 weeks',
        keyTechnologies: this.suggestDefaultTechStack(requirements.targetPlatform),
        risks: ['Complexity assessment needed', 'Requirements clarification may be required'],
      };
    }
  }
}

export const projectSpecificationService = new ProjectSpecificationService();
export default projectSpecificationService;
