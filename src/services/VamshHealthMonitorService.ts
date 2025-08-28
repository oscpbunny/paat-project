/**
 * PAAT - AI Personal Assistant Agent Tool
 * Vamsh AI Health Monitoring Service
 * 
 * Provides comprehensive health monitoring for Vamsh AI integration
 * with real-time status updates and performance tracking.
 */

import { EventEmitter } from 'events';
import axios, { AxiosError } from 'axios';
import { vamshService } from './VamshService';
import { webSocketService } from './WebSocketService';
import { useRealTimeStore } from '../stores/realTimeStore';

export interface VamshHealthData {
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  version?: string;
  uptime: number;
  lastSeen: Date;
  responseTime: number;
  activeConnections: number;
  memoryUsage?: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage?: number;
  features: {
    webBrowsing: boolean;
    codeGeneration: boolean;
    projectManagement: boolean;
    apiAccess: boolean;
  };
  currentLoad?: {
    activeProjects: number;
    queuedTasks: number;
    runningAgents: number;
  };
  errors: Array<{
    timestamp: Date;
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

export interface VamshPerformanceMetrics {
  averageResponseTime: number;
  successRate: number;
  requestsPerMinute: number;
  errorRate: number;
  lastHourStats: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
  };
}

export class VamshHealthMonitorService extends EventEmitter {
  private healthData: VamshHealthData;
  private performanceMetrics: VamshPerformanceMetrics;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private readonly monitoringIntervalMs = 30000; // 30 seconds
  private readonly timeoutMs = 10000; // 10 seconds
  private readonly maxRetries = 3;

  // Health check endpoints
  private readonly endpoints = {
    health: 'http://localhost:1337/health',
    status: 'http://localhost:1337/api/status',
    metrics: 'http://localhost:1337/api/metrics',
    projects: 'http://localhost:1337/api/projects',
  };

  constructor() {
    super();
    
    // Initialize health data
    this.healthData = {
      status: 'unknown',
      uptime: 0,
      lastSeen: new Date(),
      responseTime: 0,
      activeConnections: 0,
      features: {
        webBrowsing: false,
        codeGeneration: false,
        projectManagement: false,
        apiAccess: false,
      },
      errors: [],
    };

    // Initialize performance metrics
    this.performanceMetrics = {
      averageResponseTime: 0,
      successRate: 0,
      requestsPerMinute: 0,
      errorRate: 0,
      lastHourStats: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
      },
    };

    this.setMaxListeners(50);
  }

  /**
   * Start health monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.performHealthCheck(); // Initial check
    
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.monitoringIntervalMs);

    this.emit('monitoring_started');
    this.addActivity('Health monitoring started', 'info');
  }

  /**
   * Stop health monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.emit('monitoring_stopped');
    this.addActivity('Health monitoring stopped', 'warning');
  }

  /**
   * Get current health status
   */
  public getHealthStatus(): VamshHealthData {
    return { ...this.healthData };
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): VamshPerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Check if Vamsh is healthy
   */
  public isHealthy(): boolean {
    return this.healthData.status === 'healthy';
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Primary health check
      const healthResponse = await this.checkEndpoint(this.endpoints.health);
      const responseTime = Date.now() - startTime;

      if (healthResponse.success) {
        await this.updateHealthData(healthResponse.data, responseTime);
        await this.checkAdditionalEndpoints();
        this.updatePerformanceMetrics(true, responseTime);
        this.emit('health_check_success', this.healthData);
      } else {
        this.handleHealthCheckFailure(healthResponse.error || new Error('Unknown health check failure'), responseTime);
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.handleHealthCheckFailure(error as Error, responseTime);
    }
  }

  /**
   * Check individual endpoint
   */
  private async checkEndpoint(url: string, retries = 0): Promise<{
    success: boolean;
    data?: any;
    error?: Error;
  }> {
    try {
      const response = await axios.get(url, {
        timeout: this.timeoutMs,
        headers: {
          'User-Agent': 'PAAT-Health-Monitor/1.0.0',
        },
      });

      return {
        success: true,
        data: response.data,
      };

    } catch (error) {
      const axiosError = error as AxiosError;
      
      // Retry on network errors
      if (retries < this.maxRetries && this.isNetworkError(axiosError)) {
        await this.delay(1000 * (retries + 1)); // Exponential backoff
        return this.checkEndpoint(url, retries + 1);
      }

      return {
        success: false,
        error: axiosError,
      };
    }
  }

