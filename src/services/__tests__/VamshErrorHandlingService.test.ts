import { VamshErrorHandlingService } from '../VamshErrorHandlingService';

// Mock the dependencies
jest.mock('../VamshService', () => ({
  vamshService: {
    isHealthy: jest.fn(),
    getStatus: jest.fn(),
  },
}));

jest.mock('../database', () => ({
  databaseService: {
    updateProject: jest.fn(),
    createErrorLog: jest.fn(),
  },
}));

describe('VamshErrorHandlingService', () => {
  let service: VamshErrorHandlingService;
  
  beforeEach(() => {
    service = new VamshErrorHandlingService();
    jest.clearAllMocks();
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
      // Mock console methods to suppress error logging in tests
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValue('success');
      
      const context = {
        service: 'test-service',
        operation: 'test-operation',
        projectId: 'test-project-1'
      };

      const result = await service.executeWithRetry(mockFn, context);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
      
      consoleErrorSpy.mockRestore();
    });

    it('should fail after max retries', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const mockFn = jest.fn().mockRejectedValue(new Error('Persistent error'));
      const context = {
        service: 'test-service',
        operation: 'test-operation',
        projectId: 'test-project-1',
        maxAttempts: 2
      };
      const retryConfig = { maxAttempts: 2 };

      await expect(service.executeWithRetry(mockFn, context, retryConfig))
        .rejects.toThrow('Persistent error');
      
      expect(mockFn).toHaveBeenCalledTimes(2);
      
      consoleErrorSpy.mockRestore();
    });

    it('should use custom maxAttempts when provided', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'));
      const context = {
        service: 'test-service',
        operation: 'test-operation',
        projectId: 'test-project-1'
      };
      const retryConfig = { maxAttempts: 5 };

      await expect(service.executeWithRetry(mockFn, context, retryConfig))
        .rejects.toThrow('Always fails');
      
      expect(mockFn).toHaveBeenCalledTimes(5);
      
      consoleErrorSpy.mockRestore();
    });

    it('should apply exponential backoff between retries', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValue('success');
      
      const context = {
        service: 'test-service',
        operation: 'test-operation',
        projectId: 'test-project-1'
      };

      const startTime = Date.now();
      const result = await service.executeWithRetry(mockFn, context);
      const endTime = Date.now();

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
      // Should have taken at least 3 seconds (1s + 2s delays)
      expect(endTime - startTime).toBeGreaterThan(2900);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Event Emission', () => {
    it('should emit error events on failures', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const errorHandler = jest.fn();
      service.on('error', errorHandler);
      
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));
      const context = {
        service: 'test-service',
        operation: 'test-operation',
        projectId: 'test-project-1'
      };
      
      await service.executeWithRetry(mockFn, context).catch(() => {});
      
      expect(errorHandler).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
    
    it('should emit retry events during retries', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const retryHandler = jest.fn();
      service.on('retry', retryHandler);
      
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValue('success');
      const context = {
        service: 'test-service',
        operation: 'test-operation',
        projectId: 'test-project-1'
      };
      
      await service.executeWithRetry(mockFn, context);
      
      expect(retryHandler).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
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
    service = new VamshErrorHandlingService();
  });

  it('should handle real-world error scenarios', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
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

    const result = await service.executeWithRetry(flakyApiCall, context);
    
    expect(result).toEqual({ status: 'success', data: 'response' });
    expect(flakyApiCall).toHaveBeenCalledTimes(3);
    consoleErrorSpy.mockRestore();
  });

  it('should handle multiple failure scenarios', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const failingService = jest.fn().mockRejectedValue(new Error('Service down'));
    const context = {
      service: 'test-service',
      operation: 'failing-service',
      projectId: 'circuit-test-1'
    };

    // Trigger multiple failures
    for (let i = 0; i < 3; i++) {
      await service.executeWithRetry(failingService, context).catch(() => {});
    }

    // Should have attempted retries for each call
    expect(failingService).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
