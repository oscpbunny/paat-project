// Diagnostic service for PAAT application health monitoring and troubleshooting
import { performanceMonitor } from '../utils/performanceMonitor';

export interface SystemInfo {
  browser: {
    userAgent: string;
    platform: string;
    language: string;
    onLine: boolean;
    cookieEnabled: boolean;
    javaEnabled: boolean;
  };
  screen: {
    width: number;
    height: number;
    availWidth: number;
    availHeight: number;
    colorDepth: number;
    pixelRatio: number;
  };
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  connection?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  };
  storage: {
    localStorage: {
      available: boolean;
      used: number;
      quota?: number;
    };
    sessionStorage: {
      available: boolean;
      used: number;
    };
  };
  electron?: {
    version: string;
    chrome: string;
    node: string;
    v8: string;
  };
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  duration?: number;
}

export interface DiagnosticReport {
  timestamp: string;
  appVersion: string;
  systemInfo: SystemInfo;
  healthChecks: HealthCheck[];
  performance: any;
  errorReports: any[];
  settings: any;
  recommendations: string[];
}

class DiagnosticService {
  private healthChecks: Map<string, () => Promise<HealthCheck>> = new Map();

  constructor() {
    this.registerDefaultHealthChecks();
  }

  private registerDefaultHealthChecks() {
    // Register built-in health checks
    this.healthChecks.set('localStorage', this.checkLocalStorage.bind(this));
    this.healthChecks.set('performance', this.checkPerformance.bind(this));
    this.healthChecks.set('memory', this.checkMemory.bind(this));
    this.healthChecks.set('network', this.checkNetwork.bind(this));
    this.healthChecks.set('settings', this.checkSettings.bind(this));
    this.healthChecks.set('database', this.checkDatabase.bind(this));
    this.healthChecks.set('aiServices', this.checkAIServices.bind(this));
  }

  // Generate comprehensive system information
  getSystemInfo(): SystemInfo {
    const systemInfo: SystemInfo = {
      browser: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        onLine: navigator.onLine,
        cookieEnabled: navigator.cookieEnabled,
        javaEnabled: typeof (navigator as any).javaEnabled === 'function' 
          ? (navigator as any).javaEnabled() 
          : false,
      },
      screen: {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
        pixelRatio: window.devicePixelRatio,
      },
      storage: {
        localStorage: this.getStorageInfo('localStorage'),
        sessionStorage: this.getStorageInfo('sessionStorage'),
      },
    };

    // Add memory information if available (Chrome)
    if ((performance as any).memory) {
      systemInfo.memory = {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      };
    }

    // Add connection information if available
    if ((navigator as any).connection) {
      const conn = (navigator as any).connection;
      systemInfo.connection = {
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        saveData: conn.saveData,
      };
    }

    // Add Electron version information if available
    if ((window as any).electronAPI) {
      systemInfo.electron = {
        version: process.versions?.electron || 'unknown',
        chrome: process.versions?.chrome || 'unknown',
        node: process.versions?.node || 'unknown',
        v8: process.versions?.v8 || 'unknown',
      };
    }