  /**
   * Update health data from response
   */
  private async updateHealthData(data: any, responseTime: number): Promise<void> {
    const previousStatus = this.healthData.status;
    
    this.healthData = {
      status: this.determineHealthStatus(data, responseTime),
      version: data.version || this.healthData.version,
      uptime: data.uptime || 0,
      lastSeen: new Date(),
      responseTime,
      activeConnections: data.connections || 0,
      memoryUsage: data.memory ? {
        used: data.memory.used || 0,
        total: data.memory.total || 0,
        percentage: data.memory.percentage || 0,
      } : this.healthData.memoryUsage,
      cpuUsage: data.cpu || this.healthData.cpuUsage,
      features: {
        webBrowsing: data.features?.webBrowsing !== false,
        codeGeneration: data.features?.codeGeneration !== false,
        projectManagement: data.features?.projectManagement !== false,
        apiAccess: data.features?.apiAccess !== false,
      },
      currentLoad: data.load ? {
        activeProjects: data.load.activeProjects || 0,
        queuedTasks: data.load.queuedTasks || 0,
        runningAgents: data.load.runningAgents || 0,
      } : this.healthData.currentLoad,
      errors: this.healthData.errors, // Preserve existing errors
    };

    // Emit status change if changed
    if (previousStatus !== this.healthData.status) {
      this.emit('status_changed', {
        previous: previousStatus,
        current: this.healthData.status,
        timestamp: new Date(),
      });

      this.addActivity(
        `Vamsh status changed from ${previousStatus} to ${this.healthData.status}`,
        this.healthData.status === 'healthy' ? 'success' : 
        this.healthData.status === 'down' ? 'error' : 'warning'
      );
    }

    // Update real-time store
    this.updateRealTimeStore();
  }

  /**
   * Check additional endpoints for feature availability
   */
  private async checkAdditionalEndpoints(): Promise<void> {
    const checks = [
      { endpoint: this.endpoints.status, feature: 'apiAccess' },
      { endpoint: this.endpoints.metrics, feature: 'projectManagement' },
      { endpoint: this.endpoints.projects, feature: 'projectManagement' },
    ];

    for (const check of checks) {
      try {
        const response = await this.checkEndpoint(check.endpoint);
        // Update feature availability based on response
        if (check.feature === 'apiAccess') {
          this.healthData.features.apiAccess = response.success;
        } else if (check.feature === 'projectManagement') {
          this.healthData.features.projectManagement = response.success;
        }
      } catch (error) {
        // Feature is not available
        console.warn(`Feature ${check.feature} check failed:`, error);
      }
    }
  }

  /**
   * Handle health check failure
   */
  private handleHealthCheckFailure(error: Error, responseTime: number): void {
    const previousStatus = this.healthData.status;
    
    this.healthData.status = 'down';
    this.healthData.responseTime = responseTime;
    this.healthData.lastSeen = new Date();

    // Add error to history
    this.addError(error);
    this.updatePerformanceMetrics(false, responseTime);

    // Emit status change
    if (previousStatus !== 'down') {
      this.emit('status_changed', {
        previous: previousStatus,
        current: 'down',
        timestamp: new Date(),
      });

      this.addActivity(
        `Vamsh health check failed: ${error.message}`,
        'error'
      );
    }

    this.emit('health_check_failure', { error, responseTime });
    this.updateRealTimeStore();
  }

