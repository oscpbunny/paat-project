import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { EventEmitter } from 'events';

export interface VamshServerInfo {
  name: string;
  version: string;
  status: string;
  api_endpoints: {
    data: string;
    health: string;
    messages: string;
    settings: string;
    status: string;
  };
  documentation: string;
  health_check: string;
}

export interface VamshHealthCheck {
  status: string;
  cpu_usage: number;
  memory_usage: number;
  timestamp: string;
  uptime: string;
}

export interface VamshSettings {
  API_ENDPOINTS: Record<string, unknown>;
  API_KEYS: Record<string, unknown>;
  LOGGING: Record<string, unknown>;
  STORAGE: Record<string, unknown>;
  TIMEOUT: Record<string, unknown>;
}

export interface VamshMessage {
  id?: string;
  type: 'project_request' | 'task_request' | 'query';
  content: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

export interface VamshProject {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  tasks: VamshTask[];
  created_at: string;
  updated_at: string;
}

export interface VamshTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  estimated_duration?: number;
}

export interface VamshConnectionOptions {
  baseURL?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export class VamshService extends EventEmitter {
  private client: AxiosInstance;
  private baseURL: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error' = 'disconnected';
  private healthCheckInterval?: NodeJS.Timeout;
  private websocket?: WebSocket;

  constructor(options: VamshConnectionOptions = {}) {
    super();
    
    this.baseURL = options.baseURL || 'http://localhost:1337';
    this.timeout = options.timeout || 30000;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        this.emit('request', { url: config.url, method: config.method });
        return config;
      },
      (error) => {
        this.emit('error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        this.emit('response', { url: response.config.url, status: response.status });
        return response;
      },
      (error) => {
        this.emit('error', error);
        return Promise.reject(error);
      }
    );
  }

  // Connection management
  async connect(): Promise<boolean> {
    try {
      this.connectionStatus = 'connecting';
      this.emit('connection_status', 'connecting');

      const info = await this.getServerInfo();
      
      if (info.status === 'running') {
        this.connectionStatus = 'connected';
        this.emit('connection_status', 'connected');
        this.emit('connected', info);
        
        // Start health check monitoring
        this.startHealthCheckMonitoring();
        
        // Initialize WebSocket connection
        this.initializeWebSocket();
        
        return true;
      } else {
        this.connectionStatus = 'error';
        this.emit('connection_status', 'error');
        return false;
      }
    } catch (error) {
      this.connectionStatus = 'error';
      this.emit('connection_status', 'error');
      this.emit('connection_error', error);
      return false;
    }
  }

  disconnect(): void {
    this.connectionStatus = 'disconnected';
    this.emit('connection_status', 'disconnected');
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    if (this.websocket) {
      this.websocket.close();
      this.websocket = undefined;
    }
  }

  getConnectionStatus(): string {
    return this.connectionStatus;
  }

  // Server Information
  async getServerInfo(): Promise<VamshServerInfo> {
    const response: AxiosResponse<VamshServerInfo> = await this.client.get('/');
    return response.data;
  }

  // Health Monitoring
  async getHealthCheck(): Promise<VamshHealthCheck> {
    const response: AxiosResponse<VamshHealthCheck> = await this.client.get('/api/health');
    return response.data;
  }

  async getStatus(): Promise<{ status: string }> {
    const response: AxiosResponse<{ status: string }> = await this.client.get('/api/status');
    return response.data;
  }

  private startHealthCheckMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.getHealthCheck();
        this.emit('health_update', health);
        
        // Check for concerning metrics
        if (health.cpu_usage > 80 || health.memory_usage > 90) {
          this.emit('high_resource_usage', health);
        }
        