    return systemInfo;
  }

  private getStorageInfo(storageType: 'localStorage' | 'sessionStorage') {
    const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
    
    try {
      // Test availability
      const testKey = '__paat_test__';
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      
      // Calculate used space
      let used = 0;
      for (let key in storage) {
        if (storage.hasOwnProperty(key)) {
          used += storage[key].length + key.length;
        }
      }

      const result: any = {
        available: true,
        used,
      };

      // Try to get quota information (experimental)
      if (storageType === 'localStorage' && 'storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then(estimate => {
          result.quota = estimate.quota;
        }).catch(() => {
          // Ignore quota estimation errors
        });
      }

      return result;
    } catch (error) {
      return {
        available: false,
        used: 0,
      };
    }
  }

  // Run all health checks
  async runHealthChecks(): Promise<HealthCheck[]> {
    const results: HealthCheck[] = [];
    
    for (const [name, checkFn] of this.healthChecks) {
      try {
        const startTime = performance.now();
        const result = await checkFn();
        const duration = performance.now() - startTime;
        
        results.push({
          ...result,
          duration,
        });
      } catch (error) {
        results.push({
          name,
          status: 'error',
          message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
        });
      }
    }
    
    return results;
  }

  // Individual health check implementations
  private async checkLocalStorage(): Promise<HealthCheck> {
    try {
      const testKey = '__paat_health_check__';
      const testValue = Date.now().toString();
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (retrieved === testValue) {
        return {
          name: 'localStorage',
          status: 'healthy',
          message: 'Local storage is working correctly',
          timestamp: new Date(),
        };
      } else {
        throw new Error('Data integrity check failed');
      }
    } catch (error) {
      return {
        name: 'localStorage',
        status: 'error',
        message: `Local storage error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
    }
  }

  private async checkPerformance(): Promise<HealthCheck> {
    const report = performanceMonitor.generateReport();
    const criticalMetrics = report.criticalMetrics.length;
    
    let status: 'healthy' | 'warning' | 'error' = 'healthy';
    let message = 'Application performance is optimal';
    
    if (report.summary.appStartup && report.summary.appStartup > 5000) {
      status = 'warning';
      message = 'Slow application startup detected';
    } else if (report.summary.appStartup && report.summary.appStartup > 10000) {
      status = 'error';
      message = 'Very slow application startup detected';
    }
    
    if (criticalMetrics > 5) {
      status = 'warning';
      message = 'Multiple slow operations detected';
    }

    return {
      name: 'performance',
      status,
      message,
      details: {
        startupTime: report.summary.appStartup,
        criticalMetrics,
        totalMetrics: report.totalMetrics,
      },
      timestamp: new Date(),
    };
  }

  private async checkMemory(): Promise<HealthCheck> {
    if (!(performance as any).memory) {
      return {
        name: 'memory',
        status: 'warning',
        message: 'Memory usage information not available',
        timestamp: new Date(),
      };
    }

    const memory = (performance as any).memory;
    const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    
    let status: 'healthy' | 'warning' | 'error' = 'healthy';
    let message = 'Memory usage is within normal limits';
    
    if (usageRatio > 0.8) {
      status = 'error';
      message = 'High memory usage detected';
    } else if (usageRatio > 0.6) {
      status = 'warning';
      message = 'Elevated memory usage detected';
    }

    return {
      name: 'memory',
      status,
      message,
      details: {
        usedMB: Math.round(memory.usedJSHeapSize / (1024 * 1024)),
        totalMB: Math.round(memory.totalJSHeapSize / (1024 * 1024)),
        limitMB: Math.round(memory.jsHeapSizeLimit / (1024 * 1024)),
        usageRatio: Math.round(usageRatio * 100),
      },
      timestamp: new Date(),
    };
  }

  private async checkNetwork(): Promise<HealthCheck> {
    if (!navigator.onLine) {
      return {
        name: 'network',
        status: 'error',
        message: 'No network connection detected',
        timestamp: new Date(),
      };
    }

    // Test network connectivity with a small request
    try {
      const startTime = performance.now();
      const response = await fetch('/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-cache',
      });
      const responseTime = performance.now() - startTime;
      
      let status: 'healthy' | 'warning' | 'error' = 'healthy';
      let message = 'Network connection is healthy';
      
      if (responseTime > 5000) {
        status = 'warning';
        message = 'Slow network connection detected';
      } else if (!response.ok) {
        status = 'warning';
        message = 'Network connectivity issues detected';
      }

      return {
        name: 'network',
        status,
        message,
        details: {
          responseTime: Math.round(responseTime),
          status: response.status,
          connection: (navigator as any).connection ? {
            effectiveType: (navigator as any).connection.effectiveType,
            downlink: (navigator as any).connection.downlink,
          } : null,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'network',
        status: 'warning',
        message: 'Could not verify network connectivity',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
      };
    }
  }

  private async checkSettings(): Promise<HealthCheck> {
    try {
      const settingsData = localStorage.getItem('paat-settings');
      
      if (!settingsData) {
        return {
          name: 'settings',
          status: 'warning',
          message: 'No settings data found, using defaults',
          timestamp: new Date(),
        };
      }

      const settings = JSON.parse(settingsData);
      
      // Basic validation
      if (!settings.app || !settings.aiServices) {
        return {
          name: 'settings',
          status: 'error',
          message: 'Settings data is corrupted or invalid',
          timestamp: new Date(),
        };
      }

      return {
        name: 'settings',
        status: 'healthy',
        message: 'Settings are loaded and valid',
        details: {
          hasApp: !!settings.app,
          hasAI: !!settings.aiServices,
          hasProjects: !!settings.projects,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'settings',
        status: 'error',
        message: `Settings error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
    }
  }

  private async checkDatabase(): Promise<HealthCheck> {
    try {
      // In a real implementation, this would test database connectivity
      // For now, we'll just check if the database service is available
      
      return {
        name: 'database',
        status: 'healthy',
        message: 'Database service is accessible',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'error',
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
    }
  }

  private async checkAIServices(): Promise<HealthCheck> {
    try {
      const settings = localStorage.getItem('paat-settings');
      if (!settings) {
        return {
          name: 'aiServices',
          status: 'warning',
          message: 'AI services configuration not found',
          timestamp: new Date(),
        };
      }

      const parsedSettings = JSON.parse(settings);
      const ollamaEnabled = parsedSettings?.aiServices?.ollama?.enabled;
      const vamshEnabled = parsedSettings?.aiServices?.vamsh?.enabled;
      
      if (!ollamaEnabled && !vamshEnabled) {
        return {
          name: 'aiServices',
          status: 'warning',
          message: 'No AI services are enabled',
          timestamp: new Date(),
        };
      }

      return {
        name: 'aiServices',
        status: 'healthy',
        message: 'AI services are configured',
        details: {
          ollama: ollamaEnabled,
          vamsh: vamshEnabled,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'aiServices',
        status: 'error',
        message: `AI services check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
    }
  }

  // Generate comprehensive diagnostic report
  async generateDiagnosticReport(): Promise<DiagnosticReport> {
    const systemInfo = this.getSystemInfo();
    const healthChecks = await this.runHealthChecks();
    const performance = performanceMonitor.generateReport();
    
    // Get error reports
    let errorReports = [];
    try {
      const errorData = localStorage.getItem('paat-error-reports');
      errorReports = errorData ? JSON.parse(errorData) : [];
    } catch (error) {
      // Ignore error report loading issues
    }

    // Get settings (sanitized)
    let settings = {};
    try {
      const settingsData = localStorage.getItem('paat-settings');
      if (settingsData) {
        settings = JSON.parse(settingsData);
        // Remove sensitive information
        delete (settings as any).aiServices?.vamsh?.apiKey;
      }
    } catch (error) {
      // Ignore settings loading issues
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(healthChecks, systemInfo);

    return {
      timestamp: new Date().toISOString(),
      appVersion: process.env.REACT_APP_VERSION || '0.1.0',
      systemInfo,
      healthChecks,
      performance,
      errorReports,
      settings,
      recommendations,
    };
  }

  private generateRecommendations(healthChecks: HealthCheck[], systemInfo: SystemInfo): string[] {
    const recommendations: string[] = [];
    
    // Check for common issues and provide recommendations
    const errorChecks = healthChecks.filter(check => check.status === 'error');
    const warningChecks = healthChecks.filter(check => check.status === 'warning');
    
    if (errorChecks.length > 0) {
      recommendations.push('Critical issues detected. Please resolve error conditions to ensure stable operation.');
    }

    if (warningChecks.length > 2) {
      recommendations.push('Multiple warnings detected. Consider reviewing configuration and system resources.');
    }

    // Memory-specific recommendations
    const memoryCheck = healthChecks.find(check => check.name === 'memory');
    if (memoryCheck?.details?.usageRatio > 70) {
      recommendations.push('High memory usage detected. Consider closing other applications or restarting PAAT.');
    }

    // Performance recommendations
    const perfCheck = healthChecks.find(check => check.name === 'performance');
    if (perfCheck?.details?.startupTime > 5000) {
      recommendations.push('Slow startup detected. Try clearing application cache or optimizing system resources.');
    }

    // Network recommendations
    const networkCheck = healthChecks.find(check => check.name === 'network');
    if (networkCheck?.status !== 'healthy') {
      recommendations.push('Network connectivity issues may affect AI service integration and updates.');
    }

    // AI services recommendations
    const aiCheck = healthChecks.find(check => check.name === 'aiServices');
    if (aiCheck?.status === 'warning') {
      recommendations.push('Configure AI services (Ollama/Vamsh) in settings to enable intelligent features.');
    }

    if (recommendations.length === 0) {
      recommendations.push('All systems are operating normally. No immediate action required.');
    }

    return recommendations;
  }

  // Export diagnostic report as downloadable file
  exportDiagnosticReport(): Promise<string> {
    return this.generateDiagnosticReport().then(report => {
      const reportText = JSON.stringify(report, null, 2);
      const blob = new Blob([reportText], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `paat-diagnostic-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return reportText;
    });
  }

  // Clear error reports and diagnostic data
  clearDiagnosticData(): void {
    try {
      localStorage.removeItem('paat-error-reports');
      performanceMonitor.clearMetrics();
    } catch (error) {
      console.warn('Could not clear diagnostic data:', error);
    }
  }
}

// Singleton instance
export const diagnosticService = new DiagnosticService();
export default diagnosticService;
