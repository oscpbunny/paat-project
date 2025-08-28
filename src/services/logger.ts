/**
 * PAAT - AI Personal Assistant Agent Tool
 * Production Logging System
 * 
 * Provides structured logging with levels, file output, and centralized error reporting
 */

import { app } from 'electron';
import { join } from 'path';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  levelName: string;
  service: string;
  message: string;
  data?: any;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata: {
    pid: number;
    platform: string;
    version?: string;
    sessionId: string;
  };
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logFile: string;
  private sessionId: string;
  private isElectronContext: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isElectronContext = typeof window === 'undefined' && typeof process !== 'undefined';
    
    // Initialize log file path
    if (this.isElectronContext && app) {
      const userDataPath = app.getPath('userData');
      const logsDir = join(userDataPath, 'logs');
      
      if (!existsSync(logsDir)) {
        mkdirSync(logsDir, { recursive: true });
      }
      
      this.logFile = join(logsDir, `paat-${new Date().toISOString().split('T')[0]}.log`);
    } else {
      // Browser context - use sessionStorage for log buffer
      this.logFile = '';
    }

    // Set log level from environment
    const envLogLevel = process.env.PAAT_LOG_LEVEL;
    if (envLogLevel) {
      switch (envLogLevel.toLowerCase()) {
        case 'debug':
          this.logLevel = LogLevel.DEBUG;
          break;
        case 'info':
          this.logLevel = LogLevel.INFO;
          break;
        case 'warn':
          this.logLevel = LogLevel.WARN;
          break;
        case 'error':
          this.logLevel = LogLevel.ERROR;
          break;
        case 'fatal':
          this.logLevel = LogLevel.FATAL;
          break;
      }
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createLogEntry(level: LogLevel, service: string, message: string, data?: any, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      levelName: LogLevel[level],
      service,
      message,
      data,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      metadata: {
        pid: this.isElectronContext ? process.pid : 0,
        platform: this.isElectronContext ? process.platform : navigator.platform,
        version: this.isElectronContext && app ? app.getVersion() : undefined,
        sessionId: this.sessionId
      }
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private writeToFile(entry: LogEntry): void {
    if (!this.isElectronContext || !this.logFile) return;

    try {
      const logLine = JSON.stringify(entry) + '\n';
      writeFileSync(this.logFile, logLine, { flag: 'a' });
    } catch (error) {
      // Fallback to console if file write fails
      console.error('Failed to write to log file:', error);
    }
  }

  private writeToConsole(entry: LogEntry): void {
    const { timestamp, levelName, service, message, data, error } = entry;
    const prefix = `[${timestamp}] [${levelName}] [${service}]`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, message, data ? data : '');
        break;
      case LogLevel.INFO:
        console.info(prefix, message, data ? data : '');
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, data ? data : '');
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(prefix, message, data ? data : '', error ? error : '');
        break;
    }
  }

  private writeToStorage(entry: LogEntry): void {
    if (this.isElectronContext) return;

    try {
      const existingLogs = sessionStorage.getItem('paat-logs') || '[]';
      const logs = JSON.parse(existingLogs);
      logs.push(entry);
      
      // Keep only last 100 log entries in browser storage
      if (logs.length > 100) {
        logs.shift();
      }
      
      sessionStorage.setItem('paat-logs', JSON.stringify(logs));
    } catch (error) {
      console.warn('Failed to write to session storage:', error);
    }
  }

  private log(level: LogLevel, service: string, message: string, data?: any, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, service, message, data, error);
    
    // Write to console (always)
    this.writeToConsole(entry);
    
    // Write to file (Electron context)
    this.writeToFile(entry);
    
    // Write to storage (browser context)
    this.writeToStorage(entry);
  }

  // Public logging methods
  debug(service: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, service, message, data);
  }

  info(service: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, service, message, data);
  }

  warn(service: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, service, message, data);
  }

  error(service: string, message: string, error?: Error, data?: any): void {
    this.log(LogLevel.ERROR, service, message, data, error);
  }

  fatal(service: string, message: string, error?: Error, data?: any): void {
    this.log(LogLevel.FATAL, service, message, data, error);
  }

  // Utility methods
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  getLogLevel(): LogLevel {
    return this.logLevel;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  // Get recent logs (useful for debugging)
  getRecentLogs(count: number = 50): LogEntry[] {
    if (this.isElectronContext) {
      // Read from file in Electron context
      try {
        if (!existsSync(this.logFile)) return [];
        
        const logContent = readFileSync(this.logFile, 'utf-8');
        const lines = logContent.trim().split('\n').slice(-count);
        
        return lines.map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        }).filter(entry => entry !== null);
      } catch {
        return [];
      }
    } else {
      // Read from session storage in browser context
      try {
        const logs = sessionStorage.getItem('paat-logs');
        if (!logs) return [];
        
        const parsedLogs = JSON.parse(logs);
        return parsedLogs.slice(-count);
      } catch {
        return [];
      }
    }
  }

  // Performance logging
  time(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.timeEnd(label);
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions for each service
export const createServiceLogger = (serviceName: string) => ({
  debug: (message: string, data?: any) => logger.debug(serviceName, message, data),
  info: (message: string, data?: any) => logger.info(serviceName, message, data),
  warn: (message: string, data?: any) => logger.warn(serviceName, message, data),
  error: (message: string, error?: Error, data?: any) => logger.error(serviceName, message, error, data),
  fatal: (message: string, error?: Error, data?: any) => logger.fatal(serviceName, message, error, data),
  time: (label: string) => logger.time(`${serviceName}:${label}`),
  timeEnd: (label: string) => logger.timeEnd(`${serviceName}:${label}`)
});

// Export default logger
export default logger;
