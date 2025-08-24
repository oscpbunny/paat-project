/**
 * PAAT - AI Personal Assistant Agent Tool
 * Electron Preload Script - Secure IPC Bridge
 */

import { contextBridge, ipcRenderer } from 'electron';

// Define API interface for type safety
export interface ElectronAPI {
  // App information
  app: {
    getVersion(): Promise<string>;
    getPlatform(): Promise<NodeJS.Platform>;
  };

  // Window controls
  window: {
    minimize(): Promise<void>;
    maximize(): Promise<void>;
    close(): Promise<void>;
    onStateChanged(callback: (state: { maximized: boolean }) => void): () => void;
  };

  // File system dialogs
  dialog: {
    openDirectory(): Promise<string | null>;
    openFile(filters?: Electron.FileFilter[]): Promise<string | null>;
  };

  // Notifications
  notification: {
    show(options: { title: string; body: string }): Promise<void>;
    onDisplay(callback: (options: { title: string; body: string }) => void): () => void;
  };

  // Menu events
  menu: {
    onNewProject(callback: () => void): () => void;
    onOpenProject(callback: () => void): () => void;
    onOpenSettings(callback: () => void): () => void;
  };

  // Development utilities
  dev: {
    openDevTools(): void;
    reload(): void;
    forceReload(): void;
  };
}

// Create the secure API bridge
const electronAPI: ElectronAPI = {
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getPlatform: () => ipcRenderer.invoke('app:getPlatform'),
  },

  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    onStateChanged: (callback) => {
      const subscription = (_: any, state: { maximized: boolean }) => callback(state);
      ipcRenderer.on('window:state-changed', subscription);
      return () => ipcRenderer.removeListener('window:state-changed', subscription);
    },
  },

  dialog: {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    openFile: (filters) => ipcRenderer.invoke('dialog:openFile', filters),
  },

  notification: {
    show: (options) => ipcRenderer.invoke('notification:show', options),
    onDisplay: (callback) => {
      const subscription = (_: any, options: { title: string; body: string }) => callback(options);
      ipcRenderer.on('notification:display', subscription);
      return () => ipcRenderer.removeListener('notification:display', subscription);
    },
  },

  menu: {
    onNewProject: (callback) => {
      const subscription = () => callback();
      ipcRenderer.on('menu:new-project', subscription);
      return () => ipcRenderer.removeListener('menu:new-project', subscription);
    },
    onOpenProject: (callback) => {
      const subscription = () => callback();
      ipcRenderer.on('menu:open-project', subscription);
      return () => ipcRenderer.removeListener('menu:open-project', subscription);
    },
    onOpenSettings: (callback) => {
      const subscription = () => callback();
      ipcRenderer.on('menu:open-settings', subscription);
      return () => ipcRenderer.removeListener('menu:open-settings', subscription);
    },
  },

  dev: {
    openDevTools: () => ipcRenderer.send('dev:open-dev-tools'),
    reload: () => ipcRenderer.send('dev:reload'),
    forceReload: () => ipcRenderer.send('dev:force-reload'),
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for global window object
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

// Additional security measures
window.addEventListener('DOMContentLoaded', () => {
  // Remove eval and Function constructors for security
  delete (window as any).eval;
  delete (window as any).Function;

  // Log successful preload initialization
  console.log('PAAT: Preload script initialized successfully');
});

// Handle any preload errors
process.once('uncaughtException', (error) => {
  console.error('PAAT Preload: Uncaught exception:', error);
});

process.once('unhandledRejection', (reason) => {
  console.error('PAAT Preload: Unhandled promise rejection:', reason);
});
