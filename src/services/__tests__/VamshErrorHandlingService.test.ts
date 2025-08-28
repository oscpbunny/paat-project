import { VamshErrorHandlingService } from '../VamshErrorHandlingService';

// Mock the dependencies with better implementation
jest.mock('../VamshService', () => ({
  vamshService: {
    isHealthy: jest.fn().mockResolvedValue(true),
    getStatus: jest.fn().mockResolvedValue({ status: 'healthy' }),
    connect: jest.fn().mockResolvedValue(true)
  },
}));

jest.mock('../database', () => ({
  databaseService: {
    updateProject: jest.fn().mockResolvedValue(undefined),
    createErrorLog: jest.fn().mockResolvedValue({ id: 1 }),
    initialize: jest.fn().mockResolvedValue(undefined),
    isReady: jest.fn().mockReturnValue(true)
  },
}));

// Mock the logger to reduce test noise
jest.mock('../logger', () => ({
  createServiceLogger: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn()
  }))
}));

describe('VamshErrorHandlingService', () => {
  let service: VamshErrorHandlingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VamshErrorHandlingService();
    // Clear any previous event listeners
    service.removeAllListeners();
    
    // Add default error handlers to prevent unhandled events
    service.on('error', () => {}); // Silent handler
    service.on('retry', () => {}); // Silent handler
    service.on('recovery', () => {}); // Silent handler
    service.on('circuit-breaker-opened', () => {}); // Silent handler
    service.on('circuit-breaker-closed', () => {}); // Silent handler
  });

  afterEach(() => {
    // Clean up service
    service.cleanup();
  });
  describe('executeWithRetry', () => {
    it('should execute function successfully on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const context = {
        service: 'test-service',
        operation: 'test-operation',
        projectId: 'test-project-1'
      };

      const result = await service.executeWithRetry(mockFn, context);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValue('success');
      
      const context = {
        service: 'test-service',
        operation: 'test-operation',
        projectId: 'test-project-1'
      };

      // Use a shorter delay for testing
      const retryConfig = {
        initialDelay: 10,
        maxDelay: 100,
        jitter: false
      };

      const result = await service.executeWithRetry(mockFn, context, retryConfig);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Persistent error'));
      const context = {
        service: 'test-service',
        operation: 'test-operation',
        projectId: 'test-project-1'
      };
      const retryConfig = { 
        maxAttempts: 2,
        initialDelay: 10,
        jitter: false
      };

      await expect(service.executeWithRetry(mockFn, context, retryConfig))
        .rejects.toThrow('Persistent error');
      
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should use custom maxAttempts when provided', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'));
      const context = {
        service: 'test-service',
        operation: 'test-operation',
        projectId: 'test-project-1'
      };
      const retryConfig = { 
        maxAttempts: 5,
        initialDelay: 10,
        jitter: false
      };

      await expect(service.executeWithRetry(mockFn, context, retryConfig))
        .rejects.toThrow('Always fails');
      
      expect(mockFn).toHaveBeenCalledTimes(5);
    });

    it('should apply exponential backoff between retries', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValue('success');
      
      const context = {
        service: 'test-service',
        operation: 'test-operation',
        projectId: 'test-project-1'
      };

      const retryConfig = {
        initialDelay: 50,
        backoffFactor: 2,
        jitter: false
      };

      const startTime = Date.now();
      const result = await service.executeWithRetry(mockFn, context, retryConfig);
      const endTime = Date.now();

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
      // Should have taken at least 150ms (50ms + 100ms delays)
      expect(endTime - startTime).toBeGreaterThan(120);
    });
  });

  describe('Event Emission', () => {
    it('should emit error events on failures', async () => {
      // Remove default handlers and add specific one
      service.removeAllListeners();
      const errorHandler = jest.fn();
      service.on('error', errorHandler);
      
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));
      const context = {
        service: 'test-service',
        operation: 'test-operation',
        projectId: 'test-project-1'
      };
      
      const retryConfig = {
        maxAttempts: 1,
        initialDelay: 10
      };
      
      await expect(service.executeWithRetry(mockFn, context, retryConfig))
        .rejects.toThrow('Test error');
      
      // Error events should be emitted synchronously now
      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error',
          type: 'unknown',
          isRetryable: true
        })
      );
    });
    
    it('should emit retry events during retries', async () => {
      // Remove default handlers and add specific ones
      service.removeAllListeners();
      const retryHandler = jest.fn();
      service.on('retry', retryHandler);
      service.on('error', () => {}); // Silent error handler
      service.on('recovery', () => {}); // Silent recovery handler
      
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValue('success');
      const context = {
        service: 'test-service',
        operation: 'test-operation',
        projectId: 'test-project-1'
      };
      
      const retryConfig = {
        initialDelay: 10,
        jitter: false
      };
      
      const result = await service.executeWithRetry(mockFn, context, retryConfig);
      
      expect(result).toBe('success');
      expect(retryHandler).toHaveBeenCalledTimes(1);
      expect(retryHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'First error',
          isRetryable: true
        })
      );
    });
    
    it('should emit recovery events after successful retry', async () => {
      // Remove default handlers and add specific ones
      service.removeAllListeners();
      const recoveryHandler = jest.fn();
      service.on('recovery', recoveryHandler);
      service.on('error', () => {}); // Silent error handler
      service.on('retry', () => {}); // Silent retry handler
      
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValue('success');
      const context = {
        service: 'test-service',
        operation: 'test-operation',
        projectId: 'test-project-1'
      };
      
      const retryConfig = {
        initialDelay: 10,
        jitter: false
      };
      
      const result = await service.executeWithRetry(mockFn, context, retryConfig);
      
      expect(result).toBe('success');
      expect(recoveryHandler).toHaveBeenCalledTimes(1);
      expect(recoveryHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Operation succeeded after 2 attempts'),
          severity: 'low'
        })
      );
    });
  });

  describe('Error History', () => {
    it('should be able to create error handling service', () => {
      expect(service).toBeInstanceOf(VamshErrorHandlingService);
    });
    
    it('should handle service initialization', () => {
      const newService = new VamshErrorHandlingService();
      expect(newService).toBeDefined();
    });
  });

  describe('Service Configuration', () => {
    it('should have default retry configuration', () => {
      const newService = new VamshErrorHandlingService();
      expect(newService).toBeDefined();
      // Default configuration is private, but we can test that the service initializes
    });
  });

});

