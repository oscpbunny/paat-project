// Performance monitoring utilities for PAAT application
// Tracks startup time, component loading, and bundle performance

import React from 'react';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isEnabled: boolean = true;

  constructor() {
    // Enable performance monitoring in development and when debug mode is enabled
    this.isEnabled = process.env.NODE_ENV === 'development' || this.getDebugMode();
    
    if (this.isEnabled) {
      this.initializeAppStartupTracking();
    }
  }

  private getDebugMode(): boolean {
    try {
      const settings = localStorage.getItem('paat-settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        return parsed?.development?.debugMode || false;
      }
    } catch (error) {
      // Ignore localStorage errors
    }
    return false;
  }

  private initializeAppStartupTracking() {
    // Track overall app startup time
    this.startMetric('app-startup', { phase: 'initial' });
    
    // Track when DOM content is loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.recordMetric('dom-loaded', performance.now());
      });
    } else {
      this.recordMetric('dom-loaded', performance.now());
    }

    // Track when page is fully loaded
    window.addEventListener('load', () => {
      this.recordMetric('page-loaded', performance.now());
    });
  }

  // Start tracking a performance metric
  startMetric(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata,
    };
    
    this.metrics.set(name, metric);
  }

  // End tracking a performance metric
  endMetric(name: string, metadata?: Record<string, any>): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    
    if (metadata) {
      metric.metadata = { ...metric.metadata, ...metadata };
    }

    // Log significant metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ ${name}: ${metric.duration.toFixed(2)}ms`, metric.metadata);
    }

    return metric.duration;
  }

  // Record an instant performance metric
  recordMetric(name: string, timestamp?: number, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      startTime: timestamp || performance.now(),
      endTime: timestamp || performance.now(),
      duration: 0,
      metadata,
    };

    this.metrics.set(name, metric);

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${name}: ${metric.startTime.toFixed(2)}ms`, metadata);
    }
  }

  // Get all recorded metrics
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  // Get a specific metric
  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics.clear();
  }

  // Generate performance report
  generateReport(): {
    totalMetrics: number;
    criticalMetrics: PerformanceMetric[];
    summary: {
      appStartup?: number;
      componentLoading?: number;
      averageLoadTime?: number;
    };
  } {
    const metrics = this.getMetrics();
    const criticalMetrics = metrics.filter(m => 
      m.name.includes('startup') || 
      m.name.includes('loading') || 
      (m.duration && m.duration > 1000) // Over 1 second
    );

    const appStartup = this.getMetric('app-startup')?.duration;
    const componentLoadings = metrics.filter(m => m.name.includes('component-load'));
    const averageLoadTime = componentLoadings.length > 0 
      ? componentLoadings.reduce((sum, m) => sum + (m.duration || 0), 0) / componentLoadings.length
      : undefined;

    return {
      totalMetrics: metrics.length,
      criticalMetrics,
      summary: {
        appStartup,
        componentLoading: componentLoadings.length,
        averageLoadTime,
      },
    };
  }

  // Track React component loading
  trackComponentLoad(componentName: string) {
    return {
      start: () => this.startMetric(`component-load-${componentName}`),
      end: () => this.endMetric(`component-load-${componentName}`),
    };
  }

  // Track async operations
  trackAsyncOperation<T>(name: string, operation: Promise<T>): Promise<T> {
    if (!this.isEnabled) return operation;

    this.startMetric(name);
    
    return operation
      .then((result) => {
        this.endMetric(name, { success: true });
        return result;
      })
      .catch((error) => {
        this.endMetric(name, { success: false, error: error.message });
        throw error;
      });
  }

  // Export metrics for analysis
  exportMetrics(): string {
    const report = this.generateReport();
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      performance: {
        memory: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
        } : null,
        timing: performance.timing ? {
          domContentLoadedEventEnd: performance.timing.domContentLoadedEventEnd,
          loadEventEnd: performance.timing.loadEventEnd,
          navigationStart: performance.timing.navigationStart,
        } : null,
      },
      metrics: this.getMetrics(),
      report,
    }, null, 2);
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React Hook for component performance tracking
export const usePerformanceTracking = (componentName: string) => {
  const tracker = performanceMonitor.trackComponentLoad(componentName);
  
  return {
    startTracking: tracker.start,
    endTracking: tracker.end,
  };
};

// HOC for automatic component performance tracking
export const withPerformanceTracking = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
): React.FC<P> => {
  const TrackedComponent: React.FC<P> = (props) => {
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name || 'UnknownComponent';
    
    React.useEffect(() => {
      const tracker = performanceMonitor.trackComponentLoad(name);
      tracker.start();
      
      return () => {
        tracker.end();
      };
    }, [name]);

    return React.createElement(WrappedComponent, props);
  };

  TrackedComponent.displayName = `withPerformanceTracking(${componentName || WrappedComponent.displayName || WrappedComponent.name})`;
  
  return TrackedComponent;
};

export default performanceMonitor;