        if (health.status !== 'healthy') {
          this.emit('unhealthy_status', health);
        }
      } catch (error) {
        this.emit('health_check_failed', error);
      }
    }, 30000); // Check every 30 seconds
  }

  // Settings Management
  async getSettings(): Promise<VamshSettings> {
    const response: AxiosResponse<{ settings: VamshSettings }> = await this.client.get('/api/settings');
    return response.data.settings;
  }

  async updateSettings(settings: Partial<VamshSettings>): Promise<VamshSettings> {
    const response: AxiosResponse<{ settings: VamshSettings }> = await this.client.put('/api/settings', { settings });
    return response.data.settings;
  }

  // Message Communication
  async sendMessage(message: VamshMessage): Promise<any> {
    const response: AxiosResponse<any> = await this.client.post('/api/messages', message);
    return response.data;
  }

  // Project Management
  async createProject(projectData: Partial<VamshProject>): Promise<VamshProject> {
    try {
      const response: AxiosResponse<VamshProject> = await this.client.post('/api/data/projects', projectData);
      this.emit('project_created', response.data);
      return response.data;
    } catch (error) {
      this.emit('project_creation_failed', error);
      throw error;
    }
  }

  async getProject(projectId: string): Promise<VamshProject> {
    const response: AxiosResponse<VamshProject> = await this.client.get(`/api/data/projects/${projectId}`);
    return response.data;
  }

  async getProjects(): Promise<VamshProject[]> {
    const response: AxiosResponse<VamshProject[]> = await this.client.get('/api/data/projects');
    return response.data;
  }

  async updateProject(projectId: string, updates: Partial<VamshProject>): Promise<VamshProject> {
    const response: AxiosResponse<VamshProject> = await this.client.put(`/api/data/projects/${projectId}`, updates);
    this.emit('project_updated', response.data);
    return response.data;
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.client.delete(`/api/data/projects/${projectId}`);
    this.emit('project_deleted', projectId);
  }

  // Task Management
  async createTask(projectId: string, taskData: Partial<VamshTask>): Promise<VamshTask> {
    const response: AxiosResponse<VamshTask> = await this.client.post(`/api/data/projects/${projectId}/tasks`, taskData);
    this.emit('task_created', response.data);
    return response.data;
  }

  async updateTask(projectId: string, taskId: string, updates: Partial<VamshTask>): Promise<VamshTask> {
    const response: AxiosResponse<VamshTask> = await this.client.put(`/api/data/projects/${projectId}/tasks/${taskId}`, updates);
    this.emit('task_updated', response.data);
    return response.data;
  }

  // Agent Execution
  async startAgent(projectId: string, instructions?: string): Promise<any> {
    const response: AxiosResponse<any> = await this.client.post(`/api/agent/start`, { 
      project_id: projectId,
      instructions 
    });
    this.emit('agent_started', { projectId, response: response.data });
    return response.data;
  }

  async stopAgent(projectId: string): Promise<any> {
    const response: AxiosResponse<any> = await this.client.post(`/api/agent/stop`, { project_id: projectId });
    this.emit('agent_stopped', projectId);
    return response.data;
  }

  async getAgentStatus(projectId: string): Promise<any> {
    const response: AxiosResponse<any> = await this.client.get(`/api/agent/status/${projectId}`);
    return response.data;
  }

  // WebSocket Connection for Real-time Updates
  private initializeWebSocket(): void {
    try {
      const wsUrl = this.baseURL.replace('http', 'ws') + '/socket.io/?transport=websocket';
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        this.emit('websocket_connected');
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('websocket_message', data);
          
          // Handle specific message types
          if (data.type) {
            this.emit(`websocket_${data.type}`, data);
          }
        } catch (error) {
          this.emit('websocket_parse_error', error);
        }
      };

      this.websocket.onclose = () => {
        this.emit('websocket_disconnected');
        // Attempt to reconnect after delay
        setTimeout(() => {
          if (this.connectionStatus === 'connected') {
            this.initializeWebSocket();
          }
        }, 5000);
      };

      this.websocket.onerror = (error) => {
        this.emit('websocket_error', error);
      };
    } catch (error) {
      this.emit('websocket_init_error', error);
    }
  }

  // Utility Methods
  async testConnection(): Promise<boolean> {
    try {
      const health = await this.getHealthCheck();
      return health.status === 'healthy';
    } catch (error) {
      return false;
    }
  }

  async waitForConnection(timeoutMs: number = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.connectionStatus === 'connected') {
        resolve(true);
        return;
      }

      const timeout = setTimeout(() => {
        this.off('connected', onConnected);
        this.off('connection_error', onError);
        resolve(false);
      }, timeoutMs);

      const onConnected = () => {
        clearTimeout(timeout);
        this.off('connection_error', onError);
        resolve(true);
      };

      const onError = () => {
        clearTimeout(timeout);
        this.off('connected', onConnected);
        resolve(false);
      };

      this.once('connected', onConnected);
      this.once('connection_error', onError);
    });
  }

  // Retry mechanism with exponential backoff
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    attempts: number = this.retryAttempts,
    delay: number = this.retryDelay
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (attempts <= 1) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retryWithBackoff(operation, attempts - 1, delay * 2);
    }
  }

  // Clean up resources
  destroy(): void {
    this.disconnect();
    this.removeAllListeners();
  }
}

export default VamshService;
