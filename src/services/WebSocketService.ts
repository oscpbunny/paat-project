import { EventEmitter } from 'events';

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  id?: string;
}

export interface ProjectUpdate {
  projectId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  currentTask?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ServiceStatus {
  service: 'ollama' | 'vamsh' | 'database';
  status: 'connected' | 'disconnected' | 'error';
  lastSeen: number;
  error?: string;
}

export class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private url: string;
  private isConnecting = false;

  constructor(url: string = 'ws://localhost:3001/ws') {
    super();
    this.url = url;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('[WebSocket] Connected to server');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] Connection closed');
        this.isConnecting = false;
        this.stopHeartbeat();
        this.emit('disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Connection error:', error);
        this.isConnecting = false;
        this.emit('error', error);
      };

    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Send message to server
   */
  send(type: string, payload: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Cannot send message - not connected');
      return;
    }

    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now(),
      id: this.generateMessageId()
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Subscribe to project updates
   */
  subscribeToProject(projectId: string): void {
    this.send('subscribe', { projectId });
  }

  /**
   * Unsubscribe from project updates
   */
  unsubscribeFromProject(projectId: string): void {
    this.send('unsubscribe', { projectId });
  }

  /**
   * Request service status update
   */
  requestServiceStatus(): void {
    this.send('get_service_status', {});
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (this.isConnecting) return 'connecting';
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return 'connected';
    return 'disconnected';
  }

  private handleMessage(message: WebSocketMessage): void {
    console.log('[WebSocket] Received message:', message.type);

    switch (message.type) {
      case 'project_update':
        this.emit('projectUpdate', message.payload as ProjectUpdate);
        break;
      
      case 'service_status':
        this.emit('serviceStatus', message.payload as ServiceStatus);
        break;
      
      case 'activity_log':
        this.emit('activityLog', message.payload);
        break;
      
      case 'heartbeat':
        this.send('heartbeat_ack', {});
        break;
      
      case 'error':
        console.error('[WebSocket] Server error:', message.payload);
        this.emit('serverError', message.payload);
        break;
      
      default:
        console.warn('[WebSocket] Unknown message type:', message.type);
        this.emit('message', message);
        break;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(`[WebSocket] Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) {
        this.connect();
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.send('heartbeat', {});
    }, 30000); // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
