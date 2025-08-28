import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { settingsService } from '../services/SettingsService';
import {
  SettingsConfig,
  SettingsChange,
  SettingsExport,
  SettingsValidationResult,
  TestResults,
  ConnectionTestResult,
} from '../types/settings';

interface SettingsStore {
  // State
  settings: SettingsConfig;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  testResults: TestResults;
  
  // Actions
  initialize: () => Promise<void>;
  loadSettings: () => Promise<void>;
  updateSettings: (path: string, value: any) => Promise<void>;
  resetSettings: () => Promise<void>;
  exportSettings: () => SettingsExport;
  importSettings: (settingsData: string | SettingsExport) => Promise<SettingsValidationResult>;
  validateSettings: () => SettingsValidationResult;
  
  // Connection testing
  testConnection: (service: 'ollama' | 'vamsh') => Promise<void>;
  clearTestResults: () => void;
  
  // Utility methods
  getCurrentTheme: () => 'light' | 'dark';
  getEffectiveSettings: () => SettingsConfig;
  
  // Internal methods
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSettings: (settings: SettingsConfig) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    settings: {} as SettingsConfig,
    isLoading: true,
    isInitialized: false,
    error: null,
    testResults: {},

    // Initialize the store
    initialize: async () => {
      try {
        set({ isLoading: true, error: null });
        
        // Wait for settings service to initialize
        await settingsService.waitForInitialization();
        
        // Load initial settings
        const settings = settingsService.getSettings();
        set({ 
          settings,
          isLoading: false,
          isInitialized: true,
          error: null,
        });
        
        // Set up event listeners
        settingsService.onSettingsChanged((change: SettingsChange) => {
          const currentSettings = get().settings;
          const updatedSettings = { ...currentSettings };
          
          // Update the specific path that changed
          const keys = change.path.split('.');
          let target = updatedSettings;
          for (let i = 0; i < keys.length - 1; i++) {
            target = target[keys[i] as keyof typeof target] as any;
          }
          target[keys[keys.length - 1] as keyof typeof target] = change.newValue;
          
          set({ settings: updatedSettings });
        });
        
        settingsService.onSettingsReset(() => {
          const settings = settingsService.getSettings();
          set({ settings, testResults: {} });
        });
        
        settingsService.onSettingsImported(() => {
          const settings = settingsService.getSettings();
          set({ settings, testResults: {} });
        });
        
      } catch (error) {
        console.error('Settings store initialization failed:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to initialize settings',
          isLoading: false,
          isInitialized: true, // Still mark as initialized to prevent infinite loading
        });
      }
    },

    // Load settings from service
    loadSettings: async () => {
      try {
        set({ isLoading: true, error: null });
        const settings = settingsService.getSettings();
        set({ settings, isLoading: false });
      } catch (error) {
        console.error('Failed to load settings:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to load settings',
          isLoading: false,
        });
      }
    },

    // Update a specific setting
    updateSettings: async (path: string, value: any) => {
      try {
        set({ error: null });
        settingsService.updateSettings(path, value);
        
        // The settings will be updated via the event listener
        // but we can optimistically update the UI
        const currentSettings = get().settings;
        const updatedSettings = { ...currentSettings };
        
        // Update the specific path
        const keys = path.split('.');
        let target = updatedSettings;
        for (let i = 0; i < keys.length - 1; i++) {
          target = target[keys[i] as keyof typeof target] as any;
        }
        target[keys[keys.length - 1] as keyof typeof target] = value;
        
        set({ settings: updatedSettings });
        
      } catch (error) {
        console.error('Failed to update setting:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to update setting',
        });
        throw error;
      }
    },

    // Reset all settings to defaults
    resetSettings: async () => {
      try {
        set({ isLoading: true, error: null });
        settingsService.resetToDefaults();
        
        const settings = settingsService.getSettings();
        set({
          settings,
          testResults: {}, // Clear test results
          isLoading: false,
        });
        
      } catch (error) {
        console.error('Failed to reset settings:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to reset settings',
          isLoading: false,
        });
        throw error;
      }
    },

    // Export settings
    exportSettings: () => {
      try {
        return settingsService.exportSettings();
      } catch (error) {
        console.error('Failed to export settings:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to export settings',
        });
        throw error;
      }
    },

    // Import settings
    importSettings: async (settingsData: string | SettingsExport) => {
      try {
        set({ isLoading: true, error: null });
        
        const result = settingsService.importSettings(settingsData);
        
        if (result.isValid) {
          const settings = settingsService.getSettings();
          set({
            settings,
            testResults: {}, // Clear test results after import
            isLoading: false,
          });
        } else {
          set({
            error: `Import failed: ${result.errors.map(e => e.message).join(', ')}`,
            isLoading: false,
          });
        }
        
        return result;
        
      } catch (error) {
        console.error('Failed to import settings:', error);
        const errorResult: SettingsValidationResult = {
          isValid: false,
          errors: [{
            path: 'root',
            message: error instanceof Error ? error.message : 'Import failed',
            value: settingsData,
          }],
          warnings: [],
        };
        
        set({
          error: errorResult.errors[0].message,
          isLoading: false,
        });
        
        return errorResult;
      }
    },

    // Validate current settings
    validateSettings: () => {
      try {
        return settingsService.validateSettings();
      } catch (error) {
        console.error('Settings validation failed:', error);
        return {
          isValid: false,
          errors: [{
            path: 'root',
            message: error instanceof Error ? error.message : 'Validation failed',
            value: get().settings,
          }],
          warnings: [],
        };
      }
    },

    // Test service connections
    testConnection: async (service: 'ollama' | 'vamsh') => {
      const { settings, testResults } = get();
      
      // Set testing status
      set({
        testResults: {
          ...testResults,
          [service]: {
            status: 'testing',
            timestamp: new Date(),
          } as ConnectionTestResult,
        },
      });

      try {
        let result: ConnectionTestResult;
        
        if (service === 'ollama') {
          // Test Ollama connection
          const config = settings.aiServices.ollama;
          const startTime = Date.now();
          
          const response = await fetch(`${config.endpoint}/api/tags`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(config.timeout || 10000),
          });
          
          const responseTime = Date.now() - startTime;
          
          if (response.ok) {
            const data = await response.json();
            result = {
              status: 'success',
              message: `Connected successfully (${responseTime}ms)`,
              details: {
                models: data.models?.map((m: any) => m.name) || [],
                responseTime,
              },
              timestamp: new Date(),
            };
          } else {
            result = {
              status: 'error',
              error: `HTTP ${response.status}: ${response.statusText}`,
              timestamp: new Date(),
            };
          }
          
        } else if (service === 'vamsh') {
          // Test Vamsh connection
          const config = settings.aiServices.vamsh;
          const startTime = Date.now();
          
          const response = await fetch(`${config.endpoint}/health`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` }),
            },
            signal: AbortSignal.timeout(config.timeout || 10000),
          });
          
          const responseTime = Date.now() - startTime;
          
          if (response.ok) {
            const data = await response.json();
            result = {
              status: 'success',
              message: `Connected successfully (${responseTime}ms)`,
              details: {
                health: data,
                responseTime,
              },
              timestamp: new Date(),
            };
          } else {
            result = {
              status: 'error',
              error: `HTTP ${response.status}: ${response.statusText}`,
              timestamp: new Date(),
            };
          }
        } else {
          throw new Error(`Unknown service: ${service}`);
        }
        
        // Update test results
        set({
          testResults: {
            ...get().testResults,
            [service]: result,
          },
        });
        
      } catch (error) {
        console.error(`Connection test failed for ${service}:`, error);
        
        const result: ConnectionTestResult = {
          status: 'error',
          error: error instanceof Error ? error.message : `Connection test failed for ${service}`,
          timestamp: new Date(),
        };
        
        set({
          testResults: {
            ...get().testResults,
            [service]: result,
          },
        });
      }
    },

    // Clear connection test results
    clearTestResults: () => {
      set({ testResults: {} });
    },

    // Get current effective theme (resolves 'system' to actual theme)
    getCurrentTheme: () => {
      return settingsService.getCurrentTheme();
    },

    // Get settings with computed values
    getEffectiveSettings: () => {
      const { settings } = get();
      return {
        ...settings,
        app: {
          ...settings.app,
          effectiveTheme: settingsService.getCurrentTheme(),
        },
      };
    },

    // Internal state setters
    setLoading: (loading: boolean) => set({ isLoading: loading }),
    setError: (error: string | null) => set({ error }),
    setSettings: (settings: SettingsConfig) => set({ settings }),
  }))
);

// Selectors for specific parts of settings
export const useAppSettings = () => useSettingsStore(state => state.settings.app);
export const useAIServiceSettings = () => useSettingsStore(state => state.settings.aiServices);
export const useProjectSettings = () => useSettingsStore(state => state.settings.projects);
export const useDevelopmentSettings = () => useSettingsStore(state => state.settings.development);
export const useUISettings = () => useSettingsStore(state => state.settings.ui);

// Selector for current theme
export const useCurrentTheme = () => useSettingsStore(state => state.getCurrentTheme());

// Selector for connection test results
export const useConnectionTests = () => useSettingsStore(state => state.testResults);

// Initialize the store when the module is loaded
// This ensures settings are loaded before any components use them
useSettingsStore.getState().initialize().catch(console.error);
