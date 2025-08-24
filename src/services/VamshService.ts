/**
 * VamshService - HTTP client for communicating with Vamsh AI Software Engineer
 * 
 * Based on API research conducted on August 24, 2025:
 * - Base URL: http://localhost:1337
 * - WebSocket: ws://localhost:1337
 * - Available endpoints: health, status, settings, messages, data, etc.
 * - Supports both HTTP REST API and WebSocket communication
 */

interface VamshHealthResponse {
  cpu_usage: number;
  memory_usage: number;
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: string;
}

interface VamshStatusResponse {
  status: string;
}

interface VamshSettings {
  API_ENDPOINTS: {
    BING: string;
    GOOGLE: string;
    LM_STUDIO: string;
    OLLAMA: string;
    OPENAI: string;
  };
  API_KEYS: Record<string, string>;
  LOGGING: {
    LOG_PROMPTS: string;
    LOG_REST_API: string;
  };
  STORAGE: {
    LOGS_DIR: string;
    PDFS_DIR: string;
    PROJECTS_DIR: string;
    REPOS_DIR: string;
    SCREENSHOTS_DIR: string;
    SQLITE_DB: string;
  };
  TIMEOUT: {
    INFERENCE: number;
  };
}

interface VamshApiResponse {
  api_endpoints: {
    data: string;
    health: string;
    messages: string;
    settings: string;
    status: string;
  };
  documentation: string;
  health_check: string;
  name: string;
  status: string;
  version: string;
}

interface VamshMessageRequest {
  project_name: string;
  message: string;
  user_id?: string;
}

export interface VamshMessage {
  id: string;
  timestamp: string;
  message: string;
  from: 'user' | 'assistant';
  project_name: string;
}

export interface VamshAgentState {
  active: boolean;
  project: string;
  current_step: string;
  completion_percentage: number;
  start_time?: string;
  end_time?: string;
}

export class VamshService {
  private baseUrl = 'http://localhost:1337';
  private timeout = 30000; // 30 second timeout
  private maxRetries = 3;

  /**
   * Make HTTP request with error handling, retries, and timeout
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const requestOptions: RequestInit = {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    };

    let lastError: Error = new Error('Unknown error');

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[VamshService] ${options.method || 'GET'} ${url} (attempt ${attempt})`);
        
        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`[VamshService] Success: ${endpoint}`);
        return data;

      } catch (error) {
        lastError = error as Error;
        console.warn(`[VamshService] Attempt ${attempt} failed:`, error);
        
        if (attempt === this.maxRetries) {
          break;
        }

        // Exponential backoff: wait 1s, 2s, 4s between retries
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    clearTimeout(timeoutId);
    throw new Error(`Vamsh API request failed after ${this.maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Check if Vamsh server is reachable and healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      const health = await this.getHealth();
      return health.status === 'healthy';
    } catch (error) {
      console.error('[VamshService] Health check failed:', error);
      return false;
    }
  }

  /**
   * Get API information and available endpoints
   */
  async getApiInfo(): Promise<VamshApiResponse> {
    return this.makeRequest<VamshApiResponse>('/');
  }

  /**
   * Get detailed health status with system metrics
   */
  async getHealth(): Promise<VamshHealthResponse> {
    return this.makeRequest<VamshHealthResponse>('/api/health');
  }

  /**
   * Get simple server status
   */
  async getStatus(): Promise<VamshStatusResponse> {
    return this.makeRequest<VamshStatusResponse>('/api/status');
  }

  /**
   * Get current Vamsh configuration settings
   */
  async getSettings(): Promise<{ settings: VamshSettings }> {
    return this.makeRequest<{ settings: VamshSettings }>('/api/settings');
  }

  /**
   * Update Vamsh settings
   */
  async updateSettings(settings: Partial<VamshSettings>): Promise<void> {
    await this.makeRequest('/api/settings', {
      method: 'POST',
      body: JSON.stringify({ settings }),
    });
  }

