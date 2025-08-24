/**
 * PAAT - AI Personal Assistant Agent Tool
 * Theme State Store (Zustand)
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  border: {
    primary: string;
    secondary: string;
  };
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

export interface ThemeSettings {
  mode: ThemeMode;
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  borderRadius: 'sharp' | 'rounded' | 'smooth';
  animations: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
}

interface ThemeState {
  // Current theme settings
  settings: ThemeSettings;
  
  // Derived properties
  isDarkMode: boolean;
  currentColors: ThemeColors;
  
  // System preferences
  systemPrefersDark: boolean;
}

interface ThemeActions {
  // Theme mode actions
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  
  // Customization actions
  setAccentColor: (color: string) => void;
  setFontSize: (size: ThemeSettings['fontSize']) => void;
  setBorderRadius: (radius: ThemeSettings['borderRadius']) => void;
  
  // Accessibility actions
  toggleAnimations: () => void;
  toggleReducedMotion: () => void;
  toggleHighContrast: () => void;
  
  // System actions
  updateSystemPreference: (prefersDark: boolean) => void;
  
  // Utility actions
  resetTheme: () => void;
  applyTheme: () => void;
}

// Default theme settings
const defaultSettings: ThemeSettings = {
  mode: 'dark',
  accentColor: '#6366f1',
  fontSize: 'medium',
  borderRadius: 'rounded',
  animations: true,
  reducedMotion: false,
  highContrast: false,
};

// Theme color palettes
const lightColors: ThemeColors = {
  primary: '#6366f1',
  secondary: '#06b6d4',
  accent: '#6366f1',
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
  },
  text: {
    primary: '#1e293b',
    secondary: '#475569',
    tertiary: '#64748b',
  },
  border: {
    primary: '#e2e8f0',
    secondary: '#f1f5f9',
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
  },
};

const darkColors: ThemeColors = {
  primary: '#6366f1',
  secondary: '#06b6d4',
  accent: '#6366f1',
  background: {
    primary: '#0f0f23',
    secondary: '#1a1a2e',
    tertiary: '#16213e',
  },
  text: {
    primary: '#f8fafc',
    secondary: '#cbd5e1',
    tertiary: '#64748b',
  },
  border: {
    primary: '#334155',
    secondary: '#1e293b',
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
  },
};

// Helper functions
const getSystemPrefersDark = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const determineIsDarkMode = (mode: ThemeMode, systemPrefersDark: boolean): boolean => {
  switch (mode) {
    case 'dark':
      return true;
    case 'light':
      return false;
    case 'system':
      return systemPrefersDark;
    default:
      return true;
  }
};

const getCurrentColors = (isDark: boolean, accentColor: string): ThemeColors => {
  const baseColors = isDark ? darkColors : lightColors;
  return {
    ...baseColors,
    accent: accentColor,
    primary: accentColor,
  };
};

// CSS variables mapping
const applyCSSVariables = (colors: ThemeColors, settings: ThemeSettings) => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Colors
  root.style.setProperty('--primary-500', colors.primary);
  root.style.setProperty('--accent-500', colors.accent);
  root.style.setProperty('--bg-primary', colors.background.primary);
  root.style.setProperty('--bg-secondary', colors.background.secondary);
  root.style.setProperty('--bg-tertiary', colors.background.tertiary);
  root.style.setProperty('--text-primary', colors.text.primary);
  root.style.setProperty('--text-secondary', colors.text.secondary);
  root.style.setProperty('--text-tertiary', colors.text.tertiary);
  root.style.setProperty('--border-primary', colors.border.primary);
  root.style.setProperty('--border-secondary', colors.border.secondary);
  root.style.setProperty('--status-success', colors.status.success);
  root.style.setProperty('--status-warning', colors.status.warning);
  root.style.setProperty('--status-error', colors.status.error);
  root.style.setProperty('--status-info', colors.status.info);

  // Font size
  const fontSizeMap = {
    small: '14px',
    medium: '16px',
    large: '18px',
  };
  root.style.setProperty('--font-size-base', fontSizeMap[settings.fontSize]);

  // Border radius
  const borderRadiusMap = {
    sharp: '0px',
    rounded: '6px',
    smooth: '12px',
  };
  root.style.setProperty('--radius-base', borderRadiusMap[settings.borderRadius]);

  // Animations
  root.style.setProperty(
    '--animation-duration',
    settings.animations && !settings.reducedMotion ? '0.2s' : '0.01ms'
  );

  // High contrast adjustments
  if (settings.highContrast) {
    root.style.setProperty('--text-primary', colors.text.primary);
    root.style.setProperty('--border-primary', '#ffffff');
  }
};

// Create the theme store
export const useThemeStore = create<ThemeState & ThemeActions>()(
  devtools(
    persist(
      (set, get) => {
        // Initialize system preference detection
        const systemPrefersDark = getSystemPrefersDark();
        
        return {
          // Initial state
          settings: defaultSettings,
          systemPrefersDark,
          isDarkMode: determineIsDarkMode(defaultSettings.mode, systemPrefersDark),
          currentColors: getCurrentColors(
            determineIsDarkMode(defaultSettings.mode, systemPrefersDark),
            defaultSettings.accentColor
          ),

          // Theme mode actions
          setThemeMode: (mode) => {
            set((state) => {
              const newIsDarkMode = determineIsDarkMode(mode, state.systemPrefersDark);
              const newColors = getCurrentColors(newIsDarkMode, state.settings.accentColor);
              
              const newState = {
                settings: { ...state.settings, mode },
                isDarkMode: newIsDarkMode,
                currentColors: newColors,
              };

              // Apply CSS variables
              applyCSSVariables(newColors, { ...state.settings, mode });
              
              return newState;
            });
          },

          toggleThemeMode: () => {
            const { settings } = get();
            const newMode: ThemeMode = settings.mode === 'dark' ? 'light' : 'dark';
            get().setThemeMode(newMode);
          },

          // Customization actions
          setAccentColor: (color) => {
            set((state) => {
              const newColors = getCurrentColors(state.isDarkMode, color);
              const newSettings = { ...state.settings, accentColor: color };
              
              applyCSSVariables(newColors, newSettings);
              
              return {
                settings: newSettings,
                currentColors: newColors,
              };
            });
          },

          setFontSize: (fontSize) => {
            set((state) => {
              const newSettings = { ...state.settings, fontSize };
              applyCSSVariables(state.currentColors, newSettings);
              return { settings: newSettings };
            });
          },

          setBorderRadius: (borderRadius) => {
            set((state) => {
              const newSettings = { ...state.settings, borderRadius };
              applyCSSVariables(state.currentColors, newSettings);
              return { settings: newSettings };
            });
          },

          // Accessibility actions
          toggleAnimations: () => {
            set((state) => {
              const newSettings = { ...state.settings, animations: !state.settings.animations };
              applyCSSVariables(state.currentColors, newSettings);
              return { settings: newSettings };
            });
          },

          toggleReducedMotion: () => {
            set((state) => {
              const newSettings = { ...state.settings, reducedMotion: !state.settings.reducedMotion };
              applyCSSVariables(state.currentColors, newSettings);
              return { settings: newSettings };
            });
          },

          toggleHighContrast: () => {
            set((state) => {
              const newSettings = { ...state.settings, highContrast: !state.settings.highContrast };
              applyCSSVariables(state.currentColors, newSettings);
              return { settings: newSettings };
            });
          },

          // System actions
          updateSystemPreference: (prefersDark) => {
            set((state) => {
              const newIsDarkMode = determineIsDarkMode(state.settings.mode, prefersDark);
              const newColors = getCurrentColors(newIsDarkMode, state.settings.accentColor);
              
              if (state.settings.mode === 'system') {
                applyCSSVariables(newColors, state.settings);
              }
              
              return {
                systemPrefersDark: prefersDark,
                isDarkMode: newIsDarkMode,
                currentColors: newColors,
              };
            });
          },

          // Utility actions
          resetTheme: () => {
            const systemPrefersDark = get().systemPrefersDark;
            const newIsDarkMode = determineIsDarkMode(defaultSettings.mode, systemPrefersDark);
            const newColors = getCurrentColors(newIsDarkMode, defaultSettings.accentColor);
            
            set({
              settings: defaultSettings,
              isDarkMode: newIsDarkMode,
              currentColors: newColors,
            });

            applyCSSVariables(newColors, defaultSettings);
          },

          applyTheme: () => {
            const { currentColors, settings } = get();
            applyCSSVariables(currentColors, settings);
          },
        };
      },
      {
        name: 'paat-theme-store',
        partialize: (state) => ({
          settings: state.settings,
        }),
      }
    ),
    {
      name: 'PAAT Theme Store',
    }
  )
);

// System preference listener setup
export const setupSystemThemeListener = () => {
  if (typeof window === 'undefined') return;

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e: MediaQueryListEvent) => {
    useThemeStore.getState().updateSystemPreference(e.matches);
  };

  mediaQuery.addEventListener('change', handleChange);
  
  // Return cleanup function
  return () => {
    mediaQuery.removeEventListener('change', handleChange);
  };
};

// Initialize theme on app start
export const initializeTheme = () => {
  const store = useThemeStore.getState();
  store.updateSystemPreference(getSystemPrefersDark());
  store.applyTheme();
  
  // Setup system listener
  return setupSystemThemeListener();
};
