/**
 * PAAT - AI Personal Assistant Agent Tool
 * Ollama API Client Service
 * 
 * This service handles communication with local Ollama models:
 * - Qwen2.5:7b (4.7GB) - Primary reasoning and project analysis
 * - Llama3.1:8b (4.9GB) - Alternative for complex planning tasks  
 * - Gemma2:2b (1.6GB) - Text processing and content generation
 * - Gemma3:1b (815MB) - Fast responses for UI interactions
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Ollama API interfaces
export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  template?: string;
  context?: number[];
  stream?: boolean;
  raw?: boolean;
  format?: string;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    repeat_penalty?: number;
    seed?: number;
    num_predict?: number;
    stop?: string[];
  };
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
  stream?: boolean;
  format?: string;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    repeat_penalty?: number;
    seed?: number;
    num_predict?: number;
    stop?: string[];
  };
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: OllamaChatMessage;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface ProjectAnalysisRequest {
  projectName: string;
  description: string;
  requirements: string;
  existingFiles?: string[];
  complexity?: 'low' | 'medium' | 'high';
}

export interface ProjectAnalysisResponse {
  estimatedDuration: number; // in minutes
  taskBreakdown: Array<{
    name: string;
    description: string;
    type: 'analysis' | 'development' | 'testing' | 'review' | 'deployment';
    estimatedDuration: number;
    dependencies: string[];
  }>;
  complexity: 'low' | 'medium' | 'high';
  technologies: string[];
  risks: string[];
  recommendations: string[];
}

// Model selection strategies
export enum ModelSize {
  ULTRA_FAST = 'gemma3:1b',      // 815MB - Real-time updates
  FAST = 'gemma2:2b',            // 1.6GB - Content generation  
  BALANCED = 'qwen2.5:7b',       // 4.7GB - Primary reasoning
  POWERFUL = 'llama3.1:8b'       // 4.9GB - Complex planning
}

export enum TaskComplexity {
  SIMPLE = 'simple',         // Use ultra-fast models
  MEDIUM = 'medium',         // Use balanced models
  COMPLEX = 'complex'        // Use powerful models
}

class OllamaService {
  private client: AxiosInstance;
  private baseURL = 'http://localhost:11434';
  private isConnected = false;
  private availableModels: OllamaModel[] = [];
  private modelLoadTimes: Map<string, number> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 60000, // 60 second timeout for AI responses
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Ollama API Error:', error.message);
        if (error.code === 'ECONNREFUSED') {
          this.isConnected = false;
          console.error('Ollama server is not running at', this.baseURL);
        }
        throw error;
      }
    );
  }

  /**
   * Initialize connection and check available models
   */
  public async initialize(): Promise<void> {
    try {
      await this.checkHealth();
      await this.loadAvailableModels();
      this.isConnected = true;
      console.log('Ollama service initialized successfully');
      console.log('Available models:', this.availableModels.map(m => m.name));
    } catch (error) {
      console.error('Failed to initialize Ollama service:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Check if Ollama server is healthy
   */
  public async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/tags');
      this.isConnected = true;
      return true;
    } catch (error) {
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Load all available models from Ollama
   */
  public async loadAvailableModels(): Promise<OllamaModel[]> {
    try {
      const response: AxiosResponse<{ models: OllamaModel[] }> = await this.client.get('/api/tags');
      this.availableModels = response.data.models || [];
      return this.availableModels;
    } catch (error) {
      console.error('Error loading available models:', error);
      this.availableModels = [];
      return [];
    }
  }

  /**
   * Check if a specific model is available
   */
  public isModelAvailable(modelName: string): boolean {
    return this.availableModels.some(model => model.name === modelName);
  }

  /**
   * Select the best model based on task complexity and requirements
   */
  public selectOptimalModel(complexity: TaskComplexity, responseTimeMs?: number): string {
    const preferredModels = {
      [TaskComplexity.SIMPLE]: [ModelSize.ULTRA_FAST, ModelSize.FAST, ModelSize.BALANCED],
      [TaskComplexity.MEDIUM]: [ModelSize.BALANCED, ModelSize.FAST, ModelSize.POWERFUL],
      [TaskComplexity.COMPLEX]: [ModelSize.POWERFUL, ModelSize.BALANCED]
    };

    // If we need ultra-fast response (< 2 seconds), prefer smaller models
    if (responseTimeMs && responseTimeMs < 2000) {
      return this.findAvailableModel([ModelSize.ULTRA_FAST, ModelSize.FAST]);
    }

    return this.findAvailableModel(preferredModels[complexity]);
  }

  /**
   * Find the first available model from a list of preferences
   */
  private findAvailableModel(preferences: string[]): string {
    for (const model of preferences) {
      if (this.isModelAvailable(model)) {
        return model;
      }
    }
    
    // Fallback to any available model
    if (this.availableModels.length > 0) {
      return this.availableModels[0].name;
    }
    
    throw new Error('No Ollama models available');
  }

  /**
   * Generate text completion using Ollama
   */
  public async generate(request: OllamaGenerateRequest): Promise<OllamaGenerateResponse> {
    if (!this.isConnected) {
      throw new Error('Ollama service is not connected');
    }

    const startTime = Date.now();
    
    try {
      const response: AxiosResponse<OllamaGenerateResponse> = await this.client.post(
        '/api/generate',
        { ...request, stream: false } // Disable streaming for simplicity
      );

      const duration = Date.now() - startTime;
      this.recordModelPerformance(request.model, duration);

      return response.data;
    } catch (error) {
      console.error(`Error generating with model ${request.model}:`, error);
      throw error;
    }
  }

  /**
   * Chat completion using Ollama
   */
  public async chat(request: OllamaChatRequest): Promise<OllamaChatResponse> {
    if (!this.isConnected) {
      throw new Error('Ollama service is not connected');
    }

    const startTime = Date.now();

    try {
      const response: AxiosResponse<OllamaChatResponse> = await this.client.post(
        '/api/chat',
        { ...request, stream: false }
      );

      const duration = Date.now() - startTime;
      this.recordModelPerformance(request.model, duration);

      return response.data;
    } catch (error) {
      console.error(`Error chatting with model ${request.model}:`, error);
      throw error;
    }
  }

  /**
   * Analyze project requirements using AI
   */
  public async analyzeProject(request: ProjectAnalysisRequest): Promise<ProjectAnalysisResponse> {
    const model = this.selectOptimalModel(TaskComplexity.COMPLEX);
    
    const systemPrompt = `You are an expert project manager and software architect. Analyze the given project requirements and provide a structured breakdown.

    Your response must be a valid JSON object with the following structure:
    {
      "estimatedDuration": number (total minutes),
      "taskBreakdown": [
        {
          "name": "Task name",
          "description": "Detailed description",
          "type": "analysis|development|testing|review|deployment",
          "estimatedDuration": number (minutes),
          "dependencies": ["list", "of", "task", "names"]
        }
      ],
      "complexity": "low|medium|high",
      "technologies": ["list", "of", "recommended", "technologies"],
      "risks": ["potential", "risks", "identified"],
      "recommendations": ["actionable", "recommendations"]
    }`;

    const userPrompt = `Project Analysis Request:
    
    Name: ${request.projectName}
    Description: ${request.description}
    Requirements: ${request.requirements}
    Existing Files: ${request.existingFiles?.join(', ') || 'None'}
    Expected Complexity: ${request.complexity || 'Unknown'}
    
    Please provide a comprehensive project analysis with task breakdown, time estimates, and recommendations.`;

    try {
      const response = await this.chat({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        options: {
          temperature: 0.1, // Low temperature for consistent, factual responses
          top_p: 0.9
        }
      });

      // Parse the JSON response
      const analysisData = JSON.parse(response.message.content);
      
      // Validate the response structure
      if (!this.validateProjectAnalysis(analysisData)) {
        throw new Error('Invalid project analysis response format');
      }

      return analysisData;
    } catch (error) {
      console.error('Error analyzing project:', error);
      
      // Return a fallback analysis if AI fails
      return this.generateFallbackAnalysis(request);
    }
  }

  /**
   * Generate quick status update or notification text
   */
  public async generateQuickUpdate(
    context: string,
    updateType: 'progress' | 'error' | 'completion' | 'notification'
  ): Promise<string> {
    const model = this.selectOptimalModel(TaskComplexity.SIMPLE, 1000); // Want response in ~1 second

    const prompt = `Generate a concise ${updateType} message for: ${context}
    
    Keep it under 50 words and make it clear and actionable.`;

    try {
      const response = await this.generate({
        model,
        prompt,
        options: {
          temperature: 0.3,
          num_predict: 50 // Limit tokens for faster response
        }
      });

      return response.response.trim();
    } catch (error) {
      console.error('Error generating quick update:', error);
      return `${updateType}: ${context}`;
    }
  }

  /**
   * Simple generate response method for wizard use
   */
  public async generateResponse(
    model: string,
    prompt: string,
    options?: {
      temperature?: number;
      max_tokens?: number;
    }
  ): Promise<string> {
    if (!this.isConnected) {
      throw new Error('Ollama service is not connected');
    }

    try {
      const response = await this.generate({
        model,
        prompt,
        options: {
          temperature: options?.temperature || 0.3,
          num_predict: options?.max_tokens || 1000
        }
      });

      return response.response;
    } catch (error) {
      console.error(`Error generating response with model ${model}:`, error);
      throw error;
    }
  }

  /**
   * Generate project documentation or descriptions
   */
  public async generateContent(
    type: 'readme' | 'documentation' | 'comments' | 'description',
    context: string,
    details?: string
  ): Promise<string> {
    const model = this.selectOptimalModel(TaskComplexity.MEDIUM);

    const prompts = {
      readme: `Generate a professional README.md file for: ${context}\n\nAdditional details: ${details || 'None'}`,
      documentation: `Write clear technical documentation for: ${context}\n\nContext: ${details || 'None'}`,
      comments: `Generate helpful code comments for: ${context}\n\nCode context: ${details || 'None'}`,
      description: `Write a clear project description for: ${context}\n\nAdditional info: ${details || 'None'}`
    };

    try {
      const response = await this.generate({
        model,
        prompt: prompts[type],
        options: {
          temperature: 0.5,
          top_p: 0.9
        }
      });

      return response.response;
    } catch (error) {
      console.error(`Error generating ${type}:`, error);
      return `Generated ${type} for ${context}`;
    }
  }

  /**
   * Validate project analysis response format
   */
  private validateProjectAnalysis(data: any): boolean {
    return (
      data &&
      typeof data.estimatedDuration === 'number' &&
      Array.isArray(data.taskBreakdown) &&
      typeof data.complexity === 'string' &&
      Array.isArray(data.technologies) &&
      Array.isArray(data.risks) &&
      Array.isArray(data.recommendations)
    );
  }

  /**
   * Generate fallback analysis if AI fails
   */
  private generateFallbackAnalysis(request: ProjectAnalysisRequest): ProjectAnalysisResponse {
    const baseEstimate = request.complexity === 'low' ? 120 : 
                        request.complexity === 'high' ? 480 : 240;

    return {
      estimatedDuration: baseEstimate,
      taskBreakdown: [
        {
          name: 'Project Setup',
          description: 'Initial project setup and configuration',
          type: 'analysis',
          estimatedDuration: Math.floor(baseEstimate * 0.1),
          dependencies: []
        },
        {
          name: 'Core Development',
          description: 'Main development work',
          type: 'development',
          estimatedDuration: Math.floor(baseEstimate * 0.7),
          dependencies: ['Project Setup']
        },
        {
          name: 'Testing & Review',
          description: 'Testing and code review',
          type: 'testing',
          estimatedDuration: Math.floor(baseEstimate * 0.2),
          dependencies: ['Core Development']
        }
      ],
      complexity: request.complexity || 'medium',
      technologies: [],
      risks: ['Timeline uncertainty', 'Technical complexity'],
      recommendations: ['Break down into smaller tasks', 'Regular progress reviews']
    };
  }

  /**
   * Record model performance for optimization
   */
  private recordModelPerformance(model: string, duration: number): void {
    const existing = this.modelLoadTimes.get(model);
    const newAvg = existing ? (existing + duration) / 2 : duration;
    this.modelLoadTimes.set(model, newAvg);
  }

  /**
   * Get model performance metrics
   */
  public getModelPerformanceMetrics(): Record<string, number> {
    const metrics: Record<string, number> = {};
    this.modelLoadTimes.forEach((time, model) => {
      metrics[model] = time;
    });
    return metrics;
  }

  /**
   * Check if service is ready
   */
  public isReady(): boolean {
    return this.isConnected && this.availableModels.length > 0;
  }

  /**
   * Get available models
   */
  public getAvailableModels(): OllamaModel[] {
    return [...this.availableModels];
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): {
    connected: boolean;
    modelsAvailable: number;
    baseURL: string;
  } {
    return {
      connected: this.isConnected,
      modelsAvailable: this.availableModels.length,
      baseURL: this.baseURL
    };
  }
}

// Export singleton instance
export const ollamaService = new OllamaService();