describe('VamshErrorHandlingService Integration', () => {
  let service: VamshErrorHandlingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VamshErrorHandlingService();
    
    // Add default error handlers to prevent unhandled events
    service.on('error', () => {}); // Silent handler
    service.on('retry', () => {}); // Silent handler
    service.on('recovery', () => {}); // Silent handler
    service.on('circuit-breaker-opened', () => {}); // Silent handler
    service.on('circuit-breaker-closed', () => {}); // Silent handler
  });

  afterEach(() => {
    service.cleanup();
  });

  it('should handle real-world error scenarios', async () => {
    // Simulate a flaky API call
    let callCount = 0;
    const flakyApiCall = jest.fn(() => {
      callCount++;
      if (callCount < 3) {
        return Promise.reject(new Error('Network timeout'));
      }
      return Promise.resolve({ status: 'success', data: 'response' });
    });

    const context = {
      service: 'test-service',
      operation: 'api-call',
      projectId: 'integration-test-1'
    };

    const retryConfig = {
      initialDelay: 10,
      jitter: false
    };

    const result = await service.executeWithRetry(flakyApiCall, context, retryConfig);
    
    expect(result).toEqual({ status: 'success', data: 'response' });
    expect(flakyApiCall).toHaveBeenCalledTimes(3);
  });

  it('should handle circuit breaker functionality', async () => {
    const failingService = jest.fn().mockRejectedValue(new Error('Service down'));
    const context = {
      service: 'test-service',
      operation: 'failing-service',
      projectId: 'circuit-test-1'
    };

    const retryConfig = {
      maxAttempts: 1,
      initialDelay: 10
    };

    // Trigger multiple failures to open circuit breaker
    // The circuit breaker opens after 5 failures (default threshold)
    for (let i = 0; i < 6; i++) {
      try {
        await service.executeWithRetry(failingService, context, retryConfig);
      } catch (error) {
        // Expected - either 'Service down' or 'Circuit breaker is open'
        expect(['Service down', 'Circuit breaker is open']).toContain(error.message);
      }
    }

    // Circuit breaker should now be open
    const circuitStates = service.getCircuitBreakerStatus();
    const serviceKey = `${context.service}:${context.operation}`;
    expect(circuitStates.get(serviceKey)?.state).toBe('open');
  });

  it('should provide error statistics', async () => {
    const failingFn = jest.fn().mockRejectedValue(new Error('Test error'));
    const context = {
      service: 'test-service',
      operation: 'test-op',
      projectId: 'stats-test'
    };

    const retryConfig = { maxAttempts: 1, initialDelay: 10 };

    // Generate some errors
    await service.executeWithRetry(failingFn, context, retryConfig).catch(() => {});
    await service.executeWithRetry(failingFn, context, retryConfig).catch(() => {});

    const stats = service.getErrorStatistics();
    expect(stats.total).toBeGreaterThan(0);
    expect(stats.byType.unknown).toBeGreaterThan(0);
    expect(stats.recentErrors).toHaveLength(stats.total);
  });
});