  /**
   * Determine health status from data and metrics
   */
  private determineHealthStatus(data: any, responseTime: number): 'healthy' | 'degraded' | 'down' {
    // Check if explicitly marked as unhealthy
    if (data.status === 'down' || data.healthy === false) {
      return 'down';
    }

    // Check response time
    if (responseTime > 5000) {
      return 'degraded';
    }

    // Check memory usage
    if (this.healthData.memoryUsage?.percentage && this.healthData.memoryUsage.percentage > 90) {
      return 'degraded';
    }

    // Check CPU usage
    if (this.healthData.cpuUsage && this.healthData.cpuUsage > 90) {
      return 'degraded';
    }

    // Check error rate
    if (this.performanceMetrics.errorRate > 0.1) { // 10% error rate
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(success: boolean, responseTime: number): void {
    // Update rolling averages
    const alpha = 0.1; // Exponential moving average factor
    
    this.performanceMetrics.averageResponseTime = 
      this.performanceMetrics.averageResponseTime * (1 - alpha) + responseTime * alpha;

    // Update success rate
    this.performanceMetrics.lastHourStats.totalRequests++;
    if (success) {
      this.performanceMetrics.lastHourStats.successfulRequests++;
    } else {
      this.performanceMetrics.lastHourStats.failedRequests++;
    }

    // Calculate rates
    const total = this.performanceMetrics.lastHourStats.totalRequests;
    const successful = this.performanceMetrics.lastHourStats.successfulRequests;
    
    this.performanceMetrics.successRate = total > 0 ? successful / total : 0;
    this.performanceMetrics.errorRate = total > 0 ? (total - successful) / total : 0;
    this.performanceMetrics.requestsPerMinute = total / 60; // Approximate
  }

  /**
   * Add error to history
   */
  private addError(error: Error): void {
    const errorEntry = {
      timestamp: new Date(),
      type: error.name || 'Error',
      message: error.message,
      severity: this.getErrorSeverity(error),
    };

    this.healthData.errors.unshift(errorEntry);

    // Keep only last 50 errors
    if (this.healthData.errors.length > 50) {
      this.healthData.errors = this.healthData.errors.slice(0, 50);
    }
  }

  /**
   * Determine error severity
   */
  private getErrorSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    const axiosError = error as AxiosError;
    
    if (axiosError.code === 'ECONNREFUSED') {
      return 'critical';
    }
    
    if (axiosError.response?.status === 500) {
      return 'high';
    }
    
    if (axiosError.response?.status === 503) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Check if error is a network error
   */
  private isNetworkError(error: AxiosError): boolean {
    return !error.response && (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT'
    );
  }

  /**
   * Add activity to real-time store
   */
  private addActivity(message: string, severity: 'info' | 'success' | 'warning' | 'error'): void {
    const { addActivityLog } = useRealTimeStore.getState();
    
    addActivityLog({
      type: 'service',
      title: 'Vamsh Health Monitor',
      message,
      severity,
      metadata: {
        service: 'vamsh',
        responseTime: this.healthData.responseTime,
        status: this.healthData.status,
      },
    });
  }

  /**
   * Update real-time store with current status
   */
  private updateRealTimeStore(): void {
    const { updateServiceStatus } = useRealTimeStore.getState();
    
    updateServiceStatus({
      service: 'vamsh',
      status: this.healthData.status === 'down' ? 'error' : 
              this.healthData.status === 'healthy' ? 'connected' : 'disconnected',
      lastSeen: this.healthData.lastSeen.getTime(),
      error: this.healthData.errors[0]?.message,
    });

    // Send update via WebSocket if connected
    if (webSocketService.getConnectionStatus() === 'connected') {
      webSocketService.send('vamsh_health_update', {
        health: this.healthData,
        metrics: this.performanceMetrics,
      });
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get health summary for UI
   */
  public getHealthSummary(): {
    status: string;
    statusColor: 'success' | 'warning' | 'error' | 'info';
    uptime: string;
    responseTime: string;
    features: number;
    recentErrors: number;
  } {
    const uptimeHours = Math.floor(this.healthData.uptime / 3600);
    const uptimeMinutes = Math.floor((this.healthData.uptime % 3600) / 60);
    
    const enabledFeatures = Object.values(this.healthData.features)
      .filter(enabled => enabled).length;
    
    const recentErrors = this.healthData.errors
      .filter(error => Date.now() - error.timestamp.getTime() < 3600000).length; // Last hour

    return {
      status: this.healthData.status,
      statusColor: this.healthData.status === 'healthy' ? 'success' :
                   this.healthData.status === 'degraded' ? 'warning' : 'error',
      uptime: `${uptimeHours}h ${uptimeMinutes}m`,
      responseTime: `${this.healthData.responseTime}ms`,
      features: enabledFeatures,
      recentErrors,
    };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stopMonitoring();
    this.removeAllListeners();
  }
}

// Create and export singleton instance
export const vamshHealthMonitor = new VamshHealthMonitorService();

// Auto-start monitoring when service is imported
vamshHealthMonitor.startMonitoring();

export default vamshHealthMonitor;