  /**
   * Send a message to Vamsh AI for project development
   */
  async sendMessage(request: VamshMessageRequest): Promise<void> {
    await this.makeRequest('/api/messages', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get messages for a specific project
   */
  async getMessages(projectName: string): Promise<VamshMessage[]> {
    const response = await this.makeRequest<{ messages: VamshMessage[] }>('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ project_name: projectName, action: 'get' }),
    });
    return response.messages || [];
  }

  /**
   * Check if Vamsh agent is currently active for a project
   */
  async isAgentActive(projectName: string): Promise<boolean> {
    const response = await this.makeRequest<{ active: boolean }>('/api/is-agent-active', {
      method: 'POST',
      body: JSON.stringify({ project_name: projectName }),
    });
    return response.active;
  }

  /**
   * Get current agent state and progress
   */
  async getAgentState(projectName: string): Promise<VamshAgentState> {
    return this.makeRequest<VamshAgentState>('/api/get-agent-state', {
      method: 'POST',
      body: JSON.stringify({ project_name: projectName }),
    });
  }

  /**
   * Execute code in project context
   */
  async runCode(projectName: string, code: string, language: string): Promise<any> {
    return this.makeRequest('/api/run-code', {
      method: 'POST',
      body: JSON.stringify({
        project_name: projectName,
        code,
        language,
      }),
    });
  }

  /**
   * Calculate token count for text
   */
  async calculateTokens(text: string): Promise<{ token_count: number }> {
    return this.makeRequest<{ token_count: number }>('/api/calculate-tokens', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  /**
   * Get token usage for a project
   */
  async getTokenUsage(projectName: string): Promise<any> {
    return this.makeRequest(`/api/token-usage?project=${encodeURIComponent(projectName)}`);
  }

  /**
   * Get application logs
   */
  async getLogs(): Promise<string[]> {
    const response = await this.makeRequest<{ logs: string[] }>('/api/logs');
    return response.logs || [];
  }

  /**
   * Get browser session data
   */
  async getBrowserSession(): Promise<any> {
    return this.makeRequest('/api/get-browser-session');
  }

  /**
   * Get terminal session data
   */
  async getTerminalSession(): Promise<any> {
    return this.makeRequest('/api/get-terminal-session');
  }

  /**
   * Start a new development project with Vamsh
   */
  async startProject(projectName: string, description: string, requirements: string[]): Promise<void> {
    const message = `Create a new project called "${projectName}".

Description: ${description}

Requirements:
${requirements.map((req, idx) => `${idx + 1}. ${req}`).join('\n')}

Please start the development process and keep me updated on progress.`;

    await this.sendMessage({
      project_name: projectName,
      message,
    });
  }

  /**
   * Get comprehensive project status including agent state and messages
   */
  async getProjectStatus(projectName: string): Promise<{
    active: boolean;
    state?: VamshAgentState;
    recentMessages: VamshMessage[];
  }> {
    const [active, messages] = await Promise.all([
      this.isAgentActive(projectName),
      this.getMessages(projectName),
    ]);

    let state: VamshAgentState | undefined;
    if (active) {
      try {
        state = await this.getAgentState(projectName);
      } catch (error) {
        console.warn('[VamshService] Could not get agent state:', error);
      }
    }

    // Get the 10 most recent messages
    const recentMessages = messages.slice(-10);

    return {
      active,
      state,
      recentMessages,
    };
  }

  /**
   * Create WebSocket connection for real-time communication
   */
  createWebSocketConnection(): WebSocket {
    const ws = new WebSocket('ws://localhost:1337');
    
    ws.onopen = () => {
      console.log('[VamshService] WebSocket connected');
      // Send initial connection event as per API docs
      ws.send(JSON.stringify({ type: 'socket_connect' }));
    };

    ws.onclose = (event) => {
      console.log('[VamshService] WebSocket closed:', event.code, event.reason);
    };

    ws.onerror = (error) => {
      console.error('[VamshService] WebSocket error:', error);
    };

    return ws;
  }

  /**
   * Test the connection to Vamsh server
   */
  async testConnection(): Promise<{
    connected: boolean;
    health?: VamshHealthResponse;
    info?: VamshApiResponse;
    error?: string;
  }> {
    try {
      const [health, info] = await Promise.all([
        this.getHealth(),
        this.getApiInfo(),
      ]);

      return {
        connected: true,
        health,
        info,
      };
    } catch (error) {
      return {
        connected: false,
        error: (error as Error).message,
      };
    }
  }
}

// Export singleton instance
export const vamshService = new VamshService();
export default vamshService;
