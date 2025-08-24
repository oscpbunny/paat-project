/**
 * PAAT - AI Personal Assistant Agent Tool
 * Main React Application Component
 */

import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

// Import custom components
import TitleBar from './components/TitleBar/TitleBar';
import Sidebar from './components/Sidebar/Sidebar';
import MainContent from './components/MainContent/MainContent';
import StatusBar from './components/StatusBar/StatusBar';
import NotificationSystem from './components/NotificationSystem/NotificationSystem';

// Import custom styles
import '../styles/globals.css';

// Import stores
import { useAppStore } from './stores/appStore';
import { useThemeStore } from './stores/themeStore';

// Create MUI theme
const createMUITheme = (darkMode: boolean) =>
  createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#6366f1',
        dark: '#4f46e5',
        light: '#818cf8',
      },
      secondary: {
        main: '#06b6d4',
        dark: '#0891b2',
        light: '#67e8f9',
      },
      background: {
        default: darkMode ? '#0f0f23' : '#ffffff',
        paper: darkMode ? '#1a1a2e' : '#f8fafc',
      },
      text: {
        primary: darkMode ? '#f8fafc' : '#1e293b',
        secondary: darkMode ? '#cbd5e1' : '#475569',
      },
    },
    typography: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
      h1: { fontWeight: 600 },
      h2: { fontWeight: 600 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 500 },
      h6: { fontWeight: 500 },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: 8,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
          },
        },
      },
    },
  });

const App: React.FC = () => {
  // Global state
  const { isLoading, currentProject, sidebarCollapsed } = useAppStore();
  const { isDarkMode } = useThemeStore();
  
  // Local state
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);
  const [appVersion, setAppVersion] = useState<string>('');

  // Theme
  const theme = createMUITheme(isDarkMode);

  // Initialize app
  useEffect(() => {
    initializeApp();
    setupWindowEventListeners();
    
    return () => {
      // Cleanup event listeners
      window.electronAPI?.window.onStateChanged(() => {});
    };
  }, []);

  const initializeApp = async () => {
    try {
      // Get app version
      const version = await window.electronAPI?.app.getVersion();
      if (version) {
        setAppVersion(version);
      }

      // Initialize other app services
      console.log('PAAT: App initialized successfully');
    } catch (error) {
      console.error('PAAT: Failed to initialize app:', error);
    }
  };

  const setupWindowEventListeners = () => {
    // Listen for window state changes
    const unsubscribeWindowState = window.electronAPI?.window.onStateChanged(
      ({ maximized }) => {
        setIsWindowMaximized(maximized);
      }
    );

    // Return cleanup function
    return unsubscribeWindowState;
  };

  // Layout animation variants
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1 
      }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  const sidebarVariants = {
    initial: { x: -240, opacity: 0 },
    animate: { 
      x: 0, 
      opacity: 1,
      transition: { 
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    }
  };

  const mainContentVariants = {
    initial: { x: 20, opacity: 0 },
    animate: { 
      x: 0, 
      opacity: 1,
      transition: { 
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      <motion.div
        className="app-layout"
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* Custom Title Bar */}
        <TitleBar 
          title="PAAT - AI Personal Assistant Agent Tool"
          subtitle={currentProject?.name || 'No project selected'}
          isMaximized={isWindowMaximized}
          version={appVersion}
        />

        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar */}
          <AnimatePresence mode="wait">
            <motion.div
              key="sidebar"
              variants={sidebarVariants}
              style={{
                width: sidebarCollapsed ? 60 : 240,
                flexShrink: 0,
                transition: 'width 0.2s ease-out'
              }}
            >
              <Sidebar collapsed={sidebarCollapsed} />
            </motion.div>
          </AnimatePresence>

          {/* Main Content Area */}
          <motion.div
            variants={mainContentVariants}
            style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <MainContent />
          </motion.div>
        </Box>

        {/* Status Bar */}
        <StatusBar />

        {/* Notification System */}
        <NotificationSystem />

        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="loading-overlay"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 15, 35, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                backdropFilter: 'blur(4px)'
              }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  width: 60,
                  height: 60,
                  border: '3px solid #6366f1',
                  borderTop: '3px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

    </ThemeProvider>
  );
};

export default App;
