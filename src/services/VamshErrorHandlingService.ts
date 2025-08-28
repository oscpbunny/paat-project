/**
 * VamshErrorHandlingService - Robust Error Handling & Recovery for Vamsh Integration
 * 
 * This service provides comprehensive error handling, retry logic, circuit breaker patterns,
 * and graceful degradation for all Vamsh-related communications and operations.
 */

import { EventEmitter } from 'events';

export interface ErrorContext {
  service: string;
  operation: string;
  projectId?: string;
  timestamp: Date;
  attempt: number;
  maxAttempts: number;
  metadata?: Record<string, any>;
}

export interface ErrorContextInput {
  service: string;
  operation: string;
  projectId?: string;
  maxAttempts?: number;
  metadata?: Record<string, any>;
}

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface VamshError {
  id: string;
  type: 'connection' | 'timeout' | 'validation' | 'api' | 'parsing' | 'unknown';
  severity: ErrorSeverity;
  message: string;
  context: ErrorContext;
  originalError?: Error;
  isRetryable: boolean;
  recoveryActions?: string[];
  timestamp: Date;
}

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failures: number;
  lastFailureTime: Date | null;
  nextAttemptTime: Date | null;
  successCount: number;
}

export type ErrorEventType = 'error' | 'retry' | 'recovery' | 'circuit-breaker-opened' | 'circuit-breaker-closed';
export type ErrorEventHandler = (event: ErrorEventType, error: VamshError, context?: any) => void;

