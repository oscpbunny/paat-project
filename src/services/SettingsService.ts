import { EventEmitter } from 'events';

// Browser-safe path and os utilities
const path = {
  join: (...args: string[]) => args.filter(Boolean).join('/').replace(/\/+/g, '/'),
};

const os = {
  homedir: () => {
    if (typeof window !== 'undefined') {
      return '/home/user';
    }
    try {
      return require('os').homedir();
    } catch {
      return '/home/user';
    }
  },
  platform: () => {
    if (typeof window !== 'undefined') {
      return 'browser';
    }
    try {
      return require('os').platform();
    } catch {
      return 'unknown';
    }
  },
};
import {
  SettingsConfig,
  DEFAULT_SETTINGS,
  SettingsChange,
  SettingsExport,
  SettingsValidationResult,
  SettingsValidationError,
  SETTINGS_SCHEMA,
} from '../types/settings';

// Dynamic import of electron-store to handle browser environments
let Store: any = null;

// Only load electron-store in actual Electron environment
const isElectron = () => {
  try {
    return !!(window && window.require && window.require('electron'));
  } catch {
    return false;
  }
};

if (isElectron()) {
  try {
    Store = window.require('electron-store');
  } catch (error) {
    console.warn('Could not load electron-store:', error);
    Store = null;
  }
}

// JSON Schema validator
const validateSettings = (settings: any): SettingsValidationResult => {
  const errors: SettingsValidationError[] = [];
  const warnings: SettingsValidationError[] = [];

  // Basic validation - check required fields
  if (!settings.app || !settings.aiServices) {
    errors.push({
      path: 'root',
      message: 'Missing required sections: app or aiServices',
      value: settings,
    });
    return { isValid: false, errors, warnings };
  }

  // Validate theme
  if (!['light', 'dark', 'system'].includes(settings.app.theme)) {
    errors.push({
      path: 'app.theme',
      message: 'Theme must be one of: light, dark, system',
      value: settings.app.theme,
    });
  }

  // Validate URLs
  const urlFields = ['aiServices.ollama.endpoint', 'aiServices.vamsh.endpoint'];
  urlFields.forEach(fieldPath => {
    const value = getNestedValue(settings, fieldPath);
    if (value && !isValidUrl(value)) {
      errors.push({
        path: fieldPath,
        message: 'Invalid URL format',
        value,
      });
    }
  });

  // Validate color formats
  const colorFields = ['app.primaryColor', 'app.accentColor'];
  colorFields.forEach(fieldPath => {
    const value = getNestedValue(settings, fieldPath);
    if (value && !isValidColor(value)) {
      warnings.push({
        path: fieldPath,
        message: 'Invalid color format, should be hex color (e.g., #1976d2)',
        value,
      });
    }
  });

  return { isValid: errors.length === 0, errors, warnings };
};

// Helper functions
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

const setNestedValue = (obj: any, path: string, value: any): void => {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
};

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidColor = (color: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
};

export class SettingsService extends EventEmitter {
  private store: any;
  private settings: SettingsConfig;
  private initialized = false;

  constructor() {
    super();
    this.settings = { ...DEFAULT_SETTINGS };
    
    // Set default project path
    this.settings.projects.defaultPath = path.join(os.homedir(), 'PAAT Projects');
    
    this.initializeStore();
  }

  private initializeStore(): void {
    try {
      if (Store) {
        this.store = new Store({
          name: 'paat-settings',
          defaults: this.settings,
          schema: SETTINGS_SCHEMA,
          clearInvalidConfig: false, // Don't clear config with validation errors
          serialize: (value: any) => JSON.stringify(value, null, 2),
          deserialize: (text: string) => JSON.parse(text),
        });

        // Load settings from store
        this.loadSettings();
        
        // Watch for external changes
        this.store.onDidAnyChange((newValue: SettingsConfig, oldValue: SettingsConfig) => {
          this.settings = { ...newValue };
          this.emit('settingsChanged', {
            newValue,
            oldValue,
            timestamp: new Date(),
          });
        });
      } else {
        // Fallback for browser environments - use localStorage
        this.loadFromLocalStorage();
      }
      
      this.initialized = true;
      this.emit('initialized');
    } catch (error) {
      console.warn('Settings service initialization failed:', error);
      this.settings = { ...DEFAULT_SETTINGS };
      this.settings.projects.defaultPath = path.join(os.homedir(), 'PAAT Projects');
      this.initialized = true;
      this.emit('initialized');
    }
  }

