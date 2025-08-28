// Settings type definitions for PAAT application
export interface SettingsConfig {
  // Application preferences
  app: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    autoStart: boolean;
    minimizeToTray: boolean;
    notifications: boolean;
    primaryColor: string;
    accentColor: string;
    fontFamily: 'Roboto' | 'Inter' | 'Poppins';
    fontSize: 'small' | 'medium' | 'large';
    compactMode: boolean;
    animations: boolean;
  };
  
  // AI service configuration
  aiServices: {
    ollama: {
      enabled: boolean;
      endpoint: string;
      models: {
        default: string;
        analysis: string;
        quick: string;
      };
      timeout: number;
    };
    vamsh: {
      enabled: boolean;
      endpoint: string;
      apiKey?: string;
      healthCheckInterval: number;
      timeout: number;
    };
  };
  
  // Project management preferences
  projects: {
    defaultPath: string;
    backupEnabled: boolean;
    backupInterval: number; // in seconds
    maxRecentProjects: number;
    autoSave: boolean;
    showHiddenFiles: boolean;
  };
  
  // Development preferences
  development: {
    debugMode: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    enableTelemetry: boolean;
    showPerformanceMetrics: boolean;
    enableHotReload: boolean;
  };
  
  // UI preferences
  ui: {
    sidebarWidth: number;
    showStatusBar: boolean;
    showToolbar: boolean;
    density: 'comfortable' | 'compact' | 'spacious';
    animationSpeed: 'slow' | 'normal' | 'fast';
  };
}

// Settings tab types
export type SettingsTab = 'general' | 'theme' | 'ai' | 'projects' | 'advanced';

export interface SettingsTabInfo {
  id: SettingsTab;
  label: string;
  icon: React.ComponentType;
  description?: string;
}

// Connection test results
export interface ConnectionTestResult {
  status: 'testing' | 'success' | 'error';
  message?: string;
  details?: {
    models?: string[];
    version?: string;
    health?: any;
    responseTime?: number;
  };
  error?: string;
  timestamp?: Date;
}

export interface TestResults {
  [service: string]: ConnectionTestResult;
}

// Settings change events
export interface SettingsChange {
  path: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
}

// Import/Export types
export interface SettingsExport {
  version: string;
  timestamp: string;
  settings: Partial<SettingsConfig>;
  metadata?: {
    appVersion: string;
    platform: string;
    exportedBy: string;
  };
}

// Settings validation
export interface SettingsValidationError {
  path: string;
  message: string;
  value: any;
}

export interface SettingsValidationResult {
  isValid: boolean;
  errors: SettingsValidationError[];
  warnings: SettingsValidationError[];
}

// Default settings configuration
export const DEFAULT_SETTINGS: SettingsConfig = {
  app: {
    theme: 'system',
    language: 'en',
    autoStart: false,
    minimizeToTray: true,
    notifications: true,
    primaryColor: '#1976d2',
    accentColor: '#f50057',
    fontFamily: 'Roboto',
    fontSize: 'medium',
    compactMode: false,
    animations: true,
  },
  aiServices: {
    ollama: {
      enabled: true,
      endpoint: 'http://localhost:11434',
      models: {
        default: 'qwen2.5:7b',
        analysis: 'qwen2.5:7b',
        quick: 'gemma2:2b',
      },
      timeout: 30000,
    },
    vamsh: {
      enabled: true,
      endpoint: 'http://localhost:8000',
      healthCheckInterval: 30,
      timeout: 10000,
    },
  },
  projects: {
    defaultPath: '', // Will be set to home directory + 'PAAT Projects'
    backupEnabled: true,
    backupInterval: 3600, // 1 hour
    maxRecentProjects: 10,
    autoSave: true,
    showHiddenFiles: false,
  },
  development: {
    debugMode: false,
    logLevel: 'info',
    enableTelemetry: true,
    showPerformanceMetrics: false,
    enableHotReload: true,
  },
  ui: {
    sidebarWidth: 240,
    showStatusBar: true,
    showToolbar: true,
    density: 'comfortable',
    animationSpeed: 'normal',
  },
};

// Settings schema for validation
export const SETTINGS_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    app: {
      type: 'object',
      properties: {
        theme: { type: 'string', enum: ['light', 'dark', 'system'] },
        language: { type: 'string', pattern: '^[a-z]{2}$' },
        autoStart: { type: 'boolean' },
        minimizeToTray: { type: 'boolean' },
        notifications: { type: 'boolean' },
        primaryColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
        accentColor: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
        fontFamily: { type: 'string', enum: ['Roboto', 'Inter', 'Poppins'] },
        fontSize: { type: 'string', enum: ['small', 'medium', 'large'] },
        compactMode: { type: 'boolean' },
        animations: { type: 'boolean' },
      },
      required: ['theme', 'language'],
    },
    aiServices: {
      type: 'object',
      properties: {
        ollama: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            endpoint: { type: 'string', format: 'uri' },
            models: {
              type: 'object',
              properties: {
                default: { type: 'string', minLength: 1 },
                analysis: { type: 'string', minLength: 1 },
                quick: { type: 'string', minLength: 1 },
              },
              required: ['default'],
            },
            timeout: { type: 'number', minimum: 1000, maximum: 300000 },
          },
          required: ['enabled', 'endpoint'],
        },
        vamsh: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            endpoint: { type: 'string', format: 'uri' },
            apiKey: { type: 'string' },
            healthCheckInterval: { type: 'number', minimum: 10, maximum: 600 },
            timeout: { type: 'number', minimum: 1000, maximum: 60000 },
          },
          required: ['enabled', 'endpoint'],
        },
      },
    },
    projects: {
      type: 'object',
      properties: {
        defaultPath: { type: 'string', minLength: 1 },
        backupEnabled: { type: 'boolean' },
        backupInterval: { type: 'number', minimum: 300, maximum: 86400 },
        maxRecentProjects: { type: 'number', minimum: 1, maximum: 50 },
        autoSave: { type: 'boolean' },
        showHiddenFiles: { type: 'boolean' },
      },
    },
    development: {
      type: 'object',
      properties: {
        debugMode: { type: 'boolean' },
        logLevel: { type: 'string', enum: ['error', 'warn', 'info', 'debug'] },
        enableTelemetry: { type: 'boolean' },
        showPerformanceMetrics: { type: 'boolean' },
        enableHotReload: { type: 'boolean' },
      },
    },
    ui: {
      type: 'object',
      properties: {
        sidebarWidth: { type: 'number', minimum: 200, maximum: 400 },
        showStatusBar: { type: 'boolean' },
        showToolbar: { type: 'boolean' },
        density: { type: 'string', enum: ['comfortable', 'compact', 'spacious'] },
        animationSpeed: { type: 'string', enum: ['slow', 'normal', 'fast'] },
      },
    },
  },
  required: ['app', 'aiServices'],
};