export class VamshErrorHandlingService extends EventEmitter {
  private readonly defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    jitter: true
  };

  private readonly defaultCircuitBreakerConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    recoveryTimeout: 30000, // 30 seconds
    monitoringPeriod: 60000  // 1 minute
  };

  private circuitBreakerStates: Map<string, CircuitBreakerState> = new Map();
  private errorHistory: VamshError[] = [];
  private readonly maxErrorHistory = 1000;
  private maintenanceInterval?: NodeJS.Timeout;
  private circuitBreakerInterval?: NodeJS.Timeout;

  constructor() {
    super();
    // Only setup maintenance in non-test environment
    if (process.env.NODE_ENV !== 'test') {
      this.setupPeriodicMaintenance();
    }
  }

  /**
   * Execute an operation with comprehensive error handling and retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContextInput,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<T> {
    const config = { ...this.defaultRetryConfig, ...retryConfig };
    const serviceKey = `${context.service}:${context.operation}`;

    // Check circuit breaker
    if (!this.canAttemptOperation(serviceKey)) {
      const error = this.createError({
        type: 'connection',
        severity: 'high',
        message: 'Circuit breaker is open - operation blocked',
        context: { ...context, timestamp: new Date(), attempt: 0, maxAttempts: config.maxAttempts },
        isRetryable: false
      });
      // Emit synchronously for predictable test behavior
      this.emit('circuit-breaker-opened', error);
      throw new Error('Circuit breaker is open');
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        // Add artificial delay for retries
        if (attempt > 1) {
          const delay = this.calculateRetryDelay(attempt - 1, config);
          await this.sleep(delay);
        }

        const result = await operation();
        
        // Success - reset circuit breaker failures
        this.recordSuccess(serviceKey);
        
        if (attempt > 1) {
          // Emit recovery event synchronously for predictable behavior
          this.emit('recovery', this.createError({
            type: 'connection',
            severity: 'low',
            message: `Operation succeeded after ${attempt} attempts`,
            context: { ...context, timestamp: new Date(), attempt, maxAttempts: config.maxAttempts },
            isRetryable: false
          }));
        }

        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        const vamshError = this.processError(lastError, {
          ...context,
          timestamp: new Date(),
          attempt,
          maxAttempts: config.maxAttempts
        });

        this.recordError(vamshError);
        
        // Emit error event synchronously for predictable test behavior
        this.emit('error', vamshError);

        // Check if we should retry
        if (attempt < config.maxAttempts && vamshError.isRetryable) {
          // Emit retry event synchronously
          this.emit('retry', vamshError);
          continue;
        }

        // Final attempt failed - update circuit breaker
        this.recordFailure(serviceKey);
        throw lastError;
      }
    }

    // Should never reach here, but satisfy TypeScript
    throw lastError || new Error('Unknown error in retry logic');
  }

  /**
   * Process and categorize an error
   */
  private processError(error: Error, context: ErrorContext): VamshError {
    const errorType = this.categorizeError(error);
    const severity = this.determineSeverity(errorType, error);
    const isRetryable = this.isErrorRetryable(errorType, error);
    const recoveryActions = this.getRecoveryActions(errorType);

    return this.createError({
      type: errorType,
      severity,
      message: error.message || 'Unknown error occurred',
      context,
      originalError: error,
      isRetryable,
      recoveryActions
    });
  }

  /**
   * Create a standardized VamshError object
   */
  private createError(params: {
    type: VamshError['type'];
    severity: ErrorSeverity;
    message: string;
    context: ErrorContext;
    originalError?: Error;
    isRetryable: boolean;
    recoveryActions?: string[];
  }): VamshError {
    return {
      id: this.generateErrorId(),
      timestamp: new Date(),
      ...params
    };
  }

  /**
   * Categorize error by type
   */
  private categorizeError(error: Error): VamshError['type'] {
    const message = error.message.toLowerCase();
    const name = error.name?.toLowerCase() || '';

    if (message.includes('network') || message.includes('connection') || 
        message.includes('econnrefused') || message.includes('enotfound')) {
      return 'connection';
    }

    if (message.includes('timeout') || name.includes('timeout')) {
      return 'timeout';
    }

    if (message.includes('validation') || message.includes('invalid') || 
        message.includes('required') || message.includes('schema')) {
      return 'validation';
    }

    if (message.includes('api') || message.includes('http') || 
        message.includes('status') || message.includes('response')) {
      return 'api';
    }

    if (message.includes('parse') || message.includes('json') || 
        message.includes('syntax')) {
      return 'parsing';
    }

    return 'unknown';
  }

  /**
   * Determine error severity
   */
  private determineSeverity(type: VamshError['type'], error: Error): ErrorSeverity {
    switch (type) {
      case 'connection':
        return error.message.includes('server') ? 'high' : 'medium';
      case 'timeout':
        return 'medium';
      case 'validation':
        return 'low';
      case 'api':
        return error.message.includes('5') ? 'high' : 'medium'; // 5xx vs 4xx
      case 'parsing':
        return 'low';
      default:
        return 'medium';
    }
  }

  /**
   * Determine if an error is retryable
   */
  private isErrorRetryable(type: VamshError['type'], error: Error): boolean {
    switch (type) {
      case 'connection':
      case 'timeout':
        return true;
      case 'api':
        // Retry on 5xx, not on 4xx
        return error.message.includes('5') || 
               error.message.includes('502') || 
               error.message.includes('503') || 
               error.message.includes('504');
      case 'validation':
      case 'parsing':
        return false;
      default:
        return true;
    }
  }

  /**
   * Get suggested recovery actions for an error type
   */
  private getRecoveryActions(type: VamshError['type']): string[] {
    switch (type) {
      case 'connection':
        return [
          'Check Vamsh server is running on localhost:1337',
          'Verify network connectivity',
          'Restart Vamsh service if necessary'
        ];
      case 'timeout':
        return [
          'Increase timeout duration',
          'Check server load',
          'Verify request complexity'
        ];
      case 'validation':
        return [
          'Review request parameters',
          'Check API documentation',
          'Validate data format'
        ];
      case 'api':
        return [
          'Check API endpoint URL',
          'Verify request method and headers',
          'Review server logs'
        ];
      case 'parsing':
        return [
          'Check response format',
          'Verify content type',
          'Review API documentation'
        ];
      default:
        return [
          'Check logs for more details',
          'Verify system configuration',
          'Contact support if issue persists'
        ];
    }
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  private calculateRetryDelay(attempt: number, config: RetryConfig): number {
    const baseDelay = config.initialDelay * Math.pow(config.backoffFactor, attempt);
    const cappedDelay = Math.min(baseDelay, config.maxDelay);

    if (config.jitter) {
      // Add ±25% jitter
      const jitterRange = cappedDelay * 0.25;
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      return Math.max(100, cappedDelay + jitter); // Minimum 100ms
    }

    return cappedDelay;
  }

  /**
   * Check if operation can be attempted (circuit breaker logic)
   */
  private canAttemptOperation(serviceKey: string): boolean {
    const state = this.getCircuitBreakerState(serviceKey);
    const now = new Date();

    switch (state.state) {
      case 'closed':
        return true;
      case 'open':
        if (state.nextAttemptTime && now >= state.nextAttemptTime) {
          state.state = 'half-open';
          state.successCount = 0;
          return true;
        }
        return false;
      case 'half-open':
        return true;
      default:
        return true;
    }
  }

  /**
   * Get or create circuit breaker state
   */
  private getCircuitBreakerState(serviceKey: string): CircuitBreakerState {
    if (!this.circuitBreakerStates.has(serviceKey)) {
      this.circuitBreakerStates.set(serviceKey, {
        state: 'closed',
        failures: 0,
        lastFailureTime: null,
        nextAttemptTime: null,
        successCount: 0
      });
    }
    return this.circuitBreakerStates.get(serviceKey)!;
  }

  /**
   * Record a successful operation
   */
  private recordSuccess(serviceKey: string): void {
    const state = this.getCircuitBreakerState(serviceKey);
    
    if (state.state === 'half-open') {
      state.successCount++;
      if (state.successCount >= 2) { // Require 2 successes to close
        state.state = 'closed';
        state.failures = 0;
        state.lastFailureTime = null;
        state.nextAttemptTime = null;
        // Use setTimeout for non-blocking event emission
        setTimeout(() => this.emit('circuit-breaker-closed', { serviceKey }), 0);
      }
    } else if (state.state === 'closed') {
      state.failures = Math.max(0, state.failures - 1); // Gradual recovery
    }
  }

  /**
   * Record a failed operation
   */
  private recordFailure(serviceKey: string): void {
    const state = this.getCircuitBreakerState(serviceKey);
    const now = new Date();
    
    state.failures++;
    state.lastFailureTime = now;

    if (state.failures >= this.defaultCircuitBreakerConfig.failureThreshold) {
      state.state = 'open';
      state.nextAttemptTime = new Date(now.getTime() + this.defaultCircuitBreakerConfig.recoveryTimeout);
      // Use setTimeout for non-blocking event emission
      setTimeout(() => this.emit('circuit-breaker-opened', { serviceKey }), 0);
    }
  }

  /**
   * Record error in history
   */
  private recordError(error: VamshError): void {
    this.errorHistory.unshift(error);
    
    // Keep history within limits
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(0, this.maxErrorHistory);
    }
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(timeWindow?: number): {
    total: number;
    byType: Record<VamshError['type'], number>;
    bySeverity: Record<ErrorSeverity, number>;
    recentErrors: VamshError[];
  } {
    const windowStart = timeWindow ? new Date(Date.now() - timeWindow) : null;
    const relevantErrors = windowStart 
      ? this.errorHistory.filter(e => e.timestamp >= windowStart)
      : this.errorHistory;

    const byType: Record<VamshError['type'], number> = {
      connection: 0, timeout: 0, validation: 0, api: 0, parsing: 0, unknown: 0
    };
    const bySeverity: Record<ErrorSeverity, number> = {
      low: 0, medium: 0, high: 0, critical: 0
    };

    relevantErrors.forEach(error => {
      byType[error.type]++;
      bySeverity[error.severity]++;
    });

    return {
      total: relevantErrors.length,
      byType,
      bySeverity,
      recentErrors: relevantErrors.slice(0, 10)
    };
  }

  /**
   * Get circuit breaker status for all services
   */
  getCircuitBreakerStatus(): Map<string, CircuitBreakerState> {
    return new Map(this.circuitBreakerStates);
  }

  /**
   * Reset circuit breaker for a specific service
   */
  resetCircuitBreaker(serviceKey: string): boolean {
    if (this.circuitBreakerStates.has(serviceKey)) {
      this.circuitBreakerStates.set(serviceKey, {
        state: 'closed',
        failures: 0,
        lastFailureTime: null,
        nextAttemptTime: null,
        successCount: 0
      });
      return true;
    }
    return false;
  }

  /**
   * Test error handling with simulated failures
   */
  async testErrorHandling(): Promise<void> {
    console.log('[VamshErrorHandling] Starting error handling test...');

    const testOperation = async (shouldFail: boolean) => {
      if (shouldFail) {
        throw new Error('Simulated test failure');
      }
      return 'success';
    };

    try {
      // Test successful operation
      await this.executeWithRetry(
        () => testOperation(false),
        { service: 'test', operation: 'success-test' }
      );
      console.log('[VamshErrorHandling] Success test passed');

      // Test retry logic
      let attemptCount = 0;
      await this.executeWithRetry(
        () => {
          attemptCount++;
          return testOperation(attemptCount < 3); // Fail first 2 attempts
        },
        { service: 'test', operation: 'retry-test' }
      );
      console.log('[VamshErrorHandling] Retry test passed');

      // Test circuit breaker (multiple failures)
      for (let i = 0; i < 6; i++) {
        try {
          await this.executeWithRetry(
            () => testOperation(true),
            { service: 'test', operation: 'circuit-breaker-test' },
            { maxAttempts: 1 }
          );
        } catch (error) {
          // Expected failures
        }
      }

      console.log('[VamshErrorHandling] All tests completed');
      console.log('Error statistics:', this.getErrorStatistics());
      console.log('Circuit breaker states:', Array.from(this.getCircuitBreakerStatus().entries()));
    } catch (error) {
      console.error('[VamshErrorHandling] Test failed:', error);
    }
  }

  /**
   * Helper method to sleep for a given duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Setup periodic maintenance tasks
   */
  private setupPeriodicMaintenance(): void {
    // Clean up old errors every 10 minutes
    this.maintenanceInterval = setInterval(() => {
      const cutoff = new Date(Date.now() - (24 * 60 * 60 * 1000)); // 24 hours
      this.errorHistory = this.errorHistory.filter(e => e.timestamp >= cutoff);
    }, 10 * 60 * 1000);

    // Check circuit breaker states every minute
    this.circuitBreakerInterval = setInterval(() => {
      const now = new Date();
      for (const [key, state] of this.circuitBreakerStates.entries()) {
        if (state.state === 'open' && state.nextAttemptTime && now >= state.nextAttemptTime) {
          state.state = 'half-open';
          state.successCount = 0;
        }
      }
    }, 60 * 1000);
  }

  /**
   * Cleanup service
   */
  cleanup(): void {
    this.removeAllListeners();
    this.circuitBreakerStates.clear();
    this.errorHistory = [];
    
    // Clear any intervals that might have been set
    if (this.maintenanceInterval) {
      clearInterval(this.maintenanceInterval);
    }
    if (this.circuitBreakerInterval) {
      clearInterval(this.circuitBreakerInterval);
    }
  }
}

// Create singleton instance
export const vamshErrorHandlingService = new VamshErrorHandlingService();