  private loadSettings(): void {
    try {
      if (this.store) {
        const storedSettings = this.store.store;
        this.settings = this.mergeWithDefaults(storedSettings);
      }
    } catch (error) {
      console.warn('Failed to load settings, using defaults:', error);
      this.settings = { ...DEFAULT_SETTINGS };
      this.settings.projects.defaultPath = path.join(os.homedir(), 'PAAT Projects');
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('paat-settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.settings = this.mergeWithDefaults(parsed);
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    }
  }

  private mergeWithDefaults(stored: any): SettingsConfig {
    // Deep merge stored settings with defaults
    const merged = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    
    if (stored && typeof stored === 'object') {
      this.deepMerge(merged, stored);
    }
    
    // Ensure project path is set
    if (!merged.projects.defaultPath) {
      merged.projects.defaultPath = path.join(os.homedir(), 'PAAT Projects');
    }
    
    return merged;
  }

  private deepMerge(target: any, source: any): void {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {};
        }
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  // Public API
  async waitForInitialization(): Promise<void> {
    if (this.initialized) return;
    
    return new Promise((resolve) => {
      this.once('initialized', resolve);
    });
  }

  getSettings(): SettingsConfig {
    return JSON.parse(JSON.stringify(this.settings));
  }

  updateSettings(path: string, value: any): void {
    const oldValue = getNestedValue(this.settings, path);
    
    // Update in-memory settings
    setNestedValue(this.settings, path, value);
    
    // Persist to store
    try {
      if (this.store) {
        this.store.set(path, value);
      } else {
        // Fallback to localStorage
        localStorage.setItem('paat-settings', JSON.stringify(this.settings));
      }
      
      // Emit change event
      this.emit('settingChanged', {
        path,
        oldValue,
        newValue: value,
        timestamp: new Date(),
      } as SettingsChange);
      
    } catch (error) {
      console.error('Failed to update setting:', error);
      // Revert in-memory change if persistence failed
      setNestedValue(this.settings, path, oldValue);
      throw error;
    }
  }

  resetToDefaults(): void {
    try {
      const defaults = { ...DEFAULT_SETTINGS };
      defaults.projects.defaultPath = path.join(os.homedir(), 'PAAT Projects');
      
      this.settings = defaults;
      
      if (this.store) {
        this.store.clear();
      } else {
        localStorage.removeItem('paat-settings');
      }
      
      this.emit('settingsReset', {
        timestamp: new Date(),
      });
      
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  }

  exportSettings(): SettingsExport {
    return {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      settings: this.getSettings(),
      metadata: {
        appVersion: process.env.REACT_APP_VERSION || '0.3.0',
        platform: os.platform(),
        exportedBy: 'PAAT Settings Manager',
      },
    };
  }

  importSettings(settingsExport: SettingsExport | string): SettingsValidationResult {
    try {
      let parsed: SettingsExport;
      
      if (typeof settingsExport === 'string') {
        parsed = JSON.parse(settingsExport);
      } else {
        parsed = settingsExport;
      }
      
      if (!parsed.settings) {
        return {
          isValid: false,
          errors: [{ path: 'root', message: 'Invalid settings export format', value: parsed }],
          warnings: [],
        };
      }
      
      // Validate imported settings
      const validation = validateSettings(parsed.settings);
      if (!validation.isValid) {
        return validation;
      }
      
      // Merge with current settings (don't overwrite everything)
      const newSettings = this.mergeWithDefaults(parsed.settings);
      this.settings = newSettings;
      
      // Persist to store
      if (this.store) {
        this.store.store = newSettings;
      } else {
        localStorage.setItem('paat-settings', JSON.stringify(newSettings));
      }
      
      this.emit('settingsImported', {
        timestamp: new Date(),
        importedFrom: parsed.metadata?.exportedBy || 'Unknown',
      });
      
      return { isValid: true, errors: [], warnings: validation.warnings };
      
    } catch (error) {
      return {
        isValid: false,
        errors: [{ path: 'root', message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`, value: settingsExport }],
        warnings: [],
      };
    }
  }

  validateSettings(settings?: SettingsConfig): SettingsValidationResult {
    return validateSettings(settings || this.settings);
  }

  // Utility methods for specific settings
  getCurrentTheme(): 'light' | 'dark' {
    const theme = this.settings.app.theme;
    if (theme === 'system') {
      // Detect system theme
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light';
    }
    return theme;
  }

  getOllamaConfig() {
    return this.settings.aiServices.ollama;
  }

  getVamshConfig() {
    return this.settings.aiServices.vamsh;
  }

  getProjectConfig() {
    return this.settings.projects;
  }

  // Event handlers
  onSettingsChanged(callback: (change: SettingsChange) => void): void {
    this.on('settingChanged', callback);
  }

  onSettingsReset(callback: () => void): void {
    this.on('settingsReset', callback);
  }

  onSettingsImported(callback: (event: any) => void): void {
    this.on('settingsImported', callback);
  }
}

// Singleton instance
export const settingsService = new SettingsService();
